// Turn-based battle engine. The UI calls battle.turn(action) and plays back the returned events.
// Event shapes:
//   { t: 'msg', text }            a line for the text box
//   { t: 'hp', side, hp }         animate a side's HP bar to this value
//   { t: 'send', side, mon }      a new Pokémon comes out
//   { t: 'faint', side }          the active Pokémon faints
//   { t: 'hit', side } / { t: 'attack', side }   animation cues
//   { t: 'refresh' }              re-read level/status/xp from the live Pokémon
// Actions: {type:'move', idx} (idx -1 = Struggle), {type:'switch', idx}, {type:'item', item, target},
//          {type:'ball', item}, {type:'run'}

class Battle {
  constructor({ kind, playerParty, enemyParty, trainer, bag }) {
    this.kind = kind; // 'wild' | 'trainer'
    this.trainer = trainer || null;
    this.bag = bag;
    this.sides = {
      p: { party: playerParty, active: playerParty.findIndex((m) => m.hp > 0), vol: this.freshVol() },
      e: { party: enemyParty, active: 0, vol: this.freshVol() },
    };
    this.state = 'choose'; // 'choose' | 'forceSwitch' | 'over'
    this.result = null; // 'win' | 'lose' | 'run' | 'caught'
    this.runAttempts = 0;
    this.pendingLearn = []; // [{ mon, move }]
    this.participants = new Set([this.active('p').uid]);
    this.events = [];
  }

  freshVol() { return { stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, flinch: false, tf: null, moved: false }; }
  active(side) { const s = this.sides[side]; return s.party[s.active]; }
  foe(side) { return side === 'p' ? 'e' : 'p'; }
  push(e) { this.events.push(e); }
  msg(text) { this.push({ t: 'msg', text }); }
  label(side) {
    const name = monName(this.active(side));
    if (side === 'p') return name;
    return this.kind === 'wild' ? `The wild ${name}` : `The foe's ${name}`;
  }
  hpEvent(side) { this.push({ t: 'hp', side, hp: this.active(side).hp }); }

  // ----- Effective values (Transform overrides species data) -----
  types(side) { const v = this.sides[side].vol; return v.tf ? v.tf.types : POKEMON[this.active(side).id].types; }
  movesOf(side) { const v = this.sides[side].vol; return v.tf ? v.tf.moves : this.active(side).moves; }
  stat(side, key, opts = {}) {
    const mon = this.active(side);
    const v = this.sides[side].vol;
    let base = v.tf ? v.tf.stats[key] : mon.stats[key];
    let st = v.stages[key];
    if (opts.ignoreDrops && st < 0) st = 0;
    if (opts.ignoreBoosts && st > 0) st = 0;
    let val = base * (st >= 0 ? (2 + st) / 2 : 2 / (2 - st));
    if (key === 'spe' && mon.status === 'par') val *= 0.5;
    return Math.max(1, Math.floor(val));
  }

  // ----- Damage -----
  calcDamage(atkSide, defSide, move, { crit = false, roll = null } = {}) {
    const atk = this.active(atkSide);
    const eff = move.typeless ? 1 : typeEffectiveness(move.type, this.types(defSide));
    if (eff === 0) return { dmg: 0, eff };
    if (move.fixed === 'level') return { dmg: atk.level, eff: 1 };
    const phys = move.cat === 'P';
    const A = this.stat(atkSide, phys ? 'atk' : 'spa', { ignoreDrops: crit });
    const D = this.stat(defSide, phys ? 'def' : 'spd', { ignoreBoosts: crit });
    let dmg = Math.floor(Math.floor((Math.floor((2 * atk.level) / 5 + 2) * move.pow * A) / D) / 50) + 2;
    if (crit) dmg *= 1.5;
    dmg *= roll == null ? 0.85 + RNG.next() * 0.15 : roll;
    if (!move.typeless && this.types(atkSide).includes(move.type)) dmg *= 1.5;
    dmg *= eff;
    if (phys && atk.status === 'brn') dmg *= 0.5;
    return { dmg: Math.max(1, Math.floor(dmg)), eff };
  }

