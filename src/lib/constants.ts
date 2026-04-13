import { MacroTarget } from '../types';

export const DEFAULT_TARGETS: { highCarb: MacroTarget; lowCarb: MacroTarget } = {
  highCarb: { carbs: 300, protein: 180, fats: 60, calories: 2400 },
  lowCarb:  { carbs: 150, protein: 180, fats: 80,  calories: 2000 },
};
