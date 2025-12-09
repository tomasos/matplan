import { useState, useMemo } from 'react';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useWeekPlan } from '../contexts/WeekPlanContext';
import { useMeals } from '../hooks/useMeals';
import { useSettings } from '../contexts/SettingsContext';
import { getDayKey } from '../utils/weekUtils';
import { generateSmartMealPlan } from '../utils/mealGenerator';
import { fuzzySearch } from '../utils/searchUtils';
import { MealCategory } from '../types';
import { WeekSelector } from '../components/WeekSelector';
import { MealCard } from '../components/MealCard';
import { MealListItem } from '../components/MealListItem';
import { MealSelectionModal } from '../components/MealSelectionModal';
import { AddMealModal } from '../components/AddMealModal';
import { SidebarMenu } from '../components/SidebarMenu';
import { ShoppingList } from './ShoppingList';
import { AddMeal } from './AddMeal';
import { Settings } from './Settings';
import { Calendar, Carrot, Fish, Beef, Heart, Plus, X } from 'lucide-react';
import './Desktop.css';

export function Desktop() {
  const { year, week, weekInfo, goToPreviousWeek, goToNextWeek } = useWeekNavigation();
  const { weekPlans, setMealForDay, setWeekPlansBatch, clearWeek } = useWeekPlan();
  const { meals, toggleFavorite } = useMeals();
  const { categoryWeightings } = useSettings();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<MealCategory>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeView, setActiveView] = useState<'shopping' | 'add-meal' | 'settings' | null>(null);

  // Memoize the day cards with meals to ensure re-render when meals change
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
  }, [weekInfo.days, meals, year, week]);

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

  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      if (selectedCategories.size > 0 && !selectedCategories.has(meal.category)) {
        return false;
      }
      if (showFavorites && !meal.favorite) {
        return false;
      }
      if (searchQuery && !fuzzySearch(searchQuery, meal.name)) {
        return false;
      }
      return true;
    });
  }, [meals, selectedCategories, showFavorites, searchQuery]);

  const toggleCategory = (category: MealCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };
  const handleRemoveMeal = (dayKey: string) => {
    setMealForDay(dayKey, null);
  };

  return (
    <div className="desktop-layout">
      <div className="desktop-left">
        <div className="desktop-nav">
          <Calendar size={24} />
        </div>
        <WeekSelector week={week} onPrevious={goToPreviousWeek} onNext={goToNextWeek} />
        
        <div className="desktop-week-grid">
          {dayCards.map(({ dayKey, dayInfo, meal }) => (
            <MealCard
              key={`${dayKey}-${meal?.id || 'empty'}-${meal?.name || ''}`}
              day={dayInfo.day}
              mealName={meal?.name}
              category={meal?.category}
              onClick={() => handleCardClick(dayKey)}
              onLongPress={() => handleRemoveMeal(dayKey)}
            />
          ))}
        </div>

        <div className="desktop-actions">
          <button onClick={handleGenerate} className="desktop-action-button generate-button font-display-semibold-16">
            Generer
          </button>
          <button onClick={handleClearAll} className="desktop-action-button clear-button font-display-semibold-16">
            Slett alle
          </button>
        </div>
      </div>

      <div className="desktop-right">
        <div className="desktop-right-content">
          <div className="desktop-meal-filters">
            <button
              onClick={() => toggleCategory('vegetarian')}
              className={`desktop-filter-button ${selectedCategories.has('vegetarian') ? 'active' : ''}`}
            >
              <Carrot size={24} />
            </button>
            <button
              onClick={() => toggleCategory('fish')}
              className={`desktop-filter-button ${selectedCategories.has('fish') ? 'active' : ''}`}
            >
              <Fish size={24} />
            </button>
            <button
              onClick={() => toggleCategory('meat')}
              className={`desktop-filter-button ${selectedCategories.has('meat') ? 'active' : ''}`}
            >
              <Beef size={24} />
            </button>
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`desktop-filter-button ${showFavorites ? 'active' : ''}`}
            >
              <Heart size={24} fill={showFavorites ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="desktop-search">
            <input
              type="text"
              placeholder="Søk"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="desktop-search-input font-regular-16"
            />
          </div>

          <div className="desktop-meal-list-header">
            <h2 className="desktop-meal-list-title font-display-semibold-20">Retter</h2>
            <button
              onClick={() => setShowAddMealModal(true)}
              className="desktop-add-meal-button font-display-semibold-16"
              aria-label="Add meal"
            >
              <Plus size={20} />
              Ny rett
            </button>
          </div>

          <div className="desktop-meal-list">
            {filteredMeals.map((meal) => (
              <MealListItem
                key={meal.id}
                meal={meal}
                onToggleFavorite={() => toggleFavorite(meal.id)}
                onClick={() => setEditingMealId(meal.id)}
              />
            ))}
          </div>
        </div>

        <SidebarMenu activeView={activeView} onMenuItemClick={setActiveView} />

        {/* Overlay container for sliding views */}
        {activeView && (
          <div className="desktop-overlay-backdrop" onClick={() => setActiveView(null)}>
            <div className="desktop-overlay-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="desktop-overlay-close"
                onClick={() => setActiveView(null)}
                aria-label="Close"
              >
                <X size={24} />
              </button>
              <div className="desktop-overlay-view">
                {activeView === 'shopping' && <ShoppingList onClose={() => setActiveView(null)} />}
                {activeView === 'add-meal' && <AddMeal onClose={() => setActiveView(null)} />}
                {activeView === 'settings' && <Settings onClose={() => setActiveView(null)} />}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedDay && (
        <MealSelectionModal
          meals={filteredMeals}
          onSelect={handleMealSelect}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {showAddMealModal && (
        <AddMealModal
          onClose={() => setShowAddMealModal(false)}
          onSave={() => {
            // Meal list will automatically update via context
          }}
        />
      )}

      {editingMealId && (
        <AddMealModal
          mealId={editingMealId}
          onClose={() => setEditingMealId(null)}
          onSave={() => {
            // Meal list will automatically update via context
          }}
        />
      )}
    </div>
  );
}

