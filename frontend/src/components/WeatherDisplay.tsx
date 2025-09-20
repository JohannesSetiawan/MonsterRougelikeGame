import { Weather } from '../api/types';
import type { WeatherCondition } from '../api/types';

interface WeatherDisplayProps {
  weather?: WeatherCondition;
}

interface WeatherInfo {
  name: string;
  description: string;
  icon: string;
  bgColor: string;
  textColor: string;
}

const getWeatherInfo = (weather: Weather): WeatherInfo => {
  switch (weather) {
    case Weather.HARSH_SUNLIGHT:
      return {
        name: 'Harsh Sunlight',
        description: 'Fire moves boosted, Water moves weakened',
        icon: '☀️',
        bgColor: 'from-yellow-400 to-orange-500',
        textColor: 'text-white'
      };
    case Weather.RAIN:
      return {
        name: 'Rain',
        description: 'Water moves boosted, Fire moves weakened',
        icon: '🌧️',
        bgColor: 'from-blue-400 to-blue-600',
        textColor: 'text-white'
      };
    case Weather.SANDSTORM:
      return {
        name: 'Sandstorm',
        description: 'Rock-types get Sp.Def boost, others take damage',
        icon: '🌪️',
        bgColor: 'from-yellow-600 to-amber-700',
        textColor: 'text-white'
      };
    case Weather.HAIL:
      return {
        name: 'Hail',
        description: 'Ice-types get Defense boost, others take damage',
        icon: '🧊',
        bgColor: 'from-cyan-400 to-blue-500',
        textColor: 'text-white'
      };
    case Weather.FOG:
      return {
        name: 'Fog',
        description: 'All moves have reduced accuracy',
        icon: '🌫️',
        bgColor: 'from-gray-400 to-gray-600',
        textColor: 'text-white'
      };
    case Weather.STRONG_WINDS:
      return {
        name: 'Strong Winds',
        description: 'Flying-types resist Electric, Ice, and Rock',
        icon: '💨',
        bgColor: 'from-green-400 to-teal-500',
        textColor: 'text-white'
      };
    default:
      return {
        name: 'Unknown Weather',
        description: '',
        icon: '❓',
        bgColor: 'from-gray-400 to-gray-600',
        textColor: 'text-white'
      };
  }
};

const WeatherDisplay = ({ weather }: WeatherDisplayProps) => {
  if (!weather) {
    return null; // Don't show anything if there's no weather
  }

  const weatherInfo = getWeatherInfo(weather.weather);

  return (
    <div className={`bg-gradient-to-r ${weatherInfo.bgColor} rounded-lg p-3 mb-4 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label={weatherInfo.name}>
            {weatherInfo.icon}
          </span>
          <div>
            <h3 className={`font-bold text-sm ${weatherInfo.textColor}`}>
              {weatherInfo.name}
            </h3>
            <p className={`text-xs ${weatherInfo.textColor} opacity-90`}>
              {weatherInfo.description}
            </p>
          </div>
        </div>
        {weather.turnsRemaining && (
          <div className={`text-xs ${weatherInfo.textColor} opacity-80 font-medium`}>
            {weather.turnsRemaining} turns left
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDisplay;