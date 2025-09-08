import { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';
import { ErrorHandler } from '../utils/errorHandler';
import type { MonsterInstance } from '../api/types';

interface ExperienceData {
  current: number;
  required: number;
  percentage: number;
  loading: boolean;
  error: string | null;
}

export const useExperienceData = (monster: MonsterInstance): ExperienceData => {
  const [experienceData, setExperienceData] = useState<ExperienceData>({
    current: monster.experience,
    required: monster.level * 100, // fallback value
    percentage: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchExperienceData = async () => {
      try {
        setExperienceData(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await gameApi.getExperienceForLevel(monster.monsterId, monster.level);
        const required = result.experienceForNextLevel;
        const percentage = (monster.experience / required) * 100;
        
        setExperienceData({
          current: monster.experience,
          required,
          percentage,
          loading: false,
          error: null
        });
      } catch (error) {
        const fallbackRequired = monster.level * 100;
        const percentage = (monster.experience / fallbackRequired) * 100;
        
        setExperienceData({
          current: monster.experience,
          required: fallbackRequired,
          percentage,
          loading: false,
          error: ErrorHandler.getDisplayMessage(error, 'Using fallback calculation')
        });
        
        ErrorHandler.handle(error, 'useExperienceData.fetchExperienceData');
      }
    };

    fetchExperienceData();
  }, [monster.monsterId, monster.level, monster.experience]);

  return experienceData;
};

export default useExperienceData;
