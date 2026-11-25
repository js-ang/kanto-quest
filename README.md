# Kanto Quest

A turn-based Pokémon game in the browser with all 151 Kanto Pokémon.

## Play
Open `index.html` in a browser. You need an internet connection, because sprites load from PokeAPI and the fonts come from Google Fonts. Progress saves automatically to your browser's localStorage.

## Features
- All 151 Kanto Pokémon with real base stats, types and evolutions (by level, by stone, and by level 36–40 for the four trade evolutions)
- 17-type effectiveness chart (Gen 2–5 rules, no Fairy type), STAB, critical hits, physical/special split, and status conditions (burn, poison, paralysis, sleep, freeze)
- Modern damage formula based on level, attack/defense stats, move power, type matchups and a random roll
- Choice of starter: Bulbasaur, Charmander or Squirtle
- 14 locations unlocked by badges. Encounter rarity drops as base stat total rises, and a legendary is always the rarest encounter in its location.
- Catching with Poké, Great, Ultra and Master Balls. Strong Pokémon have lower catch rates.
- Route trainers, 8 gym leaders, the Elite Four, and the Champion
- XP and leveling, move learning, a move reminder, Pokédex, PC storage and a Poké Mart

## Code layout
- `js/data/`: type chart, Pokémon, moves and learnset generator, world data (locations, gyms, items)
- `js/engine/`: core helpers (stats, XP, encounters, catching) and the battle engine
- `js/ui/`: shared UI and modals, battle screen, hub screens

## Test
`node tests/engine-test.js` checks the data, encounter rarity and 1,500 random battles.
