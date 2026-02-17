import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export const CATEGORY_ICONS: Record<string, IconName> = {
  food_dining: 'silverware-fork-knife',
  entertainment: 'movie-open-outline',
  shopping: 'shopping-outline',
  housekeeping: 'home-outline',
  subscriptions: 'repeat',
  transport: 'bus',
  health: 'heart-pulse',
  education: 'school-outline',
  personal_care: 'face-man-shimmer-outline',
  gifts: 'gift-outline',
  travel: 'airplane',
  other: 'dots-horizontal',
};
