// Type chart (Gen 2–5 rules: 17 types, no Fairy).
// For each attacking type: x2 = super effective, x05 = not very effective, x0 = no effect.
const TYPE_CHART = {
  Normal:   { x2: [], x05: ['Rock', 'Steel'], x0: ['Ghost'] },
  Fire:     { x2: ['Grass', 'Ice', 'Bug', 'Steel'], x05: ['Fire', 'Water', 'Rock', 'Dragon'], x0: [] },
  Water:    { x2: ['Fire', 'Ground', 'Rock'], x05: ['Water', 'Grass', 'Dragon'], x0: [] },
  Electric: { x2: ['Water', 'Flying'], x05: ['Electric', 'Grass', 'Dragon'], x0: ['Ground'] },
  Grass:    { x2: ['Water', 'Ground', 'Rock'], x05: ['Fire', 'Grass', 'Poison', 'Flying', 'Bug', 'Dragon', 'Steel'], x0: [] },
  Ice:      { x2: ['Grass', 'Ground', 'Flying', 'Dragon'], x05: ['Fire', 'Water', 'Ice', 'Steel'], x0: [] },
  Fighting: { x2: ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'], x05: ['Poison', 'Flying', 'Psychic', 'Bug'], x0: ['Ghost'] },
  Poison:   { x2: ['Grass'], x05: ['Poison', 'Ground', 'Rock', 'Ghost'], x0: ['Steel'] },
  Ground:   { x2: ['Fire', 'Electric', 'Poison', 'Rock', 'Steel'], x05: ['Grass', 'Bug'], x0: ['Flying'] },
  Flying:   { x2: ['Grass', 'Fighting', 'Bug'], x05: ['Electric', 'Rock', 'Steel'], x0: [] },
  Psychic:  { x2: ['Fighting', 'Poison'], x05: ['Psychic', 'Steel'], x0: ['Dark'] },
  Bug:      { x2: ['Grass', 'Psychic', 'Dark'], x05: ['Fire', 'Fighting', 'Poison', 'Flying', 'Ghost', 'Steel'], x0: [] },
  Rock:     { x2: ['Fire', 'Ice', 'Flying', 'Bug'], x05: ['Fighting', 'Ground', 'Steel'], x0: [] },
  Ghost:    { x2: ['Psychic', 'Ghost'], x05: ['Dark', 'Steel'], x0: ['Normal'] },
  Dragon:   { x2: ['Dragon'], x05: ['Steel'], x0: [] },
  Dark:     { x2: ['Psychic', 'Ghost'], x05: ['Fighting', 'Dark', 'Steel'], x0: [] },
  Steel:    { x2: ['Ice', 'Rock'], x05: ['Fire', 'Water', 'Electric', 'Steel'], x0: [] },
};

const TYPE_COLORS = {
  Normal: '#9fa19f', Fire: '#e62829', Water: '#2980ef', Electric: '#d8b400', Grass: '#3fa129',
  Ice: '#3dcef3', Fighting: '#ff8000', Poison: '#9141cb', Ground: '#915121', Flying: '#81b9ef',
  Psychic: '#ef4179', Bug: '#91a119', Rock: '#afa981', Ghost: '#704170', Dragon: '#5060e1',
  Dark: '#624d4e', Steel: '#60a1b8',
};

// Multiplier for an attacking type against a list of defending types.
function typeEffectiveness(atkType, defTypes) {
  const row = TYPE_CHART[atkType];
  if (!row) return 1;
  let m = 1;
  for (const t of defTypes) {
    if (row.x0.includes(t)) return 0;
    if (row.x2.includes(t)) m *= 2;
    else if (row.x05.includes(t)) m *= 0.5;
  }
  return m;
}
