import { useState } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { useMeals } from '../contexts/MealsContext';
import { useWeekPlan } from '../contexts/WeekPlanContext';
import { useSettings } from '../contexts/SettingsContext';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { loadLocalStorageData, clearLocalStorageData } from '../utils/migration';
import { X } from 'lucide-react';
import './MigrationModal.css';

interface MigrationModalProps {
  onClose: () => void;
}

export function MigrationModal({ onClose }: MigrationModalProps) {
  const { currentHousehold } = useHousehold();
  const { addMeal } = useMeals();
  const { setMealForDay } = useWeekPlan();
  const { updateCategoryWeighting } = useSettings();
  const { syncItemsFromWeekPlan, addCustomItem } = useShoppingList();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMigrate = async () => {
    if (!currentHousehold) {
      setError('Ingen husholdning valgt');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = loadLocalStorageData();

      // Migrate meals
      for (const meal of data.meals) {
        try {
          await addMeal({
            name: meal.name,
            category: meal.category,
            link: meal.link,
            about: meal.about,
            ingredients: meal.ingredients,
            weekendMeal: meal.weekendMeal ?? false,
          });
        } catch (err) {
          console.error('Failed to migrate meal:', meal.name, err);
        }
      }

      // Migrate week plans
      for (const [dayKey, mealId] of Object.entries(data.weekPlans)) {
        if (mealId) {
          try {
            await setMealForDay(dayKey, mealId);
          } catch (err) {
            console.error('Failed to migrate week plan entry:', dayKey, err);
          }
        }
      }

      // Migrate category weightings
      await updateCategoryWeighting('meat', data.categoryWeightings.meat);
      await updateCategoryWeighting('fish', data.categoryWeightings.fish);
      await updateCategoryWeighting('vegetarian', data.categoryWeightings.vegetarian);

      // Migrate shopping lists
      for (const [weekKey, shoppingData] of Object.entries(data.shoppingLists)) {
        try {
          // Add custom items
          for (const item of shoppingData.items.filter((i) => i.isCustom)) {
            await addCustomItem(weekKey, item.name);
          }
          // Sync ingredient items
          const ingredientItems = shoppingData.items.filter((i) => !i.isCustom);
          await syncItemsFromWeekPlan(
            weekKey,
            ingredientItems.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              isCustom: false,
            }))
          );
        } catch (err) {
          console.error('Failed to migrate shopping list:', weekKey, err);
        }
      }

      // Clear local storage
      clearLocalStorageData();

      onClose();
    } catch (err: any) {
      console.error('Migration failed:', err);
      setError(err.message || 'Kunne ikke migrere data. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    clearLocalStorageData();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleSkip}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-display-semibold-20">Migrer eksisterende data</h2>
          <button onClick={handleSkip} className="modal-close" aria-label="Lukk">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <p className="font-regular-16 migration-description">
            Vi fant eksisterende data i nettleseren din. Vil du migrere denne dataen til din nye husholdning?
          </p>

          {error && <div className="form-error font-regular-14">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleSkip}
              className="modal-button modal-button-secondary font-display-semibold-16"
              disabled={loading}
            >
              Hopp over
            </button>
            <button
              type="button"
              onClick={handleMigrate}
              className="modal-button modal-button-primary font-display-semibold-16"
              disabled={loading}
            >
              {loading ? 'Migrerer...' : 'Migrer data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

