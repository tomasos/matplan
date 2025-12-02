import { useState, useMemo } from 'react';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useWeekPlan } from '../contexts/WeekPlanContext';
import { useMeals } from '../hooks/useMeals';
import { useSettings } from '../contexts/SettingsContext';
import { getDayKey } from '../utils/weekUtils';
import { generateSmartMealPlan } from '../utils/mealGenerator';
import { WeekSelector } from '../components/WeekSelector';
import { MealCard } from '../components/MealCard';
import { MealSelectionModal } from '../components/MealSelectionModal';
import { BottomNav } from '../components/BottomNav';
import './WeekPlanner.css';

export function WeekPlanner() {
  const { year, week, weekInfo, goToPreviousWeek, goToNextWeek } = useWeekNavigation();
  const { weekPlans, setMealForDay, setWeekPlansBatch, clearWeek } = useWeekPlan();
  const { meals } = useMeals();
  const { categoryWeightings } = useSettings();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Memoize the day cards with meals to ensure re-render when meals or weekInfo change
  const dayCards = useMemo(() => {
    return weekInfo.days.map((dayInfo) => {
      const dayKey = getDayKey(year, week, dayInfo.day);
      const meal = dayInfo.mealId ? meals.find((m) => m.id === dayInfo.mealId) : undefined;
      return {
        dayKey,
        dayInfo,
        meal,
      };
    });
  }, [weekInfo, meals, year, week]);

  const handleCardClick = (dayKey: string) => {
    setSelectedDay(dayKey);
  };

  const handleMealSelect = (mealId: string) => {
    if (selectedDay) {
      setMealForDay(selectedDay, mealId);
      setSelectedDay(null);
    }
  };

  const handleGenerate = () => {
    const newPlan = generateSmartMealPlan(meals, year, week, weekPlans, categoryWeightings);
    setWeekPlansBatch(newPlan);
  };

  const handleClearAll = () => {
    const dayKeys = weekInfo.days.map((day) => getDayKey(year, week, day.day));
    clearWeek(dayKeys);
  };

  const availableMeals = meals;

  return (
    <div className="week-planner">
      <WeekSelector week={week} onPrevious={goToPreviousWeek} onNext={goToNextWeek} />
      
      <div className="week-planner-grid">
        {dayCards.map(({ dayKey, dayInfo, meal }) => (
          <MealCard
            key={`${dayKey}-${meal?.id || 'empty'}-${meal?.name || ''}`}
            day={dayInfo.day}
            mealName={meal?.name}
            category={meal?.category}
            onClick={() => handleCardClick(dayKey)}
          />
        ))}
      </div>

      <div className="week-planner-actions">
        <button onClick={handleGenerate} className="action-button generate-button font-display-semibold-16">
          Generer
        </button>
        <button onClick={handleClearAll} className="action-button clear-button font-display-semibold-16">
          Slett alle
        </button>
      </div>

      {selectedDay && (
        <MealSelectionModal
          meals={availableMeals}
          onSelect={handleMealSelect}
          onClose={() => setSelectedDay(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}