  // ----- Turn -----
  turn(action) {
    this.events = [];
    if (this.state === 'over') return this.events;
    if (this.state === 'forceSwitch') {
      this.switchIn('p', action.idx);
      this.state = 'choose';
      return this.events;
    }
    this.sides.p.vol.moved = false; this.sides.e.vol.moved = false;
    this.sides.p.vol.flinch = false; this.sides.e.vol.flinch = false;

    const enemyAction = this.chooseEnemyAction();

    // Non-move player actions happen first.
    if (action.type === 'run') {
      if (this.tryRun()) { this.msg('Got away safely!'); this.end('run'); return this.events; }
      this.msg("Can't escape!");
    } else if (action.type === 'ball') {
      if (this.throwBall(action.item)) return this.events;
    } else if (action.type === 'item') {
      this.useItem(action.item, action.target);
    } else if (action.type === 'switch') {
      this.msg(`${monName(this.active('p'))}, come back!`);
      this.switchIn('p', action.idx);
    }

    // Moves, ordered by priority then speed.
    const queue = [];
    if (action.type === 'move') queue.push({ side: 'p', idx: action.idx });
    queue.push({ side: 'e', idx: enemyAction.idx });
    const prio = (q) => (q.idx < 0 ? 0 : MOVES[this.movesOf(q.side)[q.idx].id].prio);
    queue.sort((a, b) => prio(b) - prio(a) || this.stat(b.side, 'spe') - this.stat(a.side, 'spe') || (RNG.next() < 0.5 ? -1 : 1));
    for (const q of queue) {
      if (this.active(q.side).hp <= 0 || this.active(this.foe(q.side)).hp <= 0) continue;
      this.useMove(q.side, q.idx);
      this.sides[q.side].vol.moved = true;
      if (this.checkFaints()) return this.events;
    }

    // End of turn: burn and poison damage.
    for (const side of ['p', 'e']) {
      const mon = this.active(side);
      if (mon.hp <= 0) continue;
      if (mon.status === 'brn' || mon.status === 'psn') {
        const d = Math.max(1, Math.floor(mon.stats.hp / (mon.status === 'brn' ? 16 : 8)));
        mon.hp = Math.max(0, mon.hp - d);
        this.msg(`${this.label(side)} is hurt by its ${mon.status === 'brn' ? 'burn' : 'poison'}!`);
        this.hpEvent(side);
      }
    }
    this.checkFaints();
    return this.events;
  }

  // Returns true if the battle ended or the player must pick a replacement.
  checkFaints() {
    let stop = false;
    const e = this.active('e');
    if (e.hp <= 0 && !e._fainted) {
      e._fainted = true;
      this.msg(`${this.label('e')} fainted!`);
      this.push({ t: 'faint', side: 'e' });
      this.awardXp(e);
      const next = this.sides.e.party.findIndex((m) => m.hp > 0);
      if (next < 0) { this.end('win'); return true; }
      stop = true;
      this.switchIn('e', next);
    }
    const p = this.active('p');
    if (p.hp <= 0 && !p._fainted) {
      p._fainted = true;
      this.msg(`${monName(p)} fainted!`);
      this.push({ t: 'faint', side: 'p' });
      if (!this.sides.p.party.some((m) => m.hp > 0)) {
        this.msg('You have no more Pokémon that can fight!');
        this.end('lose');
        return true;
      }
      this.state = 'forceSwitch';
      stop = true;
    }
    return stop;
  }

  end(result) {
    this.result = result;
    this.state = 'over';
    for (const m of this.sides.p.party) delete m._fainted;
  }

  awardXp(defeated) {
    const total = xpYield(defeated, this.kind === 'trainer');
    const party = this.sides.p.party;
    const lead = this.active('p');
    for (const mon of party) {
      if (mon.hp <= 0 || mon.level >= 100) continue;
      const fought = mon === lead || this.participants.has(mon.uid);
      const amount = fought ? total : Math.floor(total / 2);
      const evs = gainXp(mon, amount);
      if (fought) this.msg(`${monName(mon)} gained ${amount} Exp. Points!`);
      for (const ev of evs) {
        if (ev.levelUp) this.msg(`${monName(mon)} grew to level ${ev.levelUp}!`);
        if (ev.learn) this.msg(`${monName(mon)} learned ${MOVES[ev.learn].name}!`);
        if (ev.learnPending) this.pendingLearn.push({ mon, move: ev.learnPending });
      }
    }
    if (party.some((m) => m !== lead && m.hp > 0 && !this.participants.has(m.uid))) this.msg('The rest of your team gained Exp. Points too.');
    this.push({ t: 'refresh' });
  }

  switchIn(side, idx) {
    const s = this.sides[side];
    s.active = idx;
    s.vol = this.freshVol();
    const mon = this.active(side);
    delete mon._fainted;
    if (side === 'p') { this.participants.add(mon.uid); this.msg(`Go, ${monName(mon)}!`); }
    else this.msg(`${this.trainer ? this.trainer.title : 'The foe'} sent out ${monName(mon)}!`);
    this.push({ t: 'send', side, mon });
  }

  tryRun() {
    if (this.kind !== 'wild') return false;
    this.runAttempts++;
    const ps = this.stat('p', 'spe'), es = this.stat('e', 'spe');
    if (ps >= es) return true;
    return RNG.next() * 256 < (ps * 128) / es + 30 * this.runAttempts;
  }

