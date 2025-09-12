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

export const useExperienceData = (monster: MonsterInstance, shouldDefer?: boolean): ExperienceData => {
  const [experienceData, setExperienceData] = useState<ExperienceData>({
    current: monster.experience,
    required: monster.level * 100, // fallback value
    percentage: 0,
    loading: true,
    error: null
  });



  useEffect(() => {
    // Only fetch data if we're not deferring or if this is the initial load
    if (shouldDefer && experienceData.current !== 0) {
      return;
    }

    const currentMonster = monster;
    
    const fetchExperienceData = async () => {
      try {
        setExperienceData(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await gameApi.getExperienceForLevel(currentMonster.monsterId, currentMonster.level);
        const required = result.experienceForNextLevel;
        const percentage = (currentMonster.experience / required) * 100;
        
        setExperienceData({
          current: currentMonster.experience,
          required,
          percentage,
          loading: false,
          error: null
        });
      } catch (error) {
        const fallbackRequired = currentMonster.level * 100;
        const percentage = (currentMonster.experience / fallbackRequired) * 100;
        
        setExperienceData({
          current: currentMonster.experience,
          required: fallbackRequired,
          percentage,
          loading: false,
          error: ErrorHandler.getDisplayMessage(error, 'Using fallback calculation')
        });
        
        ErrorHandler.handle(error, 'useExperienceData.fetchExperienceData');
      }
    };

    fetchExperienceData();
  }, [monster.monsterId, monster.level, monster.experience, shouldDefer]);

  return experienceData;
};

export default useExperienceData;
