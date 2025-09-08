# PostgreSQL Database Setup

This project now includes PostgreSQL integration for saving player progress.

## Quick Start with Docker

1. Make sure you have Docker installed
2. Run PostgreSQL using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Create a `.env` file in the backend folder:
   ```bash
   cp backend/.env.example backend/.env
   ```

4. The database will be automatically created with the default configuration.

## Database Configuration

The following environment variables can be configured in `backend/.env`:

- `DATABASE_HOST=localhost`
- `DATABASE_PORT=5432` 
- `DATABASE_USER=postgres`
- `DATABASE_PASSWORD=password`
- `DATABASE_NAME=roguelike_game`

## How It Works

### Save System
- **When creating a new player**: Player data is immediately saved to the database
- **During gameplay**: All progress is kept in memory only (no database saves)
- **When clicking "Save Progress"**: Current player state and game run data are saved to database
- **When loading a player**: Data is loaded from database into memory

### Player Data Saved
- Username and player ID
- Permanent currency
- Unlocked starters and abilities  
- Total runs and best stage achieved
- Current game run state (team, inventory, stage, etc.)

### Usage
1. Create a new player or load existing player by ID
2. Play the game normally (all in-memory)
3. Click "Save Progress" button when you want to save
4. Use your Player ID to load your progress later