  throwBall(itemId) {
    const item = ITEMS[itemId];
    this.bag[itemId]--;
    const target = this.active('e');
    this.msg(`You threw a ${item.name}!`);
    if (tryCatch(target, item.ball)) {
      this.msg(`Gotcha! ${monName(target)} was caught!`);
      this.end('caught');
      return true;
    }
    this.msg(RNG.pick(['Oh no! The Pokémon broke free!', 'Aww! It appeared to be caught!', 'Argh! Almost had it!']));
    return false;
  }

  useItem(itemId, targetIdx) {
    const item = ITEMS[itemId];
    const mon = this.sides.p.party[targetIdx];
    this.bag[itemId]--;
    this.msg(`You used a ${item.name} on ${monName(mon)}.`);
    if (item.kind === 'heal') {
      const before = mon.hp;
      mon.hp = Math.min(mon.stats.hp, mon.hp + item.heal);
      this.msg(`${monName(mon)} recovered ${mon.hp - before} HP.`);
    } else if (item.kind === 'cure') {
      mon.status = null; mon.slp = 0;
      this.msg(`${monName(mon)} is cured!`);
    } else if (item.kind === 'revive') {
      mon.hp = Math.floor(mon.stats.hp / 2);
      this.msg(`${monName(mon)} was revived!`);
    }
    if (mon === this.active('p')) this.hpEvent('p');
    this.push({ t: 'refresh' });
  }

  // ----- Moves -----
  useMove(side, idx) {
    const mon = this.active(side);
    const vol = this.sides[side].vol;
    const tSide = this.foe(side);
    const target = this.active(tSide);

    // Status checks.
    if (mon.status === 'slp') {
      mon.slp--;
      if (mon.slp > 0) { this.msg(`${this.label(side)} is fast asleep.`); return; }
      mon.status = null;
      this.msg(`${this.label(side)} woke up!`);
      this.push({ t: 'refresh' });
    }
    if (mon.status === 'frz') {
      if (RNG.chance(20)) { mon.status = null; this.msg(`${this.label(side)} thawed out!`); this.push({ t: 'refresh' }); }
      else { this.msg(`${this.label(side)} is frozen solid!`); return; }
    }
    if (vol.flinch) { this.msg(`${this.label(side)} flinched and couldn't move!`); return; }
    if (mon.status === 'par' && RNG.chance(25)) { this.msg(`${this.label(side)} is paralyzed! It can't move!`); return; }

    let move;
    if (idx < 0) move = MOVES.struggle;
    else {
      const slot = this.movesOf(side)[idx];
      move = MOVES[slot.id];
      slot.pp = Math.max(0, slot.pp - 1);
    }
    this.msg(`${this.label(side)} used ${move.name}!`);
    this.push({ t: 'attack', side });

    if (move.special === 'splash') { this.msg('But nothing happened!'); return; }
    if (move.special === 'haze') {
      this.sides.p.vol.stages = this.freshVol().stages; this.sides.e.vol.stages = this.freshVol().stages;
      this.msg('All stat changes were eliminated!');
      return;
    }
    if (move.special === 'transform') {
      const src = this.sides[tSide].vol.tf;
      vol.tf = {
        id: target.id,
        types: [...this.types(tSide)],
        stats: { ...(src ? src.stats : target.stats), hp: mon.stats.hp },
        moves: this.movesOf(tSide).map((m) => ({ id: m.id, pp: 5 })),
      };
      this.msg(`${this.label(side)} transformed into ${monName(target)}!`);
      this.push({ t: 'send', side, mon, tfId: target.id });
      return;
    }

    // Accuracy.
    if (move.acc && !RNG.chance(move.acc)) { this.msg(`${this.label(side)}'s attack missed!`); return; }

    if (move.cat === 'X') { this.applyStatusMove(side, tSide, move); return; }

    const crit = !move.fixed && RNG.chance(move.crit ? 12.5 : 6.25);
    const { dmg, eff } = this.calcDamage(side, tSide, move, { crit });
    if (eff === 0) { this.msg(`It doesn't affect ${this.label(tSide).replace(/^The/, 'the')}...`); return; }
    const dealt = Math.min(target.hp, dmg);
    target.hp -= dealt;
    this.push({ t: 'hit', side: tSide });
    this.hpEvent(tSide);
    if (crit) this.msg('A critical hit!');
    if (eff > 1) this.msg("It's super effective!");
    else if (eff < 1) this.msg("It's not very effective...");

    if (move.drain && dealt > 0 && mon.hp < mon.stats.hp) {
      const h = Math.max(1, Math.floor(dealt * move.drain));
      mon.hp = Math.min(mon.stats.hp, mon.hp + h);
      this.msg(`${this.label(tSide)} had its energy drained!`);
      this.hpEvent(side);
    }
    if (move.recoil && dealt > 0) {
      const r = Math.max(1, Math.floor(dealt * move.recoil));
      mon.hp = Math.max(0, mon.hp - r);
      this.msg(`${this.label(side)} is damaged by recoil!`);
      this.hpEvent(side);
    }
    if (target.hp > 0) {
      if (move.status && RNG.chance(move.status.chance)) this.inflict(tSide, move.status.s, false);
      if (move.flinch && !this.sides[tSide].vol.moved && RNG.chance(move.flinch)) this.sides[tSide].vol.flinch = true;
      if (move.stat && move.stat.who === 'foe' && RNG.chance(move.stat.chance)) this.changeStats(tSide, move.stat.ch);
    }
    if (move.stat && move.stat.who === 'self' && mon.hp > 0) this.changeStats(side, move.stat.ch);
  }

