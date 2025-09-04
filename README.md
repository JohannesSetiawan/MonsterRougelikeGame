# Pokemon-like Roguelike Game

A Pokemon-inspired roguelike game built with React (frontend) and NestJS (backend). Features monster catching, turn-based battles, procedural generation, and run-based progression with permadeath mechanics.

## Game Features

### Core Gameplay Loop
1. **Start a Run**: Pick a starter monster
2. **Explore/Battle**: Progress through procedurally generated stages
3. **Gain Rewards**: Catch new monsters, get items, earn currency
4. **Grow Stronger**: Team levels up, learns moves, and evolves
5. **Face Challenges**: Battle increasingly difficult wild monsters
6. **Run Ends**: Either achieve victory or face permadeath
7. **Meta-Progression**: Spend permanent currency to unlock new content

### Monster System
- **4 Monsters**: Flamewyrm, Aquafin, Pyroblast, Hydroking
- **2 Types**: Fire and Water with type effectiveness
- **6 Moves**: Scratch, Ember, Flame Burst, Water Gun, Bubble Beam, Hydro Pump
- **4 Abilities**: Blaze, Torrent, Intimidate, Swift Swim
- **Stats**: HP, Attack, Defense, Special Attack, Special Defense, Speed

### Game Mechanics
- **Procedural Generation**: Random encounters, paths, and rewards
- **Permadeath**: Lose progress on defeat, keep meta-progression
- **Monster Catching**: Capture wild monsters to expand your team
- **Turn-based Combat**: Strategic battles with move selection
- **Inventory Management**: Use items for healing and capturing

## Project Structure

```
├── backend/           # NestJS API server
│   ├── src/
│   │   ├── controllers/  # API endpoints
│   │   ├── services/     # Game logic
│   │   ├── types.ts      # Type definitions
│   │   ├── game-data.ts  # Static game data
│   │   └── main.ts       # Server entry point
│   └── package.json
├── frontend/          # React application  
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # UI components
│   │   ├── context/     # Game state management
│   │   └── App.tsx      # Main application
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run start:dev
   ```

The backend will run on `http://localhost:3001` with API documentation at `http://localhost:3001/api`

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## How to Play

1. **Create Player**: Enter a username to create a new player account
2. **Choose Starter**: Select either Flamewyrm (Fire) or Aquafin (Water)
3. **Start Adventure**: Begin your roguelike run
4. **Battle Monsters**: Use your team to battle wild monsters
5. **Make Choices**: Catch monsters, use items, or flee from battles
6. **Progress Stages**: Continue advancing through procedurally generated content
7. **Manage Team**: Keep your monsters healthy and strategically use moves
8. **End Run**: Either achieve victory or face defeat and start over

## API Endpoints

### Game Management
- `POST /game/player` - Create new player
- `GET /game/player/:id` - Get player information
- `POST /game/run/start` - Start new game run
- `GET /game/run/:runId` - Get run details
- `POST /game/run/:runId/progress` - Progress to next stage

### Battle System
- `POST /battle/:runId/action` - Perform battle action
- `POST /battle/:runId/damage` - Calculate damage preview

### Static Data
- `GET /game/starters` - Get available starter monsters
- `GET /game/encounter/:stageLevel` - Get random encounter

## Technical Details

### Backend Technologies
- **NestJS**: Modern Node.js framework
- **TypeScript**: Type-safe JavaScript
- **Express**: HTTP server
- **Swagger**: API documentation

### Frontend Technologies
- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **Axios**: HTTP client
- **Context API**: State management

### Game Data
The game includes balanced monster stats and type effectiveness:
- Fire beats nothing, weak to Water
- Water beats Fire, weak to nothing
- Moves have varying power, accuracy, and effects
- Monsters have different rarities affecting catch rates

## Future Enhancements

- More monster types (Grass, Electric, etc.)
- Evolution mechanics
- More move categories and effects
- Trainer battles
- Boss encounters
- Equipment system
- Online multiplayer features
- Achievement system

## Development

This project serves as a learning example for:
- Full-stack TypeScript development
- RESTful API design
- React state management
- Game mechanics implementation
- Procedural content generation

The codebase is structured to be easily extensible for adding new monsters, moves, abilities, and game features.
