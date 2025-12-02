import { Ingredient } from '../types';
import { Minus, Plus, X } from 'lucide-react';
import './IngredientInput.css';

interface IngredientInputProps {
  ingredient: Ingredient;
  onUpdate: (ingredient: Ingredient) => void;
  onDelete: () => void;
}

export function IngredientInput({ ingredient, onUpdate, onDelete }: IngredientInputProps) {
  const handleIncrement = () => {
    onUpdate({ ...ingredient, quantity: ingredient.quantity + 1 });
  };

  const handleDecrement = () => {
    if (ingredient.quantity > 0) {
      onUpdate({ ...ingredient, quantity: ingredient.quantity - 1 });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...ingredient, name: e.target.value });
  };

  return (
    <div className="ingredient-input">
      <input
        type="text"
        value={ingredient.name}
        onChange={handleNameChange}
        placeholder="Ingrediensnavn"
        className="ingredient-name font-regular-16"
        autoFocus
      />
      <div className="ingredient-quantity">
        <button onClick={handleDecrement} className="quantity-button" aria-label="Decrease">
          <Minus size={16} />
        </button>
        <span className="quantity-value font-light-16">{ingredient.quantity}</span>
        <button onClick={handleIncrement} className="quantity-button" aria-label="Increase">
          <Plus size={16} />
        </button>
      </div>
      <button onClick={onDelete} className="ingredient-delete" aria-label="Delete ingredient">
        <X size={20} />
      </button>
    </div>
  );
}

