// Locations: which types live there, the max base-stat total that can appear, level range,
// and how many badges you need to go there. `extra` adds specific species; `legendary` is a rare one-off.
const LOCATIONS = [
  { id: 'route1', name: 'Route 1', badges: 0, levels: [2, 5], species: [16, 19, 21, 52, 39, 133], cap: 330,
    desc: 'A grassy path out of Pallet Town.', trainers: ['Youngster', 'Lass'] },
  { id: 'viridian', name: 'Viridian Forest', badges: 0, levels: [3, 8], types: ['Bug', 'Grass', 'Electric'], cap: 330,
    desc: 'A maze of trees buzzing with Bug Pokémon.', trainers: ['Bug Catcher', 'Bug Catcher', 'Lass'] },
  { id: 'mtmoon', name: 'Mt. Moon', badges: 1, levels: [8, 13], types: ['Rock', 'Ground', 'Poison'], cap: 400,
    extra: [35, 46], desc: 'A dark cave. Fossils and Clefairy are said to hide here.', trainers: ['Hiker', 'Super Nerd', 'Lass'] },
  { id: 'cerulean', name: 'Nugget Bridge', badges: 1, levels: [10, 16], types: ['Water', 'Grass', 'Bug', 'Psychic'], cap: 380,
    desc: 'Routes 24 and 25 north of Cerulean City.', trainers: ['Camper', 'Picnicker', 'Youngster', 'Lass'] },
  { id: 'rocktunnel', name: 'Rock Tunnel', badges: 2, levels: [15, 21], types: ['Rock', 'Ground', 'Fighting', 'Poison'], cap: 420,
    desc: 'A pitch-black tunnel full of tough Pokémon.', trainers: ['Hiker', 'Hiker', 'Black Belt'] },
  { id: 'vermilion', name: 'Vermilion Harbor', badges: 2, levels: [18, 25], types: ['Water'], cap: 460,
    desc: 'Cast a line off the docks of Vermilion City.', trainers: ['Fisherman', 'Swimmer', 'Sailor'] },
  { id: 'celadon', name: 'Celadon Outskirts', badges: 3, levels: [20, 28], types: ['Normal', 'Fire', 'Psychic', 'Grass'], cap: 450,
    desc: 'Routes 7 and 8 around Kanto\'s biggest city.', trainers: ['Gambler', 'Beauty', 'Biker', 'Psychic'] },
  { id: 'tower', name: 'Pokémon Tower', badges: 4, levels: [24, 32], types: ['Ghost', 'Psychic'], cap: 520,
    extra: [104, 105], desc: 'A haunted tower in Lavender Town.', trainers: ['Channeler', 'Channeler', 'Psychic'] },
  { id: 'safari', name: 'Safari Zone', badges: 5, levels: [25, 35], types: ['Normal', 'Bug', 'Grass', 'Ground', 'Dragon', 'Water'], cap: 520,
    desc: 'Rare Pokémon roam the wild preserve in Fuchsia City.', trainers: ['Bird Keeper', 'Juggler', 'Cool Trainer'] },
  { id: 'powerplant', name: 'Power Plant', badges: 6, levels: [30, 40], types: ['Electric', 'Steel'], cap: 500,
    legendary: { id: 145, level: 50 }, desc: 'An abandoned plant crackling with electricity.', trainers: ['Super Nerd', 'Rocker'] },
  { id: 'seafoam', name: 'Seafoam Islands', badges: 6, levels: [30, 40], types: ['Water', 'Ice'], cap: 535,
    legendary: { id: 144, level: 50 }, desc: 'Icy caves between the currents.', trainers: ['Swimmer', 'Swimmer', 'Cool Trainer'] },
  { id: 'cinnabar', name: 'Cinnabar Mansion', badges: 7, levels: [32, 42], types: ['Fire', 'Poison', 'Normal'], cap: 540, minBst: 300,
    extra: [139, 141, 142], desc: 'A burned-out lab. Revived fossils roam the halls.', trainers: ['Burglar', 'Scientist', 'Scientist'] },
  { id: 'victory', name: 'Victory Road', badges: 8, levels: [44, 54], types: ['Rock', 'Ground', 'Fighting', 'Poison', 'Dragon'], cap: 600, minBst: 380,
    legendary: { id: 146, level: 50 }, desc: 'The final test before the Pokémon League.', trainers: ['Cool Trainer', 'Cool Trainer', 'Black Belt', 'Juggler'] },
  { id: 'ceruleancave', name: 'Cerulean Cave', badges: 8, champion: true, levels: [50, 65], types: null, cap: 999, minBst: 420,
    legendary: { id: 150, level: 70 }, legendary2: { id: 151, level: 60 },
    desc: 'Only the Champion may enter. Every Pokémon in Kanto lives here.', trainers: ['Cool Trainer', 'Cool Trainer', 'Black Belt'] },
];

const TRAINER_NAMES = ['Joey', 'Ben', 'Iris', 'Rick', 'Dana', 'Kent', 'Robin', 'Sam', 'Tina', 'Max', 'Leah', 'Owen',
  'Nina', 'Gary', 'Ruth', 'Hugo', 'Mia', 'Paul', 'Zoe', 'Dale', 'Ivy', 'Cole', 'Ada', 'Ray'];

