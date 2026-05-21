export type Gender = 'male' | 'female';
export type GoalType = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  name: string;
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  goal: GoalType;
  activityLevel: ActivityLevel;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
}

export interface MealRecord {
  breakfast: FoodItem[];
  lunch: FoodItem[];
  dinner: FoodItem[];
  snack: FoodItem[];
}

export interface ExerciseItem {
  id: string;
  name: string;
  duration: number;
  calories: number;
}

export interface DailyRecord {
  date: string;
  meals: MealRecord;
  exercises: ExerciseItem[];
}

export interface BMIResult {
  value: number;
  category: string;
  color: string;
  description: string;
}

export type MealType = keyof MealRecord;
