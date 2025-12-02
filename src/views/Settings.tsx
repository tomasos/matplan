import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useAuth } from '../contexts/AuthContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { MealCategory, Household } from '../types';
import { BottomNav } from '../components/BottomNav';
import { ShareHouseholdModal } from '../components/ShareHouseholdModal';
import { MigrationModal } from '../components/MigrationModal';
import { HouseholdSelector } from '../components/HouseholdSelector';
import { databases, DATABASE_ID, COLLECTIONS, DEV_MODE } from '../config/appwrite';
import './Settings.css';

const CATEGORY_LABELS: Record<MealCategory, string> = {
  meat: 'Kjøtt',
  fish: 'Fisk',
  vegetarian: 'Vegetar',
};

interface SettingsProps {
  onClose?: () => void;
}

export function Settings({ onClose }: SettingsProps = {} as SettingsProps) {
  const { categoryWeightings, updateCategoryWeighting, resetWeightings } = useSettings();
  const { currentHousehold, invitations, acceptInvitation, loadInvitations } = useHousehold();
  const { user, logout } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [householdNames, setHouseholdNames] = useState<Record<string, string>>({});
  const [loadingHouseholdNames, setLoadingHouseholdNames] = useState(false);
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const handleWeightingChange = async (category: MealCategory, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      await updateCategoryWeighting(category, numValue);
    }
  };

  const handleResetWeightings = async () => {
    await resetWeightings();
  };

  const fetchHouseholdName = useCallback(async (householdId: string) => {
    if (DEV_MODE || !databases) return null;

    try {
      const household = (await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.HOUSEHOLDS,
        householdId
      )) as unknown as Household;
      return household.name;
    } catch (error) {
      console.error(`Failed to fetch household ${householdId}:`, error);
      return null;
    }
  }, []);

  const loadHouseholdNames = useCallback(async () => {
    if (invitations.length === 0) {
      setHouseholdNames({});
      return;
    }

    setLoadingHouseholdNames(true);
    const names: Record<string, string> = {};
    
    await Promise.all(
      invitations.map(async (invitation) => {
        const name = await fetchHouseholdName(invitation.householdId);
        if (name) {
          names[invitation.householdId] = name;
        }
      })
    );

    setHouseholdNames(names);
    setLoadingHouseholdNames(false);
  }, [invitations, fetchHouseholdName]);

  useEffect(() => {
    loadHouseholdNames();
  }, [loadHouseholdNames]);

  const handleAcceptInvitation = async (invitationId: string) => {
    setAcceptError(null);
    setAcceptingInvitationId(invitationId);

    try {
      await acceptInvitation(invitationId);
      await loadInvitations();
      await loadHouseholdNames();
      setAcceptError(null); // Clear error on success
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      setAcceptError(error.message || 'Kunne ikke akseptere invitasjon. Prøv igjen.');
    } finally {
      setAcceptingInvitationId(null);
    }
  };

  useEffect(() => {
    // Clear error when invitations change (e.g., after successful acceptance)
    setAcceptError(null);
  }, [invitations.length]);

  const totalWeight = categoryWeightings.meat + categoryWeightings.fish + categoryWeightings.vegetarian;
  const normalizedWeights = totalWeight > 0
    ? {
        meat: ((categoryWeightings.meat / totalWeight) * 100).toFixed(1),
        fish: ((categoryWeightings.fish / totalWeight) * 100).toFixed(1),
        vegetarian: ((categoryWeightings.vegetarian / totalWeight) * 100).toFixed(1),
      }
    : { meat: '0.0', fish: '0.0', vegetarian: '0.0' };

  return (
    <div className="settings">
      <h1 className="font-display-bold-24">Innstillinger</h1>

      <div className="settings-section">
        <h2 className="font-display-semibold-20">Husholdning</h2>
        <p className="font-regular-16 settings-description">
          Administrer husholdningen din og del den med andre.
        </p>

        <div className="household-settings">
          <div className="household-selector-wrapper">
            <HouseholdSelector />
          </div>

          {currentHousehold && (
            <div className="household-info">
              <div className="household-name-display font-display-semibold-16">
                {currentHousehold.name}
              </div>
              <button
                onClick={() => setShowShareModal(true)}
                className="share-household-button font-display-semibold-16"
              >
                Del husholdning
              </button>
            </div>
          )}

          <div className="invitations-section">
            <h3 className="font-display-semibold-16">Invitasjoner</h3>
            {loadingHouseholdNames && invitations.length > 0 ? (
              <div className="invitations-loading font-regular-16">Laster...</div>
            ) : invitations.length === 0 ? (
              <div className="invitations-empty font-regular-16">
                Ingen invitasjoner
              </div>
            ) : (
              <div className="invitations-list">
                {invitations.map((invitation) => (
                  <div key={invitation.$id} className="invitation-item">
                    <div className="invitation-info">
                      <span className="invitation-household-name font-display-semibold-16">
                        {householdNames[invitation.householdId] || 'Laster...'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAcceptInvitation(invitation.$id)}
                      className="accept-invitation-button font-display-semibold-16"
                      disabled={acceptingInvitationId === invitation.$id || !householdNames[invitation.householdId]}
                    >
                      {acceptingInvitationId === invitation.$id ? 'Aksepterer...' : 'Aksepter'}
                    </button>
                  </div>
                ))}
                {acceptError && (
                  <div className="invitation-error font-regular-14">{acceptError}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="font-display-semibold-20">Kategori-vekter for smart planlegging</h2>
        <p className="font-regular-16 settings-description">
          Angi hvor mange måltider av hver kategori smart planlegging skal prioritere når den genererer en ukesplan.
          Høyere vekt betyr flere måltider av den kategorien.
        </p>

        <div className="weightings-container">
          {(['meat', 'fish', 'vegetarian'] as MealCategory[]).map((category) => (
            <div key={category} className="weighting-item">
              <div className="weighting-header">
                <CategoryIcon category={category} size={24} />
                <span className="font-display-semibold-16">{CATEGORY_LABELS[category]}</span>
              </div>
              <div className="weighting-controls">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={categoryWeightings[category]}
                  onChange={(e) => handleWeightingChange(category, e.target.value)}
                  className="weighting-input font-regular-16"
                />
                <span className="weighting-percentage font-light-16">
                  ({normalizedWeights[category]}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleResetWeightings} className="reset-button font-display-semibold-16">
          Tilbakestill til standard
        </button>
      </div>

      <div className="settings-section">
        <h2 className="font-display-semibold-20">Konto</h2>
        <div className="account-info">
          <p className="font-regular-16">Innlogget som: {user?.email}</p>
          <button onClick={logout} className="logout-button font-display-semibold-16">
            Logg ut
          </button>
        </div>
      </div>

      {showShareModal && <ShareHouseholdModal onClose={() => setShowShareModal(false)} />}
      {showMigrationModal && <MigrationModal onClose={() => setShowMigrationModal(false)} />}

      {!onClose && <BottomNav />}
    </div>
  );
}

