import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EncounterSectionProps {
  encounter: any;
  onItemEncounter: () => void;
  onRestSiteEncounter: () => void;
  isProcessingEncounter: boolean;
  isLoading: boolean;
}

export const EncounterSection: React.FC<EncounterSectionProps> = ({
  encounter,
  onItemEncounter,
  onRestSiteEncounter,
  isProcessingEncounter,
  isLoading
}) => {
  if (!encounter || encounter.type === 'wild_monster') {
    return null;
  }

  return (
    <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="text-xl capitalize flex items-center gap-2">
          ⚡ {encounter.type.replace('_', ' ')} Encounter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {encounter.type === 'item' && (
          <>
            <div className="space-y-2">
              <p className="text-lg">
                🎁 You found: <span className="font-semibold">{encounter.data?.name || 'Unknown Item'}</span>
              </p>
              <p className="text-muted-foreground">
                {encounter.data?.description || 'A mysterious item'}
              </p>
            </div>
            <Button 
              onClick={onItemEncounter}
              disabled={isProcessingEncounter || isLoading}
              className="w-full"
            >
              {isProcessingEncounter ? 'Taking...' : 'Take Item'}
            </Button>
          </>
        )}
        
        {encounter.type === 'rest_site' && (
          <>
            <div className="space-y-2">
              <p className="text-lg">
                🏕️ You found a rest site!
              </p>
              <p className="text-muted-foreground">
                Your team will be fully healed and all PP restored.
              </p>
            </div>
            <Button 
              onClick={onRestSiteEncounter}
              disabled={isProcessingEncounter || isLoading}
              className="w-full"
            >
              {isProcessingEncounter ? 'Resting...' : 'Rest and Continue'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
