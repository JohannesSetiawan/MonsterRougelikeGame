import React, { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface AbilityInfoProps {
  abilityId: string;
  onClose: () => void;
}

const AbilityInfo: React.FC<AbilityInfoProps> = ({ abilityId, onClose }) => {
  const [abilityData, setAbilityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAbilityData = async () => {
      try {
        setLoading(true);
        const data = await gameApi.getAbilityData(abilityId);
        setAbilityData(data);
      } catch (err) {
        setError('Failed to load ability data');
        console.error('Error loading ability data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAbilityData();
  }, [abilityId]);

  const getAbilityIcon = (abilityName: string) => {
    const icons: Record<string, string> = {
      intimidate: '😤',
      blaze: '🔥',
      torrent: '🌊',
      overgrow: '🌱',
      'swift-swim': '💨',
      'static': '⚡',
      'thick-fat': '🛡️',
      'poison-point': '☠️',
      'keen-eye': '👁️',
      'compound-eyes': '👀',
      'shield-dust': '✨',
      'run-away': '💨',
      'color-change': '🎨',
      'synchronize': '🔄',
      'inner-focus': '🧘',
      'levitate': '🎈',
      'trace': '📋',
      'huge-power': '💪',
      'wonder-guard': '⭐',
      'arena-trap': '🕳️',
      'shadow-tag': '👥',
      'rough-skin': '🦾',
      'speed-boost': '⚡',
      'battle-armor': '🛡️',
      'sturdy': '⛰️',
      'magnet-pull': '🧲',
      'soundproof': '🔇',
      'rain-dish': '🌧️',
      'sand-stream': '🌪️',
      'pressure': '⏰',
      'unnerve': '😰',
      'mold-breaker': '🔨'
    };
    return icons[abilityName.toLowerCase()] || '✨';
  };

  const getTriggerColor = (trigger: string) => {
    const colors: Record<string, string> = {
      'on-switch-in': 'bg-teal-500 hover:bg-teal-600',
      'passive': 'bg-green-500 hover:bg-green-600',
      'on-attack': 'bg-red-500 hover:bg-red-600',
      'on-damage': 'bg-yellow-500 hover:bg-yellow-600',
      'weather-boost': 'bg-blue-500 hover:bg-blue-600',
      'type-boost': 'bg-purple-500 hover:bg-purple-600',
      'status-prevent': 'bg-gray-500 hover:bg-gray-600',
      'stat-boost': 'bg-indigo-500 hover:bg-indigo-600'
    };
    return colors[trigger] || 'bg-gray-500 hover:bg-gray-600';
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-background text-foreground">
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-pulse">✨</div>
            <p className="text-muted-foreground">Loading ability data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !abilityData) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive">Error</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">{error || 'Ability not found'}</p>
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-background text-foreground">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getAbilityIcon(abilityData.id)}</div>
                <DialogTitle className="text-xl text-foreground">{abilityData.name}</DialogTitle>
              </div>
              {abilityData.trigger && (
                <Badge className={`text-white font-semibold ${getTriggerColor(abilityData.trigger)}`}>
                  {abilityData.trigger.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
            <p className="text-muted-foreground leading-relaxed">{abilityData.description}</p>
          </div>

          {/* Battle Effect */}
          {abilityData.effect && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Battle Effect</h4>
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-3">
                  <p className="text-sm text-foreground">{abilityData.effect}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Flavor Text */}
          {abilityData.flavorText && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Flavor Text</h4>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground italic">{abilityData.flavorText}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stat Changes */}
          {abilityData.stats && abilityData.stats.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Stat Changes</h4>
              <div className="flex flex-wrap gap-2">
                {abilityData.stats.map((statChange: any, index: number) => (
                  <Card key={index} className="border">
                    <CardContent className="p-2 text-center">
                      <div className="text-xs text-muted-foreground capitalize">{statChange.stat}</div>
                      <div className={`text-sm font-bold ${statChange.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {statChange.change > 0 ? '+' : ''}{statChange.change}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Activation Rate */}
          {abilityData.activationRate && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Activation</h4>
              <Badge variant="secondary" className="text-sm">
                {abilityData.activationRate}% chance
              </Badge>
            </div>
          )}

          {/* Hidden Ability Notice */}
          {abilityData.hiddenAbility && (
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <CardContent className="p-4">
                <Badge className="bg-purple-500 hover:bg-purple-600 text-white mb-2">
                  Hidden Ability
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This is a rare hidden ability that can only be obtained through special encounters.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbilityInfo;
