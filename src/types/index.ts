export type MealCategory = 'meat' | 'fish' | 'vegetarian';

export interface Ingredient {
  name: string;
  quantity: number;
}

export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  link?: string;
  about?: string;
  ingredients: Ingredient[];
  favorite: boolean;
  weekendMeal: boolean;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface WeekPlan {
  [dayKey: string]: string | null; // dayKey format: "2024-W47-Monday", value is mealId or null
}

export interface WeekInfo {
  year: number;
  week: number;
  days: {
    day: DayOfWeek;
    date: Date;
    mealId: string | null;
  }[];
}

export interface Household {
  $id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  customItemHistory?: string[];
}

export interface HouseholdInvitation {
  $id: string;
  householdId: string;
  email: string;
  inviterId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

