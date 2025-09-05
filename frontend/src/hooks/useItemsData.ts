import { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';

interface UseItemsDataReturn {
  itemsData: Record<string, any>;
  loading: boolean;
  error: string | null;
  getItemById: (itemId: string) => any | null;
  refreshItems: () => Promise<void>;
}

export const useItemsData = (): UseItemsDataReturn => {
  const [itemsData, setItemsData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItemsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the getAllItems API endpoint to load all items data
      const items = await gameApi.getAllItems();
      setItemsData(items);
    } catch (err) {
      console.error('Failed to load items data:', err);
      setError('Failed to load items data');
      setItemsData({});
    } finally {
      setLoading(false);
    }
  };

  const getItemById = (itemId: string) => {
    return itemsData[itemId] || null;
  };

  const refreshItems = async () => {
    await loadItemsData();
  };

  useEffect(() => {
    loadItemsData();
  }, []);

  return {
    itemsData,
    loading,
    error,
    getItemById,
    refreshItems
  };
};
