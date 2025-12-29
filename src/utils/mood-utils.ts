export interface MoodConfig {
  emoji: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  label: {
    en: string;
    fr: string;
  };
}

const moodMap = new Map<string, MoodConfig>([
  ['heureux', {
    emoji: '😊',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    label: { en: 'Happy', fr: 'Heureux' }
  }],
  ['happy', {
    emoji: '😊',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    label: { en: 'Happy', fr: 'Heureux' }
  }],
  ['reconnaissant', {
    emoji: '❤️',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    textColor: 'text-pink-700 dark:text-pink-400',
    borderColor: 'border-pink-300 dark:border-pink-700',
    label: { en: 'Grateful', fr: 'Reconnaissant' }
  }],
  ['grateful', {
    emoji: '❤️',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    textColor: 'text-pink-700 dark:text-pink-400',
    borderColor: 'border-pink-300 dark:border-pink-700',
    label: { en: 'Grateful', fr: 'Reconnaissant' }
  }],
  ['content', {
    emoji: '😌',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-300 dark:border-orange-700',
    label: { en: 'Content', fr: 'Content' }
  }],
  ['joyeux', {
    emoji: '😄',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-700',
    label: { en: 'Joyful', fr: 'Joyeux' }
  }],
  ['joyful', {
    emoji: '😄',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-700',
    label: { en: 'Joyful', fr: 'Joyeux' }
  }],
  ['anxieux', {
    emoji: '😰',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-700',
    label: { en: 'Anxious', fr: 'Anxieux' }
  }],
  ['anxious', {
    emoji: '😰',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-700',
    label: { en: 'Anxious', fr: 'Anxieux' }
  }],
  ['triste', {
    emoji: '😢',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-700',
    label: { en: 'Sad', fr: 'Triste' }
  }],
  ['sad', {
    emoji: '😢',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-700',
    label: { en: 'Sad', fr: 'Triste' }
  }],
  ['stressé', {
    emoji: '😓',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-300 dark:border-orange-700',
    label: { en: 'Stressed', fr: 'Stressé' }
  }],
  ['stressed', {
    emoji: '😓',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-300 dark:border-orange-700',
    label: { en: 'Stressed', fr: 'Stressé' }
  }],
  ['préoccupé', {
    emoji: '😟',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-700',
    label: { en: 'Worried', fr: 'Préoccupé' }
  }],
  ['worried', {
    emoji: '😟',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-700',
    label: { en: 'Worried', fr: 'Préoccupé' }
  }],
  ['neutre', {
    emoji: '😐',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-300 dark:border-gray-600',
    label: { en: 'Neutral', fr: 'Neutre' }
  }],
  ['neutral', {
    emoji: '😐',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-300 dark:border-gray-600',
    label: { en: 'Neutral', fr: 'Neutre' }
  }],
  ['calme', {
    emoji: '🌙',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    textColor: 'text-indigo-700 dark:text-indigo-400',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
    label: { en: 'Calm', fr: 'Calme' }
  }],
  ['calm', {
    emoji: '🌙',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    textColor: 'text-indigo-700 dark:text-indigo-400',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
    label: { en: 'Calm', fr: 'Calme' }
  }],
  ['serein', {
    emoji: '☁️',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
    textColor: 'text-cyan-700 dark:text-cyan-400',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
    label: { en: 'Serene', fr: 'Serein' }
  }],
  ['serene', {
    emoji: '☁️',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
    textColor: 'text-cyan-700 dark:text-cyan-400',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
    label: { en: 'Serene', fr: 'Serein' }
  }],
]);

const defaultMoodConfig: MoodConfig = {
  emoji: '☕',
  bgColor: 'bg-muted',
  textColor: 'text-muted-foreground',
  borderColor: 'border-border',
  label: { en: 'Unknown', fr: 'Inconnu' }
};

export function getMoodConfig(mood: string | undefined, _language: 'en' | 'fr' = 'en'): MoodConfig {
  if (!mood) {
    return defaultMoodConfig;
  }

  const normalizedMood = mood.toLowerCase().trim();
  const config = moodMap.get(normalizedMood);

  if (config) {
    return config;
  }

  return defaultMoodConfig;
}
