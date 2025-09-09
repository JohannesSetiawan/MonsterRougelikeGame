import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MonsterCard from './MonsterCard';

interface TeamSectionProps {
  team: any[];
}

export const TeamSection: React.FC<TeamSectionProps> = ({ team }) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl">Your Team</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((monster) => (
            <MonsterCard key={monster.id} monster={monster} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
