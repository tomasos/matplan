import { useState } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { X } from 'lucide-react';
import './CreateHouseholdModal.css';

interface CreateHouseholdModalProps {
  onClose: () => void;
}

export function CreateHouseholdModal({ onClose }: CreateHouseholdModalProps) {
  const { createHousehold } = useHousehold();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vennligst skriv inn et navn for husholdningen');
      return;
    }

    try {
      setLoading(true);
      await createHousehold(name.trim());
      onClose();
    } catch (error: any) {
      console.error('Failed to create household:', error);
      setError(error.message || 'Kunne ikke opprette husholdning. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-display-semibold-20">Opprett husholdning</h2>
          <button onClick={onClose} className="modal-close" aria-label="Lukk">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="household-name" className="font-display-semibold-16">
              Navn på husholdning
            </label>
            <input
              id="household-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Hjemme, Familie, etc."
              className="form-input font-regular-16"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && <div className="form-error font-regular-14">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-button modal-button-secondary font-display-semibold-16"
              disabled={loading}
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="modal-button modal-button-primary font-display-semibold-16"
              disabled={loading}
            >
              {loading ? 'Oppretter...' : 'Opprett'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

