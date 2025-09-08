import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PlayerSetup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useGame();

  const handleCreatePlayer = async () => {
    if (!username.trim()) return;
    
    setIsCreating(true);
    try {
      const player = await gameApi.createPlayer(username.trim());
      dispatch({ type: 'SET_PLAYER', payload: player });
      setPlayerId(player.id);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create player' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleLoadPlayer = async () => {
    if (!playerId.trim()) return;
    
    setIsLoading(true);
    try {
      const player = await gameApi.loadPlayer(playerId.trim());
      dispatch({ type: 'SET_PLAYER', payload: player });
      
      // Try to load active game run
      try {
        const activeRun = await gameApi.getActiveRun(player.id);
        dispatch({ type: 'SET_CURRENT_RUN', payload: activeRun });
      } catch (runError) {
        // No active run found, that's okay
        console.log('No active run found for player');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Player not found' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
          Monster Roguelike
        </h1>
        <p className="text-muted-foreground text-lg">
          Embark on an epic journey to become the ultimate monster trainer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create New Player</CardTitle>
            <CardDescription>
              Start your adventure with a new trainer profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors text-foreground placeholder:text-muted-foreground"
                onKeyPress={(e) => e.key === 'Enter' && handleCreatePlayer()}
              />
            </div>
            <Button 
              onClick={handleCreatePlayer}
              disabled={isCreating || !username.trim()}
              className="w-full py-3 text-lg"
              size="lg"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Creating...
                </>
              ) : (
                'Create Player'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Load Existing Player</CardTitle>
            <CardDescription>
              Continue your journey with an existing trainer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter player ID"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors text-foreground placeholder:text-muted-foreground font-mono"
                onKeyPress={(e) => e.key === 'Enter' && handleLoadPlayer()}
              />
            </div>
            <Button 
              onClick={handleLoadPlayer}
              disabled={isLoading || !playerId.trim()}
              variant="outline"
              className="w-full py-3 text-lg"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Loading...
                </>
              ) : (
                'Load Player'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Your progress is automatically saved. Keep your Player ID to continue later!
        </p>
      </div>
    </div>
  );
};

export default PlayerSetup;
