// All 151 Kanto Pokémon.
// [name, types, HP, Atk, Def, SpA, SpD, Spe, evolution]
// evolution: "targetId@level" or "targetId@Item Name", several separated by commas.
const POKEMON_RAW = [
  null,
  ['Bulbasaur', 'Grass/Poison', 45, 49, 49, 65, 65, 45, '2@16'],
  ['Ivysaur', 'Grass/Poison', 60, 62, 63, 80, 80, 60, '3@32'],
  ['Venusaur', 'Grass/Poison', 80, 82, 83, 100, 100, 80],
  ['Charmander', 'Fire', 39, 52, 43, 60, 50, 65, '5@16'],
  ['Charmeleon', 'Fire', 58, 64, 58, 80, 65, 80, '6@36'],
  ['Charizard', 'Fire/Flying', 78, 84, 78, 109, 85, 100],
  ['Squirtle', 'Water', 44, 48, 65, 50, 64, 43, '8@16'],
  ['Wartortle', 'Water', 59, 63, 80, 65, 80, 58, '9@36'],
  ['Blastoise', 'Water', 79, 83, 100, 85, 105, 78],
  ['Caterpie', 'Bug', 45, 30, 35, 20, 20, 45, '11@7'],
  ['Metapod', 'Bug', 50, 20, 55, 25, 25, 30, '12@10'],
  ['Butterfree', 'Bug/Flying', 60, 45, 50, 90, 80, 70],
  ['Weedle', 'Bug/Poison', 40, 35, 30, 20, 20, 50, '14@7'],
  ['Kakuna', 'Bug/Poison', 45, 25, 50, 25, 25, 35, '15@10'],
  ['Beedrill', 'Bug/Poison', 65, 90, 40, 45, 80, 75],
  ['Pidgey', 'Normal/Flying', 40, 45, 40, 35, 35, 56, '17@18'],
  ['Pidgeotto', 'Normal/Flying', 63, 60, 55, 50, 50, 71, '18@36'],
  ['Pidgeot', 'Normal/Flying', 83, 80, 75, 70, 70, 101],
  ['Rattata', 'Normal', 30, 56, 35, 25, 35, 72, '20@20'],
  ['Raticate', 'Normal', 55, 81, 60, 50, 70, 97],
  ['Spearow', 'Normal/Flying', 40, 60, 30, 31, 31, 70, '22@20'],
  ['Fearow', 'Normal/Flying', 65, 90, 65, 61, 61, 100],
  ['Ekans', 'Poison', 35, 60, 44, 40, 54, 55, '24@22'],
  ['Arbok', 'Poison', 60, 95, 69, 65, 79, 80],
  ['Pikachu', 'Electric', 35, 55, 40, 50, 50, 90, '26@Thunder Stone'],
  ['Raichu', 'Electric', 60, 90, 55, 90, 80, 110],
  ['Sandshrew', 'Ground', 50, 75, 85, 20, 30, 40, '28@22'],
  ['Sandslash', 'Ground', 75, 100, 110, 45, 55, 65],
  ['Nidoran♀', 'Poison', 55, 47, 52, 40, 40, 41, '30@16'],
  ['Nidorina', 'Poison', 70, 62, 67, 55, 55, 56, '31@Moon Stone'],
  ['Nidoqueen', 'Poison/Ground', 90, 92, 87, 75, 85, 76],
  ['Nidoran♂', 'Poison', 46, 57, 40, 40, 40, 50, '33@16'],
  ['Nidorino', 'Poison', 61, 72, 57, 55, 55, 65, '34@Moon Stone'],
  ['Nidoking', 'Poison/Ground', 81, 102, 77, 85, 75, 85],
  ['Clefairy', 'Normal', 70, 45, 48, 60, 65, 35, '36@Moon Stone'],
  ['Clefable', 'Normal', 95, 70, 73, 95, 90, 60],
  ['Vulpix', 'Fire', 38, 41, 40, 50, 65, 65, '38@Fire Stone'],
  ['Ninetales', 'Fire', 73, 76, 75, 81, 100, 100],
  ['Jigglypuff', 'Normal', 115, 45, 20, 45, 25, 20, '40@Moon Stone'],
  ['Wigglytuff', 'Normal', 140, 70, 45, 85, 50, 45],
  ['Zubat', 'Poison/Flying', 40, 45, 35, 30, 40, 55, '42@22'],
  ['Golbat', 'Poison/Flying', 75, 80, 70, 65, 75, 90],
  ['Oddish', 'Grass/Poison', 45, 50, 55, 75, 65, 30, '44@21'],
  ['Gloom', 'Grass/Poison', 60, 65, 70, 85, 75, 40, '45@Leaf Stone'],
  ['Vileplume', 'Grass/Poison', 75, 80, 85, 110, 90, 50],
  ['Paras', 'Bug/Grass', 35, 70, 55, 45, 55, 25, '47@24'],
  ['Parasect', 'Bug/Grass', 60, 95, 80, 60, 80, 30],
  ['Venonat', 'Bug/Poison', 60, 55, 50, 40, 55, 45, '49@31'],
  ['Venomoth', 'Bug/Poison', 70, 65, 60, 90, 75, 90],
  ['Diglett', 'Ground', 10, 55, 25, 35, 45, 95, '51@26'],
  ['Dugtrio', 'Ground', 35, 100, 50, 50, 70, 120],
  ['Meowth', 'Normal', 40, 45, 35, 40, 40, 90, '53@28'],
  ['Persian', 'Normal', 65, 70, 60, 65, 65, 115],
  ['Psyduck', 'Water', 50, 52, 48, 65, 50, 55, '55@33'],
  ['Golduck', 'Water', 80, 82, 78, 95, 80, 85],
  ['Mankey', 'Fighting', 40, 80, 35, 35, 45, 70, '57@28'],
  ['Primeape', 'Fighting', 65, 105, 60, 60, 70, 95],
  ['Growlithe', 'Fire', 55, 70, 45, 70, 50, 60, '59@Fire Stone'],
  ['Arcanine', 'Fire', 90, 110, 80, 100, 80, 95],
  ['Poliwag', 'Water', 40, 50, 40, 40, 40, 90, '61@25'],
  ['Poliwhirl', 'Water', 65, 65, 65, 50, 50, 90, '62@Water Stone'],
  ['Poliwrath', 'Water/Fighting', 90, 95, 95, 70, 90, 70],
  ['Abra', 'Psychic', 25, 20, 15, 105, 55, 90, '64@16'],
  ['Kadabra', 'Psychic', 40, 35, 30, 120, 70, 105, '65@36'],
  ['Alakazam', 'Psychic', 55, 50, 45, 135, 95, 120],
  ['Machop', 'Fighting', 70, 80, 50, 35, 35, 35, '67@28'],
  ['Machoke', 'Fighting', 80, 100, 70, 50, 60, 45, '68@40'],
  ['Machamp', 'Fighting', 90, 130, 80, 65, 85, 55],
  ['Bellsprout', 'Grass/Poison', 50, 75, 35, 70, 30, 40, '70@21'],
  ['Weepinbell', 'Grass/Poison', 65, 90, 50, 85, 45, 55, '71@Leaf Stone'],
  ['Victreebel', 'Grass/Poison', 80, 105, 65, 100, 70, 70],
  ['Tentacool', 'Water/Poison', 40, 40, 35, 50, 100, 70, '73@30'],
  ['Tentacruel', 'Water/Poison', 80, 70, 65, 80, 120, 100],
  ['Geodude', 'Rock/Ground', 40, 80, 100, 30, 30, 20, '75@25'],
  ['Graveler', 'Rock/Ground', 55, 95, 115, 45, 45, 35, '76@40'],
  ['Golem', 'Rock/Ground', 80, 120, 130, 55, 65, 45],
  ['Ponyta', 'Fire', 50, 85, 55, 65, 65, 90, '78@40'],
  ['Rapidash', 'Fire', 65, 100, 70, 80, 80, 105],
  ['Slowpoke', 'Water/Psychic', 90, 65, 65, 40, 40, 15, '80@37'],
  ['Slowbro', 'Water/Psychic', 95, 75, 110, 100, 80, 30],
  ['Magnemite', 'Electric/Steel', 25, 35, 70, 95, 55, 45, '82@30'],
  ['Magneton', 'Electric/Steel', 50, 60, 95, 120, 70, 70],
  ["Farfetch'd", 'Normal/Flying', 52, 90, 55, 58, 62, 60],
  ['Doduo', 'Normal/Flying', 35, 85, 45, 35, 35, 75, '85@31'],
  ['Dodrio', 'Normal/Flying', 60, 110, 70, 60, 60, 100],
  ['Seel', 'Water', 65, 45, 55, 45, 70, 45, '87@34'],
  ['Dewgong', 'Water/Ice', 90, 70, 80, 70, 95, 70],
  ['Grimer', 'Poison', 80, 80, 50, 40, 50, 25, '89@38'],
  ['Muk', 'Poison', 105, 105, 75, 65, 100, 50],
  ['Shellder', 'Water', 30, 65, 100, 45, 25, 40, '91@Water Stone'],
  ['Cloyster', 'Water/Ice', 50, 95, 180, 85, 45, 70],
  ['Gastly', 'Ghost/Poison', 30, 35, 30, 100, 35, 80, '93@25'],
  ['Haunter', 'Ghost/Poison', 45, 50, 45, 115, 55, 95, '94@40'],
  ['Gengar', 'Ghost/Poison', 60, 65, 60, 130, 75, 110],
  ['Onix', 'Rock/Ground', 35, 45, 160, 30, 45, 70],
  ['Drowzee', 'Psychic', 60, 48, 45, 43, 90, 42, '97@26'],
  ['Hypno', 'Psychic', 85, 73, 70, 73, 115, 67],
  ['Krabby', 'Water', 30, 105, 90, 25, 25, 50, '99@28'],
  ['Kingler', 'Water', 55, 130, 115, 50, 50, 75],
  ['Voltorb', 'Electric', 40, 30, 50, 55, 55, 100, '101@30'],
  ['Electrode', 'Electric', 60, 50, 70, 80, 80, 140],
  ['Exeggcute', 'Grass/Psychic', 60, 40, 80, 60, 45, 40, '103@Leaf Stone'],
  ['Exeggutor', 'Grass/Psychic', 95, 95, 85, 125, 65, 55],
  ['Cubone', 'Ground', 50, 50, 95, 40, 50, 35, '105@28'],
  ['Marowak', 'Ground', 60, 80, 110, 50, 80, 45],
  ['Hitmonlee', 'Fighting', 50, 120, 53, 35, 110, 87],
  ['Hitmonchan', 'Fighting', 50, 105, 79, 35, 110, 76],
  ['Lickitung', 'Normal', 90, 55, 75, 60, 75, 30],
  ['Koffing', 'Poison', 40, 65, 95, 60, 45, 35, '110@35'],
  ['Weezing', 'Poison', 65, 90, 120, 85, 70, 60],
  ['Rhyhorn', 'Ground/Rock', 80, 85, 95, 30, 30, 25, '112@42'],
  ['Rhydon', 'Ground/Rock', 105, 130, 120, 45, 45, 40],
  ['Chansey', 'Normal', 250, 5, 5, 35, 105, 50],
  ['Tangela', 'Grass', 65, 55, 115, 100, 40, 60],
  ['Kangaskhan', 'Normal', 105, 95, 80, 40, 80, 90],
  ['Horsea', 'Water', 30, 40, 70, 70, 25, 60, '117@32'],
  ['Seadra', 'Water', 55, 65, 95, 95, 45, 85],
  ['Goldeen', 'Water', 45, 67, 60, 35, 50, 63, '119@33'],
  ['Seaking', 'Water', 80, 92, 65, 65, 80, 68],
  ['Staryu', 'Water', 30, 45, 55, 70, 55, 85, '121@Water Stone'],
  ['Starmie', 'Water/Psychic', 60, 75, 85, 100, 85, 115],
  ['Mr. Mime', 'Psychic', 40, 45, 65, 100, 120, 90],
  ['Scyther', 'Bug/Flying', 70, 110, 80, 55, 80, 105],
  ['Jynx', 'Ice/Psychic', 65, 50, 35, 115, 95, 95],
  ['Electabuzz', 'Electric', 65, 83, 57, 95, 85, 105],
  ['Magmar', 'Fire', 65, 95, 57, 100, 85, 93],
  ['Pinsir', 'Bug', 65, 125, 100, 55, 70, 85],
  ['Tauros', 'Normal', 75, 100, 95, 40, 70, 110],
  ['Magikarp', 'Water', 20, 10, 55, 15, 20, 80, '130@20'],
  ['Gyarados', 'Water/Flying', 95, 125, 79, 60, 100, 81],
  ['Lapras', 'Water/Ice', 130, 85, 80, 85, 95, 60],
  ['Ditto', 'Normal', 48, 48, 48, 48, 48, 48],
  ['Eevee', 'Normal', 55, 55, 50, 45, 65, 55, '134@Water Stone,135@Thunder Stone,136@Fire Stone'],
  ['Vaporeon', 'Water', 130, 65, 60, 110, 95, 65],
  ['Jolteon', 'Electric', 65, 65, 60, 110, 95, 130],
  ['Flareon', 'Fire', 65, 130, 60, 95, 110, 65],
  ['Porygon', 'Normal', 65, 60, 70, 85, 75, 40],
  ['Omanyte', 'Rock/Water', 35, 40, 100, 90, 55, 35, '139@40'],
  ['Omastar', 'Rock/Water', 70, 60, 125, 115, 70, 55],
  ['Kabuto', 'Rock/Water', 30, 80, 90, 55, 45, 55, '141@40'],
  ['Kabutops', 'Rock/Water', 60, 115, 105, 65, 70, 80],
  ['Aerodactyl', 'Rock/Flying', 80, 105, 65, 60, 75, 130],
  ['Snorlax', 'Normal', 160, 110, 65, 65, 110, 30],
  ['Articuno', 'Ice/Flying', 90, 85, 100, 95, 125, 85],
  ['Zapdos', 'Electric/Flying', 90, 90, 85, 125, 90, 100],
  ['Moltres', 'Fire/Flying', 90, 100, 90, 125, 85, 90],
  ['Dratini', 'Dragon', 41, 64, 45, 50, 50, 50, '148@30'],
  ['Dragonair', 'Dragon', 61, 84, 65, 70, 70, 70, '149@55'],
  ['Dragonite', 'Dragon/Flying', 91, 134, 95, 100, 100, 80],
  ['Mewtwo', 'Psychic', 106, 110, 90, 154, 90, 130],
  ['Mew', 'Psychic', 100, 100, 100, 100, 100, 100],
];

