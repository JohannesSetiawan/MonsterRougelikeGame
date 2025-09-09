import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProgressSectionProps {
  onProgressStage: () => void;
  onShowShop: () => void;
  isLoading: boolean;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  onProgressStage,
  onShowShop,
  isLoading
}) => {
  return (
    <Card className="border-2 border-primary/50">
      <CardContent className="p-6 text-center space-y-4">
        <Button 
          size="lg"
          onClick={onProgressStage}
          disabled={isLoading}
          className="px-8 py-4 text-lg w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
              Exploring...
            </>
          ) : (
            'Continue Adventure'
          )}
        </Button>
        <Button 
          variant="outline"
          size="lg"
          onClick={onShowShop}
          disabled={isLoading}
          className="px-8 py-4 text-lg w-full"
        >
          🛒 Visit Shop
        </Button>
      </CardContent>
    </Card>
  );
};
