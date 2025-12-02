import { useState } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { CreateHouseholdModal } from './CreateHouseholdModal';
import './HouseholdSelector.css';

export function HouseholdSelector() {
  const { currentHousehold, households, switchHousehold, loading } = useHousehold();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  if (loading) {
    return (
      <div className="household-selector">
        <div className="household-selector-loading font-regular-16">Laster...</div>
      </div>
    );
  }

  if (!currentHousehold && households.length === 0) {
    return (
      <>
        <div className="household-selector">
          <button
            onClick={() => setShowCreateModal(true)}
            className="household-selector-create font-display-semibold-16"
          >
            Opprett husholdning
          </button>
        </div>
        {showCreateModal && <CreateHouseholdModal onClose={() => setShowCreateModal(false)} />}
      </>
    );
  }

  return (
    <div className="household-selector">
      <div className="household-selector-dropdown">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="household-selector-button font-display-semibold-16"
        >
          {currentHousehold?.name || 'Velg husholdning'}
          <span className="household-selector-arrow">{showDropdown ? '▲' : '▼'}</span>
        </button>

        {showDropdown && (
          <div className="household-selector-menu">
            {households.map((household) => (
              <button
                key={household.$id}
                onClick={() => {
                  switchHousehold(household.$id);
                  setShowDropdown(false);
                }}
                className={`household-selector-item font-regular-16 ${
                  currentHousehold?.$id === household.$id ? 'active' : ''
                }`}
              >
                {household.name}
              </button>
            ))}
            <button
              onClick={() => {
                setShowDropdown(false);
                setShowCreateModal(true);
              }}
              className="household-selector-item household-selector-item-create font-regular-16"
            >
              + Opprett ny husholdning
            </button>
          </div>
        )}
      </div>

      {showCreateModal && <CreateHouseholdModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}