  applyStatusMove(side, tSide, move) {
    if (move.status) {
      if (move.type === 'Electric' && typeEffectiveness('Electric', this.types(tSide)) === 0) {
        this.msg(`It doesn't affect ${this.label(tSide).replace(/^The/, 'the')}...`);
        return;
      }
      this.inflict(tSide, move.status.s, true);
    }
    if (move.stat) this.changeStats(move.stat.who === 'self' ? side : tSide, move.stat.ch);
  }

  inflict(side, s, announceFail) {
    const mon = this.active(side);
    const types = this.types(side);
    const immune = (s === 'brn' && types.includes('Fire')) || (s === 'psn' && (types.includes('Poison') || types.includes('Steel'))) ||
      (s === 'par' && types.includes('Electric')) || (s === 'frz' && types.includes('Ice'));
    if (mon.status || immune) {
      if (announceFail) this.msg('But it failed!');
      return;
    }
    mon.status = s;
    if (s === 'slp') mon.slp = RNG.int(1, 3) + 1;
    const text = { brn: 'was burned', psn: 'was poisoned', par: 'is paralyzed! It may be unable to move', slp: 'fell asleep', frz: 'was frozen solid' }[s];
    this.msg(`${this.label(side)} ${text}!`);
    this.push({ t: 'refresh' });
  }

  changeStats(side, changes) {
    const st = this.sides[side].vol.stages;
    for (const [k, d] of Object.entries(changes)) {
      const before = st[k];
      st[k] = Math.max(-6, Math.min(6, st[k] + d));
      const name = STAT_NAMES[k];
      if (st[k] === before) this.msg(`${this.label(side)}'s ${name} won't go any ${d > 0 ? 'higher' : 'lower'}!`);
      else if (d >= 2) this.msg(`${this.label(side)}'s ${name} sharply rose!`);
      else if (d > 0) this.msg(`${this.label(side)}'s ${name} rose!`);
      else if (d <= -2) this.msg(`${this.label(side)}'s ${name} harshly fell!`);
      else this.msg(`${this.label(side)}'s ${name} fell!`);
    }
  }

  // ----- Enemy AI -----
  chooseEnemyAction() {
    const moves = this.movesOf('e');
    const usable = moves.map((m, i) => i).filter((i) => moves[i].pp > 0);
    if (!usable.length) return { idx: -1 };
    if (this.kind === 'wild') return { idx: RNG.pick(usable) };
    // Trainers: pick the move with the best expected value, with a little randomness.
    const me = this.active('e');
    const foe = this.active('p');
    let best = usable[0], bestScore = -1;
    for (const i of usable) {
      const mv = MOVES[moves[i].id];
      let score;
      if (mv.cat === 'X') {
        score = 0;
        if (mv.status && !foe.status && foe.hp > foe.stats.hp * 0.4) score = 0.3;
        if (mv.stat && mv.stat.who === 'self' && me.hp > me.stats.hp * 0.6) {
          const k = Object.keys(mv.stat.ch)[0];
          if (this.sides.e.vol.stages[k] < 2) score = 0.25;
        }
        if (mv.stat && mv.stat.who === 'foe' && this.sides.p.vol.stages[Object.keys(mv.stat.ch)[0]] > -2) score = Math.max(score, 0.1);
        if (mv.special === 'transform') score = 1;
        if (mv.special === 'splash') score = 0.01;
      } else {
        const { dmg } = this.calcDamage('e', 'p', mv, { roll: 0.92 });
        score = Math.min(dmg, foe.hp) / foe.hp * ((mv.acc || 100) / 100);
        if (dmg >= foe.hp) score += 0.5;
      }
      score *= 0.85 + RNG.next() * 0.3;
      if (score > bestScore) { bestScore = score; best = i; }
    }
    return { idx: best };
  }
}
