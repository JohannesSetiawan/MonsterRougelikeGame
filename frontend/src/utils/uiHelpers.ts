export const getRarityColor = (rarity?: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
    case 'uncommon': return 'bg-green-500/20 text-green-700 border-green-500/50';
    case 'rare': return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
    case 'legendary': return 'bg-purple-500/20 text-purple-700 border-purple-500/50';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
  }
};
