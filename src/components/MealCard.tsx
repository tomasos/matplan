import { useRef, useState, useEffect } from 'react';
import { DayOfWeek } from '../types';
import { CategoryIcon } from './CategoryIcon';
import './MealCard.css';

interface MealCardProps {
  day: DayOfWeek;
  mealName?: string;
  category?: 'meat' | 'fish' | 'vegetarian';
  onClick: () => void;
  onLongPress?: () => void;
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

const LONG_PRESS_DURATION = 500; // milliseconds

export function MealCard({ day, mealName, category, onClick, onLongPress }: MealCardProps) {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const startLongPress = () => {
    if (!onLongPress || !mealName) return; // Only allow long press if there's a meal to remove
    
    setIsPressing(true);
    setIsLongPress(false);
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
      onLongPress();
      setIsPressing(false);
    }, LONG_PRESS_DURATION);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressing(false);
  };

  const handleClick = () => {
    if (!isLongPress) {
      onClick();
    }
    setIsLongPress(false);
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <button
      className={`meal-card ${isPressing ? 'meal-card-pressing' : ''}`}
      onClick={handleClick}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchCancel={cancelLongPress}
    >
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

