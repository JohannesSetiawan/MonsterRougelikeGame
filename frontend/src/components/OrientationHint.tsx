import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { Card, CardContent } from '@/components/ui/card';

const OrientationHint: React.FC = () => {
  const screenInfo = useResponsive();

  // Only show hint on mobile portrait mode
  if (!screenInfo.isMobile || screenInfo.isLandscape) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="border-2 border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/90 max-w-sm">
        <CardContent className="p-6 text-center space-y-4">
          <div className="text-6xl">📱</div>
          <p className="text-lg text-amber-900 dark:text-amber-100">
            For better gaming experience, try rotating your device to landscape mode!
          </p>
          <div className="text-4xl animate-spin">🔄</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrientationHint;