// Gym leaders: [speciesId, level] teams. Gym n requires n earlier badges.
const GYMS = [
  { leader: 'Brock', city: 'Pewter City', type: 'Rock', badge: 'Boulder Badge', team: [[74, 11], [95, 13]] },
  { leader: 'Misty', city: 'Cerulean City', type: 'Water', badge: 'Cascade Badge', team: [[120, 18], [121, 20]] },
  { leader: 'Lt. Surge', city: 'Vermilion City', type: 'Electric', badge: 'Thunder Badge', team: [[100, 21], [25, 18], [26, 24]] },
  { leader: 'Erika', city: 'Celadon City', type: 'Grass', badge: 'Rainbow Badge', team: [[71, 29], [114, 24], [45, 29]] },
  { leader: 'Koga', city: 'Fuchsia City', type: 'Poison', badge: 'Soul Badge', team: [[109, 33], [89, 35], [109, 33], [110, 38]] },
  { leader: 'Sabrina', city: 'Saffron City', type: 'Psychic', badge: 'Marsh Badge', team: [[64, 36], [122, 36], [49, 37], [65, 40]] },
  { leader: 'Blaine', city: 'Cinnabar Island', type: 'Fire', badge: 'Volcano Badge', team: [[58, 42], [77, 40], [78, 42], [59, 47]] },
  { leader: 'Giovanni', city: 'Viridian City', type: 'Ground', badge: 'Earth Badge', team: [[111, 45], [51, 42], [31, 44], [34, 45], [112, 50]] },
];

const ELITE_FOUR = [
  { leader: 'Lorelei', type: 'Ice', team: [[87, 54], [91, 53], [80, 54], [124, 56], [131, 56]] },
  { leader: 'Bruno', type: 'Fighting', team: [[95, 53], [107, 55], [106, 55], [95, 56], [68, 58]] },
  { leader: 'Agatha', type: 'Ghost', team: [[94, 56], [42, 56], [93, 55], [24, 58], [94, 60]] },
  { leader: 'Lance', type: 'Dragon', team: [[130, 58], [148, 56], [148, 56], [142, 60], [149, 62]] },
];

// The Champion (your rival) picks the starter that beats yours.
function championTeam(starterId) {
  const counter = { 1: 6, 4: 9, 7: 3 }[starterId] || 6;
  const support = { 1: 130, 4: 103, 7: 59 }[starterId] || 130;
  return [[18, 61], [65, 59], [112, 61], [support, 61], [143, 62], [counter, 65]];
}

const ITEMS = {
  pokeball:    { name: 'Poké Ball', price: 200, kind: 'ball', ball: 1, desc: 'A basic ball for catching wild Pokémon.' },
  greatball:   { name: 'Great Ball', price: 600, kind: 'ball', ball: 1.5, badges: 2, desc: 'A better catch rate than a Poké Ball.' },
  ultraball:   { name: 'Ultra Ball', price: 1200, kind: 'ball', ball: 2, badges: 4, desc: 'A high-performance ball.' },
  masterball:  { name: 'Master Ball', price: 0, kind: 'ball', ball: 255, desc: 'Catches any wild Pokémon without fail.' },
  potion:      { name: 'Potion', price: 300, kind: 'heal', heal: 20, desc: 'Restores 20 HP.' },
  superpotion: { name: 'Super Potion', price: 700, kind: 'heal', heal: 60, badges: 1, desc: 'Restores 60 HP.' },
  hyperpotion: { name: 'Hyper Potion', price: 1200, kind: 'heal', heal: 200, badges: 3, desc: 'Restores 200 HP.' },
  fullheal:    { name: 'Full Heal', price: 600, kind: 'cure', desc: 'Cures any status problem.' },
  revive:      { name: 'Revive', price: 1500, kind: 'revive', badges: 2, desc: 'Revives a fainted Pokémon with half its HP.' },
  firestone:   { name: 'Fire Stone', price: 2100, kind: 'stone', badges: 3, desc: 'Makes certain Pokémon evolve.' },
  waterstone:  { name: 'Water Stone', price: 2100, kind: 'stone', badges: 3, desc: 'Makes certain Pokémon evolve.' },
  thunderstone:{ name: 'Thunder Stone', price: 2100, kind: 'stone', badges: 3, desc: 'Makes certain Pokémon evolve.' },
  leafstone:   { name: 'Leaf Stone', price: 2100, kind: 'stone', badges: 3, desc: 'Makes certain Pokémon evolve.' },
  moonstone:   { name: 'Moon Stone', price: 2100, kind: 'stone', badges: 3, desc: 'Makes certain Pokémon evolve.' },
};
const SHOP_ORDER = ['pokeball', 'greatball', 'ultraball', 'potion', 'superpotion', 'hyperpotion', 'fullheal', 'revive',
  'firestone', 'waterstone', 'thunderstone', 'leafstone', 'moonstone'];
