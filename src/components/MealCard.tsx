import { DayOfWeek } from '../types';
import { CategoryIcon } from './CategoryIcon';
import './MealCard.css';

interface MealCardProps {
  day: DayOfWeek;
  mealName?: string;
  category?: 'meat' | 'fish' | 'vegetarian';
  onClick: () => void;
}

const DAY_LETTERS: Record<DayOfWeek, string> = {
  Monday: 'M',
  Tuesday: 'T',
  Wednesday: 'O',
  Thursday: 'T',
  Friday: 'F',
  Saturday: 'L',
  Sunday: 'S',
};

export function MealCard({ day, mealName, category, onClick }: MealCardProps) {
  return (
    <button className="meal-card" onClick={onClick}>
      {category && (
        <div className="meal-card-icon">
          <CategoryIcon category={category} size={32} />
        </div>
      )}
      {mealName && <div className="meal-card-name font-display-semibold-16">{mealName}</div>}
      <div className="meal-card-day font-display-bold-16">{DAY_LETTERS[day]}</div>
    </button>
  );
}

