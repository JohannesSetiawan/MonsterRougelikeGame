import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BattleLogProps {
  battleLog: Array<{text: string, isCritical?: boolean}>;
  isProcessing: boolean;
}

const BattleLog: React.FC<BattleLogProps> = ({ battleLog, isProcessing }) => {
  return (
    <Card className="border-2 border-amber-500/50 bg-amber-950/10">
      <CardHeader>
        <CardTitle className="text-amber-200">Battle Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {battleLog.slice(-6).map((message, index) => (
            <div 
              key={index} 
              className={`text-sm p-2 bg-amber-950/20 rounded ${
                message.isCritical 
                  ? 'text-red-400 font-bold animate-pulse border-l-4 border-red-500' 
                  : (message.text.includes('Items are used with priority') || message.text.includes('Catching attempts are made with priority'))
                    ? 'text-yellow-300 font-semibold border-l-4 border-yellow-500'
                    : 'text-amber-100/80'
              }`}
            >
              {message.text}
            </div>
          ))}
          {isProcessing && (
            <div className="text-sm text-amber-200 p-2 bg-amber-500/20 rounded flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-300" />
              Processing turn...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BattleLog;
