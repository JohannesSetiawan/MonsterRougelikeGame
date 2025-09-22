import React, { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';
import { ErrorHandler } from '../utils/errorHandler';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface MoveInfoProps {
  moveId: string;
  onClose: () => void;
}

const MoveInfo: React.FC<MoveInfoProps> = ({ moveId, onClose }) => {
  const [moveData, setMoveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMoveData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await gameApi.getMoveData(moveId);
        setMoveData(data);
      } catch (err) {
        const errorMessage = ErrorHandler.getDisplayMessage(err, 'Failed to load move data. Please try again.');
        setError(errorMessage);
        ErrorHandler.handle(err, 'MoveInfo.loadMoveData');
        // Don't use fallback data - let the error be handled by the UI
      } finally {
        setLoading(false);
      }
    };

    loadMoveData();
  }, [moveId]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fire: 'bg-red-500 hover:bg-red-600',
      water: 'bg-blue-500 hover:bg-blue-600',
      grass: 'bg-green-500 hover:bg-green-600',
      electric: 'bg-yellow-500 hover:bg-yellow-600',
      psychic: 'bg-purple-500 hover:bg-purple-600',
      ice: 'bg-cyan-500 hover:bg-cyan-600',
      dragon: 'bg-indigo-500 hover:bg-indigo-600',
      dark: 'bg-gray-700 hover:bg-gray-800',
      fighting: 'bg-orange-600 hover:bg-orange-700',
      poison: 'bg-violet-600 hover:bg-violet-700',
      ground: 'bg-amber-600 hover:bg-amber-700',
      flying: 'bg-sky-400 hover:bg-sky-500',
      bug: 'bg-lime-500 hover:bg-lime-600',
      rock: 'bg-stone-500 hover:bg-stone-600',
      ghost: 'bg-indigo-700 hover:bg-indigo-800',
      steel: 'bg-slate-500 hover:bg-slate-600',
      fairy: 'bg-pink-500 hover:bg-pink-600',
      normal: 'bg-gray-400 hover:bg-gray-500'
    };
    return colors[type] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'physical': return '⚔️';
      case 'special': return '✨';
      case 'status': return '🔄';
      default: return '❓';
    }
  };

  const getPowerDisplay = (power: number) => {
    if (power === 0) return 'Status';
    return power.toString();
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-background text-foreground">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading move data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !moveData) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive">Error</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground mb-4">{error || 'Move not found'}</p>
            <div className="space-x-2">
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Retry
              </Button>
              <Button onClick={onClose} className="w-full">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-background text-foreground">
        <DialogHeader>
          <div>
            <DialogTitle className="text-xl text-foreground mb-2">{moveData.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCategoryIcon(moveData.category)}</span>
              <span className="text-sm text-muted-foreground capitalize">{moveData.category}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type Badge */}
          <div>
            <Badge className={`text-white font-semibold px-3 py-1 ${getTypeColor(moveData.type)}`}>
              {moveData.type.toUpperCase()}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Power</div>
                <div className="text-lg font-bold text-red-500">{getPowerDisplay(moveData.power)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Accuracy</div>
                <div className="text-lg font-bold text-green-500">{moveData.accuracy}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">PP</div>
                <div className="text-lg font-bold text-blue-500">{moveData.pp}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Priority</div>
                <div className={`text-lg font-bold ${moveData.priority > 0 ? 'text-purple-500' : moveData.priority < 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {moveData.priority > 0 ? `+${moveData.priority}` : moveData.priority}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
            <p className="text-muted-foreground leading-relaxed">{moveData.description}</p>
          </div>

          {/* Special Effect */}
          {moveData.effect && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Special Effect</h4>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="text-sm text-foreground">{moveData.effect}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveInfo;
