import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeals } from '../hooks/useMeals';
import { MealCategory } from '../types';
import { fuzzySearch } from '../utils/searchUtils';
import { MealListItem } from '../components/MealListItem';
import { BottomNav } from '../components/BottomNav';
import { Carrot, Fish, Beef, Heart } from 'lucide-react';
import './MealList.css';

export function MealList() {
  const navigate = useNavigate();
  const { meals, toggleFavorite } = useMeals();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<MealCategory>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);

  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      // Category filter
      if (selectedCategories.size > 0 && !selectedCategories.has(meal.category)) {
        return false;
      }

      // Favorites filter
      if (showFavorites && !meal.favorite) {
        return false;
      }

      // Search filter
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

  const toggleFavorites = () => {
    setShowFavorites((prev) => !prev);
  };

  const handleMealClick = (mealId: string) => {
    navigate(`/add-meal?edit=${mealId}`);
  };

  return (
    <div className="meal-list">
      <div className="meal-list-filters">
        <button
          onClick={() => toggleCategory('vegetarian')}
          className={`filter-button ${selectedCategories.has('vegetarian') ? 'active' : ''}`}
          aria-label="Vegetarian filter"
        >
          <Carrot size={24} />
        </button>
        <button
          onClick={() => toggleCategory('fish')}
          className={`filter-button ${selectedCategories.has('fish') ? 'active' : ''}`}
          aria-label="Fish filter"
        >
          <Fish size={24} />
        </button>
        <button
          onClick={() => toggleCategory('meat')}
          className={`filter-button ${selectedCategories.has('meat') ? 'active' : ''}`}
          aria-label="Meat filter"
        >
          <Beef size={24} />
        </button>
        <button
          onClick={toggleFavorites}
          className={`filter-button ${showFavorites ? 'active' : ''}`}
          aria-label="Favorites filter"
        >
          <Heart size={24} fill={showFavorites ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="meal-list-search">
        <input
          type="text"
          placeholder="Søk"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input font-regular-16"
        />
      </div>

      <div className="meal-list-content">
        {filteredMeals.length === 0 ? (
          <p className="meal-list-empty font-regular-16">Ingen retter funnet</p>
        ) : (
          filteredMeals.map((meal) => (
            <MealListItem
              key={meal.id}
              meal={meal}
              onToggleFavorite={() => toggleFavorite(meal.id)}
              onClick={() => handleMealClick(meal.id)}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}