const LEGENDARY_IDS = [144, 145, 146, 150, 151];
// Hard-to-find species (starters, fossils, the Safari rares, etc.) get a lower encounter weight.
const RARE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 83, 106, 107, 108, 113, 115, 122, 123, 124, 125, 126, 127, 128,
  131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 147, 148, 149];

const POKEMON = POKEMON_RAW.map((r, id) => {
  if (!r) return null;
  const [name, types, hp, atk, def, spa, spd, spe, evo] = r;
  const base = { hp, atk, def, spa, spd, spe };
  const bst = hp + atk + def + spa + spd + spe;
  const evolutions = evo ? evo.split(',').map((e) => {
    const [to, how] = e.split('@');
    return /^\d+$/.test(how) ? { to: +to, level: +how } : { to: +to, item: how };
  }) : [];
  return {
    id, name, types: types.split('/'), base, bst, evolutions,
    legendary: LEGENDARY_IDS.includes(id),
    rare: RARE_IDS.includes(id),
  };
});

// Find the species that evolves into this one (used to keep evolved forms above their evolution level).
POKEMON.forEach((p) => {
  if (!p) return;
  for (const e of p.evolutions) POKEMON[e.to].preEvo = { id: p.id, level: e.level || null };
});

// Catch rate: weaker Pokémon are easy to catch, strong ones hard, legendaries 3 (the minimum).
POKEMON.forEach((p) => {
  if (!p) return;
  if (p.legendary) { p.catchRate = 3; return; }
  const t = Math.max(0, Math.min(1, 1 - (p.bst - 195) / 500));
  p.catchRate = Math.max(10, Math.round(255 * t * t));
  if (p.rare) p.catchRate = Math.max(10, Math.round(p.catchRate * 0.6));
});

// Rarity label shown in the Pokédex and encounter text.
function rarityOf(p) {
  if (p.legendary) return 'Legendary';
  const score = p.bst + (p.rare ? 120 : 0);
  if (score < 330) return 'Common';
  if (score < 430) return 'Uncommon';
  if (score < 520) return 'Rare';
  return 'Very Rare';
}

// FireRed/LeafGreen sprites from the PokeAPI sprite repository.
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/';
function spriteUrl(id, back) {
  return `${SPRITE_BASE}${back ? 'back/' : ''}${id}.png`;
}
