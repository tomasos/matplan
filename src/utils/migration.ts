import { Meal } from '../types';
import { CategoryWeightings } from '../contexts/SettingsContext';
import { ShoppingListItem } from '../contexts/ShoppingListContext';
import { WeekPlan } from '../types';

interface LocalStorageData {
  meals: Meal[];
  weekPlans: WeekPlan;
  categoryWeightings: CategoryWeightings;
  shoppingLists: Record<string, { items: ShoppingListItem[]; customItemHistory: string[] }>;
}

export function hasLocalStorageData(): boolean {
  try {
    const meals = sessionStorage.getItem('meals');
    const weekPlans = sessionStorage.getItem('weekPlans');
    const categoryWeightings = localStorage.getItem('categoryWeightings');
    const shoppingLists = sessionStorage.getItem('shoppingLists');

    return !!(meals || weekPlans || categoryWeightings || shoppingLists);
  } catch {
    return false;
  }
}

export function loadLocalStorageData(): LocalStorageData {
  const data: LocalStorageData = {
    meals: [],
    weekPlans: {},
    categoryWeightings: { meat: 1, fish: 1, vegetarian: 1 },
    shoppingLists: {},
  };

  try {
    const mealsStr = sessionStorage.getItem('meals');
    if (mealsStr) {
      data.meals = JSON.parse(mealsStr);
    }
  } catch {
    // Ignore
  }

  try {
    const weekPlansStr = sessionStorage.getItem('weekPlans');
    if (weekPlansStr) {
      data.weekPlans = JSON.parse(weekPlansStr);
    }
  } catch {
    // Ignore
  }

  try {
    const weightingsStr = localStorage.getItem('categoryWeightings');
    if (weightingsStr) {
      const parsed = JSON.parse(weightingsStr);
      if (
        typeof parsed.meat === 'number' &&
        typeof parsed.fish === 'number' &&
        typeof parsed.vegetarian === 'number'
      ) {
        data.categoryWeightings = parsed;
      }
    }
  } catch {
    // Ignore
  }

  try {
    const shoppingListsStr = sessionStorage.getItem('shoppingLists');
    if (shoppingListsStr) {
      data.shoppingLists = JSON.parse(shoppingListsStr);
    }
  } catch {
    // Ignore
  }

  return data;
}

export function clearLocalStorageData(): void {
  try {
    sessionStorage.removeItem('meals');
    sessionStorage.removeItem('weekPlans');
    sessionStorage.removeItem('shoppingLists');
    localStorage.removeItem('categoryWeightings');
  } catch {
    // Ignore
  }
}

