import { useState, useEffect, useMemo } from 'react';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useWeekPlan } from '../contexts/WeekPlanContext';
import { useMeals } from '../hooks/useMeals';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { getDayKey } from '../utils/weekUtils';
import { WeekSelector } from '../components/WeekSelector';
import { BottomNav } from '../components/BottomNav';
import { Check, Plus, X } from 'lucide-react';
import './ShoppingList.css';

export function ShoppingList() {
  const { year, week, weekInfo, goToPreviousWeek, goToNextWeek } = useWeekNavigation();
  const { weekPlans } = useWeekPlan();
  const { meals } = useMeals();
  const {
    getShoppingList,
    getCustomItemHistory,
    ensureShoppingListLoaded,
    toggleItemChecked,
    addCustomItem,
    removeItem,
    syncItemsFromWeekPlan,
  } = useShoppingList();
  const { removeFromCustomItemHistory } = useHousehold();

  const weekKey = `${year}-W${week}`;
  const [newItemName, setNewItemName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  // Calculate ingredients from week plan
  const ingredientsFromWeekPlan = useMemo(() => {
    const ingredientMap = new Map<string, number>();

    weekInfo.days.forEach((dayInfo) => {
      const dayKey = getDayKey(year, week, dayInfo.day);
      const mealId = weekPlans[dayKey];
      if (mealId) {
        const meal = meals.find((m) => m.id === mealId);
        if (meal) {
          meal.ingredients.forEach((ingredient) => {
            const current = ingredientMap.get(ingredient.name) || 0;
            ingredientMap.set(ingredient.name, current + ingredient.quantity);
          });
        }
      }
    });

    return Array.from(ingredientMap.entries()).map(([name, quantity]) => ({
      name,
      quantity,
      isCustom: false,
    }));
  }, [weekInfo, weekPlans, meals, year, week]);

  // Ensure shopping list is loaded when weekKey changes
  useEffect(() => {
    ensureShoppingListLoaded(weekKey).catch((error) => {
      console.error('Failed to load shopping list:', error);
    });
  }, [weekKey, ensureShoppingListLoaded]);

  // Sync ingredients from week plan to shopping list
  useEffect(() => {
    syncItemsFromWeekPlan(weekKey, ingredientsFromWeekPlan).catch((error) => {
      console.error('Failed to sync items from week plan:', error);
    });
  }, [weekKey, ingredientsFromWeekPlan, syncItemsFromWeekPlan]);

  const allItems = getShoppingList(weekKey);
  const uncheckedItems = allItems.filter((item) => !item.checked);
  const checkedItems = allItems.filter((item) => item.checked);
  const customItemHistory = getCustomItemHistory();

  const handleItemClick = async (itemId: string) => {
    try {
      await toggleItemChecked(weekKey, itemId);
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const handleAddItem = async () => {
    if (newItemName.trim()) {
      try {
        await addCustomItem(weekKey, newItemName);
        setNewItemName('');
        setShowAddInput(false);
      } catch (error) {
        console.error('Failed to add item:', error);
      }
    }
  };

  const handleQuickAdd = async (itemName: string) => {
    try {
      await addCustomItem(weekKey, itemName);
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleRemoveItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    try {
      await removeItem(weekKey, itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleRemoveFromHistory = async (e: React.MouseEvent, itemName: string) => {
    e.stopPropagation();
    try {
      await removeFromCustomItemHistory(itemName);
    } catch (error) {
      console.error('Failed to remove item from history:', error);
    }
  };

  return (
    <div className="shopping-list">
      <WeekSelector week={week} onPrevious={goToPreviousWeek} onNext={goToNextWeek} />

      {/* Unchecked items grid */}
      {uncheckedItems.length > 0 && (
        <div className="shopping-list-section">
          <h2 className="shopping-list-section-title font-display-semibold-20">Handleliste</h2>
          <div className="shopping-list-grid">
            {uncheckedItems.map((item) => (
              <button
                key={item.id}
                className="shopping-list-item"
                onClick={() => handleItemClick(item.id)}
              >
                <div className="shopping-list-item-content">
                  <span className="shopping-list-item-name font-display-semibold-16">
                    {item.name}
                  </span>
                  {item.quantity !== undefined && (
                    <span className="shopping-list-item-quantity font-regular-16">
                      {item.quantity}
                    </span>
                  )}
                </div>
                {item.isCustom && (
                  <button
                    className="shopping-list-item-remove"
                    onClick={(e) => handleRemoveItem(e, item.id)}
                    aria-label="Remove item"
                  >
                    <X size={16} />
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add item section */}
      <div className="shopping-list-add-section">
        {!showAddInput ? (
          <button
            className="shopping-list-add-button"
            onClick={() => setShowAddInput(true)}
          >
            <Plus size={20} />
            <span className="font-display-semibold-16">Legg til vare</span>
          </button>
        ) : (
          <div className="shopping-list-add-input-container">
            <input
              type="text"
              placeholder="Varenavn"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                } else if (e.key === 'Escape') {
                  setShowAddInput(false);
                  setNewItemName('');
                }
              }}
              className="shopping-list-add-input font-regular-16"
              autoFocus
            />
            <div className="shopping-list-add-actions">
              <button
                className="shopping-list-add-submit"
                onClick={handleAddItem}
                aria-label="Add item"
              >
                <Plus size={20} />
              </button>
              <button
                className="shopping-list-add-cancel"
                onClick={() => {
                  setShowAddInput(false);
                  setNewItemName('');
                }}
                aria-label="Cancel"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Quick-add suggestions */}
        {customItemHistory.length > 0 && !showAddInput && (
          <div className="shopping-list-quick-add">
            {customItemHistory.slice(0, 5).map((itemName) => (
              <div key={itemName} className="shopping-list-quick-add-item-wrapper">
                <button
                  className="shopping-list-quick-add-item font-regular-16"
                  onClick={() => handleQuickAdd(itemName)}
                >
                  {itemName}
                </button>
                <button
                  className="shopping-list-quick-add-remove"
                  onClick={(e) => handleRemoveFromHistory(e, itemName)}
                  aria-label="Remove from history"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checked items section */}
      {checkedItems.length > 0 && (
        <div className="shopping-list-section">
          <h2 className="shopping-list-section-title font-display-semibold-20">Krysset av</h2>
          <div className="shopping-list-grid">
            {checkedItems.map((item) => (
              <button
                key={item.id}
                className="shopping-list-item checked"
                onClick={() => handleItemClick(item.id)}
              >
                <div className="shopping-list-item-content">
                  <span className="shopping-list-item-name font-display-semibold-16">
                    {item.name}
                  </span>
                  {item.quantity !== undefined && (
                    <span className="shopping-list-item-quantity font-regular-16">
                      {item.quantity}
                    </span>
                  )}
                </div>
                <Check size={20} className="shopping-list-item-check" />
                {item.isCustom && (
                  <button
                    className="shopping-list-item-remove"
                    onClick={(e) => handleRemoveItem(e, item.id)}
                    aria-label="Remove item"
                  >
                    <X size={16} />
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {uncheckedItems.length === 0 && checkedItems.length === 0 && (
        <div className="shopping-list-empty">
          <p className="font-regular-16">Ingen varer i handlelisten for denne uken</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

