import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GameHeaderProps {
  currentStage: number;
  currency: number;
  onTeamManagement: () => void;
  onDebugPage: () => void;
  onSaveProgress: () => void;
  onEndRun: () => void;
  isSaving: boolean;
  isEndingRun: boolean;
  isLoading: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentStage,
  currency,
  onTeamManagement,
  onDebugPage,
  onSaveProgress,
  onEndRun,
  isSaving,
  isEndingRun,
  isLoading
}) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <CardTitle className="text-2xl md:text-3xl">
              Stage {currentStage}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                💰 {currency} Coins
              </Badge>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={onTeamManagement}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              👥 Team Details
            </Button>
            {/* Debug mode button - only visible in development */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <Button 
                  variant="outline"
                  onClick={onDebugPage}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-xs"
                  size="sm"
                  title="Debug Mode (Ctrl+Shift+D)"
                >
                  🔧 Debug
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('/admin', '_blank')}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-xs"
                  size="sm"
                  title="Admin Panel"
                >
                  ⚙️ Admin
                </Button>
              </>
            )}
            <Button 
              variant="secondary"
              onClick={onSaveProgress}
              disabled={isSaving || isLoading}
              className="flex items-center gap-2"
            >
              {isSaving ? '💾 Saving...' : '💾 Save Progress'}
            </Button>
            <Button 
              variant="destructive"
              onClick={onEndRun}
              disabled={isEndingRun || isLoading}
            >
              {isEndingRun ? 'Ending...' : 'End Run'}
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
