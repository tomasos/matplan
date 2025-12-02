import { useState, useMemo } from 'react';
import { Meal, MealCategory } from '../types';
import { MealListItem } from './MealListItem';
import { fuzzySearch } from '../utils/searchUtils';
import { X, Carrot, Fish, Beef, Wine } from 'lucide-react';
import './MealSelectionModal.css';

interface MealSelectionModalProps {
  meals: Meal[];
  onSelect: (mealId: string) => void;
  onClose: () => void;
}

export function MealSelectionModal({ meals, onSelect, onClose }: MealSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<MealCategory>>(new Set());
  const [showWeekend, setShowWeekend] = useState(false);

  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      // Category filter
      if (selectedCategories.size > 0 && !selectedCategories.has(meal.category)) {
        return false;
      }

      // Weekend filter
      if (showWeekend && !meal.weekendMeal) {
        return false;
      }

      // Search filter
      if (searchQuery && !fuzzySearch(searchQuery, meal.name)) {
        return false;
      }

      return true;
    });
  }, [meals, selectedCategories, showWeekend, searchQuery]);

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

  const toggleWeekend = () => {
    setShowWeekend((prev) => !prev);
  };

  const handleSelect = (mealId: string) => {
    onSelect(mealId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-display-semibold-20">Velg rett</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="modal-filters">
          <button
            onClick={() => toggleCategory('vegetarian')}
            className={`modal-filter-button ${selectedCategories.has('vegetarian') ? 'active' : ''}`}
            aria-label="Vegetarian filter"
          >
            <Carrot size={24} />
          </button>
          <button
            onClick={() => toggleCategory('fish')}
            className={`modal-filter-button ${selectedCategories.has('fish') ? 'active' : ''}`}
            aria-label="Fish filter"
          >
            <Fish size={24} />
          </button>
          <button
            onClick={() => toggleCategory('meat')}
            className={`modal-filter-button ${selectedCategories.has('meat') ? 'active' : ''}`}
            aria-label="Meat filter"
          >
            <Beef size={24} />
          </button>
          <button
            onClick={toggleWeekend}
            className={`modal-filter-button ${showWeekend ? 'active' : ''}`}
            aria-label="Weekend filter"
          >
            <Wine size={24} />
          </button>
        </div>
        <div className="modal-search">
          <input
            type="text"
            placeholder="Søk"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="modal-search-input font-regular-16"
          />
        </div>
        <div className="modal-body">
          {filteredMeals.length === 0 ? (
            <p className="font-regular-16">Ingen retter funnet</p>
          ) : (
            filteredMeals.map((meal) => (
              <MealListItem
                key={meal.id}
                meal={meal}
                onToggleFavorite={() => {}}
                onClick={() => handleSelect(meal.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

