import type { UserProfile, BMIResult, ActivityLevel } from '../types';

export function calcBMI(weight: number, height: number): BMIResult {
  const h = height / 100;
  const value = Math.round((weight / (h * h)) * 10) / 10;

  if (value < 18.5) {
    return { value, category: '偏瘦', color: '#60A5FA', description: '体重略低，适当增加营养摄入' };
  } else if (value < 24) {
    return { value, category: '正常', color: '#22C55E', description: '体重维持在理想范围，继续保持！' };
  } else if (value < 28) {
    return { value, category: '超重', color: '#F97316', description: '体重略高，建议适当控制饮食' };
  } else {
    return { value, category: '肥胖', color: '#EF4444', description: '建议制定科学减重计划，配合运动' };
  }
}

export function calcBMR(profile: UserProfile): number {
  const { weight, height, age, gender } = profile;
  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcTDEE(profile: UserProfile): number {
  const bmr = calcBMR(profile);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
}

export function calcTargetCalories(profile: UserProfile): number {
  const tdee = calcTDEE(profile);
  if (profile.goal === 'lose') return Math.round(tdee - 500);
  if (profile.goal === 'gain') return Math.round(tdee + 300);
  return tdee;
}
