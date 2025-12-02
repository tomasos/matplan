import { MealCategory } from '../types';
import { Carrot, Fish, Beef } from 'lucide-react';
import './CategoryIcon.css';

interface CategoryIconProps {
  category: MealCategory;
  size?: number;
  filled?: boolean;
}

export function CategoryIcon({ category, size = 24, filled = false }: CategoryIconProps) {
  const className = `category-icon ${category} ${filled ? 'filled' : ''}`;
  
  if (category === 'vegetarian') {
    return <Carrot className={className} size={size} />;
  }
  
  if (category === 'fish') {
    return <Fish className={className} size={size} />;
  }
  
  // meat
  return <Beef className={className} size={size} />;
}

