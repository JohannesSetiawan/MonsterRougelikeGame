import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useExperienceData } from '../hooks/useExperienceData';
import type { MonsterInstance } from '../api/types';

interface ExperienceBarProps {
  monster: MonsterInstance;
  className?: string;
  textColor?: string;
}

const ExperienceBar: React.FC<ExperienceBarProps> = ({ 
  monster, 
  className = "", 
  textColor = "text-muted-foreground" 
}) => {
  const experienceData = useExperienceData(monster);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className={textColor}>EXP</span>
        <span className={textColor}>
          {experienceData.current}/{experienceData.required}
          {experienceData.loading && " (loading...)"}
        </span>
      </div>
      <Progress 
        value={experienceData.percentage} 
        className="h-2"
      />
    </div>
  );
};

export default ExperienceBar;
