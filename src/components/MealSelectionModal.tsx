import { useState, useMemo } from 'react';
import { Meal } from '../types';
import { MealListItem } from './MealListItem';
import { fuzzySearch } from '../utils/searchUtils';
import { X } from 'lucide-react';
import './MealSelectionModal.css';

interface MealSelectionModalProps {
  meals: Meal[];
  onSelect: (mealId: string) => void;
  onClose: () => void;
}

export function MealSelectionModal({ meals, onSelect, onClose }: MealSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeals = useMemo(() => {
    if (!searchQuery.trim()) {
      return meals;
    }
    return meals.filter((meal) => fuzzySearch(searchQuery, meal.name));
  }, [meals, searchQuery]);

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

