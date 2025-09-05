import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';
import type { Monster } from '../api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const StarterSelection: React.FC = () => {
  const [starters, setStarters] = useState<Monster[]>([]);
  const [selectedStarter, setSelectedStarter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const { state, dispatch } = useGame();

  useEffect(() => {
    const fetchStarters = async () => {
      setIsLoading(true);
      try {
        const starterMonsters = await gameApi.getStarters();
        setStarters(starterMonsters);
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load starter monsters' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStarters();
  }, [dispatch]);

  const handleStartRun = async () => {
    if (!selectedStarter || !state.player) return;

    setIsStarting(true);
    try {
      const newRun = await gameApi.startRun(state.player.id, selectedStarter);
      dispatch({ type: 'SET_CURRENT_RUN', payload: newRun });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start new run' });
    } finally {
      setIsStarting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fire': return 'bg-red-500 hover:bg-red-600';
      case 'water': return 'bg-blue-500 hover:bg-blue-600';
      case 'grass': return 'bg-green-500 hover:bg-green-600';
      case 'electric': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'psychic': return 'bg-purple-500 hover:bg-purple-600';
      case 'ice': return 'bg-cyan-500 hover:bg-cyan-600';
      case 'dragon': return 'bg-indigo-500 hover:bg-indigo-600';
      case 'dark': return 'bg-gray-700 hover:bg-gray-800';
      case 'fairy': return 'bg-pink-500 hover:bg-pink-600';
      case 'fighting': return 'bg-orange-600 hover:bg-orange-700';
      case 'poison': return 'bg-violet-600 hover:bg-violet-700';
      case 'ground': return 'bg-amber-600 hover:bg-amber-700';
      case 'flying': return 'bg-sky-400 hover:bg-sky-500';
      case 'bug': return 'bg-lime-500 hover:bg-lime-600';
      case 'rock': return 'bg-stone-500 hover:bg-stone-600';
      case 'ghost': return 'bg-indigo-700 hover:bg-indigo-800';
      case 'steel': return 'bg-slate-500 hover:bg-slate-600';
      case 'normal': return 'bg-gray-400 hover:bg-gray-500';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'text-gray-600 border-gray-300';
      case 'uncommon': return 'text-green-600 border-green-300';
      case 'rare': return 'text-blue-600 border-blue-300';
      case 'epic': return 'text-purple-600 border-purple-300';
      case 'legendary': return 'text-orange-600 border-orange-300';
      default: return 'text-gray-600 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading starter monsters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Choose Your Starter
          </h1>
          <p className="text-xl text-muted-foreground">
            Select your starting companion for this adventure!
          </p>
        </div>

        {/* Player Information Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Player Information</CardTitle>
            <CardDescription>Your adventure statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Username</div>
                <div className="font-semibold">{state.player?.username}</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Player ID</div>
                <div className="font-mono text-xs">{state.player?.id}</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Runs</div>
                <div className="font-semibold">{state.player?.totalRuns || 0}</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Best Stage</div>
                <div className="font-semibold">{state.player?.bestStage || 0}</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Currency</div>
                <div className="font-semibold">💰 {state.player?.permanentCurrency}</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Member Since</div>
                <div className="text-xs">
                  {state.player?.createdAt 
                    ? new Date(state.player.createdAt).toLocaleDateString()
                    : 'Unknown'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Starter Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {starters.map((monster) => (
            <Card
              key={monster.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                selectedStarter === monster.id 
                  ? 'ring-2 ring-primary ring-offset-2 border-primary shadow-xl shadow-primary/20' 
                  : 'border-2 hover:border-primary/50'
              }`}
              onClick={() => setSelectedStarter(monster.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{monster.name}</CardTitle>
                  <Badge 
                    variant="outline" 
                    className={`capitalize ${getRarityColor(monster.rarity)}`}
                  >
                    {monster.rarity}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {monster.type.map(type => (
                    <Badge 
                      key={type} 
                      className={`capitalize text-white ${getTypeColor(type)}`}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {monster.description}
                </p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">HP</span>
                    <span className="font-semibold">{monster.baseStats.hp}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">ATK</span>
                    <span className="font-semibold">{monster.baseStats.attack}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">DEF</span>
                    <span className="font-semibold">{monster.baseStats.defense}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">SP.ATK</span>
                    <span className="font-semibold">{monster.baseStats.specialAttack}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">SP.DEF</span>
                    <span className="font-semibold">{monster.baseStats.specialDefense}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">SPD</span>
                    <span className="font-semibold">{monster.baseStats.speed}</span>
                  </div>
                </div>

                {selectedStarter === monster.id && (
                  <div className="pt-2 border-t">
                    <p className="text-primary text-sm font-medium text-center">
                      ✨ Selected as your starter!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Start Run Button */}
        <div className="flex justify-center pt-8">
          <Button
            size="lg"
            onClick={handleStartRun}
            disabled={!selectedStarter || isStarting}
            className="px-12 py-6 text-lg"
          >
            {isStarting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                Starting Adventure...
              </>
            ) : (
              'Start New Adventure'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StarterSelection;
