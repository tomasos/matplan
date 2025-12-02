import { Meal, DayOfWeek } from '../types';
import { getDayKey } from './weekUtils';
import { CategoryWeightings } from '../contexts/SettingsContext';

export function generateSmartMealPlan(
  meals: Meal[],
  year: number,
  week: number,
  existingPlan: { [dayKey: string]: string | null },
  categoryWeightings: CategoryWeightings = { meat: 1, fish: 1, vegetarian: 1 }
): { [dayKey: string]: string } {
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const availableMeals = meals;
  
  if (availableMeals.length === 0) {
    return {};
  }

  // Get meals from previous week to avoid repetition across weeks
  const getPreviousWeekMeals = (): Set<string> => {
    let prevWeek = week - 1;
    let prevYear = year;
    if (prevWeek < 1) {
      prevWeek = 52;
      prevYear = year - 1;
    }
    const prevWeekMeals = new Set<string>();
    days.forEach((day) => {
      const dayKey = getDayKey(prevYear, prevWeek, day);
      const mealId = existingPlan[dayKey];
      if (mealId) {
        prevWeekMeals.add(mealId);
      }
    });
    return prevWeekMeals;
  };

  const previousWeekMeals = getPreviousWeekMeals();

  // Count meals by category
  const categoryCounts: Record<string, number> = {
    meat: 0,
    fish: 0,
    vegetarian: 0,
  };

  // Count existing assignments for the week
  days.forEach((day) => {
    const dayKey = getDayKey(year, week, day);
    const mealId = existingPlan[dayKey];
    if (mealId) {
      const meal = meals.find((m) => m.id === mealId);
      if (meal) {
        categoryCounts[meal.category]++;
      }
    }
  });

  // Calculate total weight and target distribution based on weightings
  const totalWeight = categoryWeightings.meat + categoryWeightings.fish + categoryWeightings.vegetarian;
  const daysToFill = days.filter((day) => {
    const dayKey = getDayKey(year, week, day);
    return !existingPlan[dayKey];
  }).length;

  // If no weighting is set (total is 0), default to equal distribution
  const normalizedWeightings = totalWeight > 0
    ? categoryWeightings
    : { meat: 1, fish: 1, vegetarian: 1 };
  const adjustedTotalWeight = totalWeight > 0 ? totalWeight : 3;

  // Calculate target counts for each category based on weightings
  const targetCounts: Record<string, number> = {
    meat: Math.round((normalizedWeightings.meat / adjustedTotalWeight) * daysToFill),
    fish: Math.round((normalizedWeightings.fish / adjustedTotalWeight) * daysToFill),
    vegetarian: Math.round((normalizedWeightings.vegetarian / adjustedTotalWeight) * daysToFill),
  };

  // Adjust for rounding errors to ensure we fill all days
  const currentTargetTotal = targetCounts.meat + targetCounts.fish + targetCounts.vegetarian;
  if (currentTargetTotal < daysToFill) {
    const diff = daysToFill - currentTargetTotal;
    // Add the difference to the category with the highest weighting
    const highestCategory = normalizedWeightings.meat >= normalizedWeightings.fish && normalizedWeightings.meat >= normalizedWeightings.vegetarian
      ? 'meat'
      : normalizedWeightings.fish >= normalizedWeightings.vegetarian
      ? 'fish'
      : 'vegetarian';
    targetCounts[highestCategory] += diff;
  }

  const newPlan: { [dayKey: string]: string } = {};

  // Track meals used in the current week (both existing and newly assigned)
  const usedMealsThisWeek = new Set<string>();
  days.forEach((day) => {
    const dayKey = getDayKey(year, week, day);
    const mealId = existingPlan[dayKey];
    if (mealId) {
      usedMealsThisWeek.add(mealId);
    }
  });

  // Shuffle meals for randomness
  const shuffled = [...availableMeals].sort(() => Math.random() - 0.5);

  // Track the last meal used to avoid consecutive duplicates
  let lastMealId: string | null = null;
  if (previousWeekMeals.size > 0) {
    // Get the last meal from previous week (Sunday)
    let prevWeek = week - 1;
    let prevYear = year;
    if (prevWeek < 1) {
      prevWeek = 52;
      prevYear = year - 1;
    }
    const prevWeekSundayKey = getDayKey(prevYear, prevWeek, 'Sunday');
    lastMealId = existingPlan[prevWeekSundayKey] || null;
  }

  days.forEach((day, dayIndex) => {
    const dayKey = getDayKey(year, week, day);
    
    // Skip if already assigned
    if (existingPlan[dayKey]) {
      newPlan[dayKey] = existingPlan[dayKey]!;
      lastMealId = existingPlan[dayKey];
      return;
    }

    // Determine if this is a weekend day (Friday, Saturday, Sunday)
    const isWeekendDay = day === 'Friday' || day === 'Saturday' || day === 'Sunday';

    // Filter meals based on weekend flag
    // Weekend days: only weekend meals
    // Weekdays: only non-weekend meals
    const availableMealsForDay = shuffled.filter((meal) => 
      meal.weekendMeal === isWeekendDay
    );

    // If no meals available for this day type, fall back to all meals
    const mealsToConsider = availableMealsForDay.length > 0 ? availableMealsForDay : shuffled;

    // Get the previous day's meal to avoid consecutive duplicates
    let previousDayMealId: string | null = lastMealId;
    if (dayIndex > 0) {
      const previousDay = days[dayIndex - 1];
      const previousDayKey = getDayKey(year, week, previousDay);
      previousDayMealId = newPlan[previousDayKey] || existingPlan[previousDayKey] || null;
    }

    // Find a meal that helps balance the distribution according to weightings
    // Calculate how much each category is "behind" its target
    const categoryDeficit: Record<string, number> = {
      meat: targetCounts.meat - categoryCounts.meat,
      fish: targetCounts.fish - categoryCounts.fish,
      vegetarian: targetCounts.vegetarian - categoryCounts.vegetarian,
    };

    // Sort categories by deficit (highest first) to prioritize filling those
    const categoriesByPriority = (['meat', 'fish', 'vegetarian'] as Array<'meat' | 'fish' | 'vegetarian'>).sort(
      (a, b) => categoryDeficit[b] - categoryDeficit[a]
    );

    // Scoring function to prioritize meals
    const scoreMeal = (meal: Meal): number => {
      let score = 0;
      
      // High priority: meals that haven't been used this week
      if (!usedMealsThisWeek.has(meal.id)) {
        score += 1000;
      }
      
      // High priority: meals not from previous week
      if (!previousWeekMeals.has(meal.id)) {
        score += 500;
      }
      
      // Medium priority: not the previous day's meal
      if (meal.id !== previousDayMealId) {
        score += 100;
      }
      
      // Category deficit bonus
      const deficit = categoryDeficit[meal.category];
      score += deficit * 10;
      
      return score;
    };

    // Find the best meal by scoring all available meals
    let selectedMeal: Meal | undefined;
    
    // First, try to find an unused meal from a category that needs more meals
    const candidates = mealsToConsider
      .filter((meal) => {
        const deficit = categoryDeficit[meal.category];
        const isNotPreviousMeal = meal.id !== previousDayMealId;
        return deficit > 0 && isNotPreviousMeal;
      })
      .sort((a, b) => scoreMeal(b) - scoreMeal(a));
    
    selectedMeal = candidates[0];

    // If no meal found from categories with deficit, try any meal from highest priority category
    if (!selectedMeal) {
      const highestDeficitCategory = categoriesByPriority[0];
      const categoryCandidates = mealsToConsider
        .filter((meal) => meal.category === highestDeficitCategory && meal.id !== previousDayMealId)
        .sort((a, b) => scoreMeal(b) - scoreMeal(a));
      selectedMeal = categoryCandidates[0];
    }

    // Fallback: any meal that's not the previous one, prioritizing unused meals
    if (!selectedMeal) {
      const fallbackCandidates = mealsToConsider
        .filter((meal) => meal.id !== previousDayMealId)
        .sort((a, b) => scoreMeal(b) - scoreMeal(a));
      selectedMeal = fallbackCandidates[0];
    }

    // Last resort: use any meal (even if it's the previous one) to avoid infinite loop
    if (!selectedMeal && mealsToConsider.length > 0) {
      selectedMeal = mealsToConsider[0];
    }

    if (selectedMeal) {
      newPlan[dayKey] = selectedMeal.id;
      categoryCounts[selectedMeal.category]++;
      usedMealsThisWeek.add(selectedMeal.id);
      lastMealId = selectedMeal.id;
    }
  });

  return newPlan;
}

