import { MacroTargets } from '../types';

export const DEFAULT_TARGETS: MacroTargets = {
  mode: 'cycling',
  highCarb: { carbs: 300, protein: 180, fats: 60, calories: 2400 },
  moderateCarb: { carbs: 225, protein: 180, fats: 70, calories: 2250 },
  lowCarb:  { carbs: 150, protein: 180, fats: 80,  calories: 2000 },
};
