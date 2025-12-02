import { Meal } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { Heart } from 'lucide-react';
import './MealListItem.css';

interface MealListItemProps {
  meal: Meal;
  onToggleFavorite: () => void;
  onClick?: () => void;
}

export function MealListItem({ meal, onToggleFavorite, onClick }: MealListItemProps) {
  return (
    <div className="meal-list-item" onClick={onClick}>
      <CategoryIcon category={meal.category} size={24} />
      <span className="meal-list-item-name font-regular-16">{meal.name}</span>
      <button
        className="meal-list-item-favorite"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        aria-label={meal.favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart size={24} fill={meal.favorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

