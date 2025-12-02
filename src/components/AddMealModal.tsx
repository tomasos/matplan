import { useState, useEffect } from 'react';
import { useMeals } from '../hooks/useMeals';
import { MealCategory, Ingredient } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { IngredientInput } from './IngredientInput';
import { X } from 'lucide-react';
import './AddMealModal.css';

interface AddMealModalProps {
  mealId?: string | null;
  onClose: () => void;
  onSave?: () => void;
}

export function AddMealModal({ mealId, onClose, onSave }: AddMealModalProps) {
  const { meals, addMeal, updateMeal, deleteMeal } = useMeals();
  
  const isEditing = !!mealId;
  const existingMeal = isEditing ? meals.find((m) => m.id === mealId) : null;

  const [category, setCategory] = useState<MealCategory>('vegetarian');
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [about, setAbout] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [weekendMeal, setWeekendMeal] = useState(false);

  useEffect(() => {
    if (existingMeal) {
      setCategory(existingMeal.category);
      setName(existingMeal.name);
      setLink(existingMeal.link || '');
      setAbout(existingMeal.about || '');
      setIngredients(existingMeal.ingredients || []);
      setWeekendMeal(existingMeal.weekendMeal ?? false);
    } else {
      // Reset form when creating new meal
      setCategory('vegetarian');
      setName('');
      setLink('');
      setAbout('');
      setIngredients([]);
      setWeekendMeal(false);
    }
  }, [existingMeal, mealId]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 0 }]);
  };

  const handleUpdateIngredient = (index: number, ingredient: Ingredient) => {
    const updated = [...ingredients];
    updated[index] = ingredient;
    setIngredients(updated);
  };

  const handleDeleteIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Navn er påkrevd');
      return;
    }

    const mealData = {
      category,
      name: name.trim(),
      link: link.trim() || undefined,
      about: about.trim() || undefined,
      ingredients: ingredients.filter((ing) => ing.name.trim() !== ''),
      weekendMeal,
    };

    if (isEditing && mealId) {
      updateMeal(mealId, mealData);
    } else {
      addMeal(mealData);
    }

    if (onSave) {
      onSave();
    }
    onClose();
  };

  const handleDelete = () => {
    if (isEditing && mealId && window.confirm('Er du sikker på at du vil slette denne retten?')) {
      deleteMeal(mealId);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-meal-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="add-meal-modal-header">
          <h2 className="font-display-semibold-20">{isEditing ? 'Rediger rett' : 'Ny rett'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="add-meal-modal-body">
          <div className="add-meal-section">
            <label className="add-meal-label font-display-bold-16">Kategori</label>
            <div className="category-buttons">
              <button
                onClick={() => setCategory('vegetarian')}
                className={`category-button ${category === 'vegetarian' ? 'active' : ''}`}
              >
                <CategoryIcon category="vegetarian" size={32} />
              </button>
              <button
                onClick={() => setCategory('fish')}
                className={`category-button ${category === 'fish' ? 'active' : ''}`}
              >
                <CategoryIcon category="fish" size={32} />
              </button>
              <button
                onClick={() => setCategory('meat')}
                className={`category-button ${category === 'meat' ? 'active' : ''}`}
              >
                <CategoryIcon category="meat" size={32} />
              </button>
            </div>
          </div>

          <div className="add-meal-section">
            <label className="add-meal-label font-display-bold-16">Navn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fiskekake"
              className="add-meal-input font-regular-16"
              required
            />
          </div>

          <div className="add-meal-section">
            <label className="add-meal-label font-display-bold-16">Link</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://vm.tiktok.com/ZNdx5eHgM/"
              className="add-meal-input font-regular-16"
            />
          </div>

          <div className="add-meal-section">
            <label className="add-meal-label font-display-bold-16">Om</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Fiskekakeoppskrifta til Maria i garden."
              className="add-meal-textarea font-regular-16"
              rows={4}
            />
          </div>

          <div className="add-meal-section">
            <label className="add-meal-checkbox-label">
              <input
                type="checkbox"
                checked={weekendMeal}
                onChange={(e) => setWeekendMeal(e.target.checked)}
                className="add-meal-checkbox"
              />
              <span className="font-display-semibold-16">Helgerett (kun for fredag, lørdag og søndag)</span>
            </label>
          </div>

          <div className="add-meal-section">
            <label className="add-meal-label font-display-bold-16">Ingredienser</label>
            {ingredients.map((ingredient, index) => (
              <IngredientInput
                key={index}
                ingredient={ingredient}
                onUpdate={(updated) => handleUpdateIngredient(index, updated)}
                onDelete={() => handleDeleteIngredient(index)}
              />
            ))}
            <button onClick={handleAddIngredient} className="add-ingredient-button font-regular-16">
              + Legg til ingrediens
            </button>
          </div>

          <div className="add-meal-actions">
            <button onClick={handleSave} className="save-button font-display-semibold-16">
              Lagre
            </button>
            {isEditing && (
              <>
                <button onClick={handleDelete} className="delete-button font-display-semibold-16">
                  Slett
                </button>
                <button onClick={onClose} className="cancel-button font-display-semibold-16">
                   Avbryt
                 </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

