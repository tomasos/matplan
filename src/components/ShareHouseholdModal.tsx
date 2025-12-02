import { useState, useEffect } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { useAuth } from '../contexts/AuthContext';
import { databases, DATABASE_ID, COLLECTIONS } from '../config/appwrite';
import { Query } from 'appwrite';
import { HouseholdInvitation } from '../types';
import { X, Mail } from 'lucide-react';
import './ShareHouseholdModal.css';

interface ShareHouseholdModalProps {
  onClose: () => void;
}

export function ShareHouseholdModal({ onClose }: ShareHouseholdModalProps) {
  const { currentHousehold, shareHousehold, loadInvitations, acceptInvitation } = useHousehold();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingInvitations, setPendingInvitations] = useState<HouseholdInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  useEffect(() => {
    loadPendingInvitations();
  }, [currentHousehold]);

  const loadPendingInvitations = async () => {
    if (!currentHousehold) return;

    try {
      setLoadingInvitations(true);
      const response = await databases.listDocuments<HouseholdInvitation>(
        DATABASE_ID,
        COLLECTIONS.HOUSEHOLD_INVITATIONS,
        [
          Query.equal('householdId', currentHousehold.$id),
          Query.equal('status', 'pending'),
        ]
      );
      setPendingInvitations(response.documents);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Vennligst skriv inn en e-postadresse');
      return;
    }

    if (email.toLowerCase().trim() === user?.email?.toLowerCase()) {
      setError('Du kan ikke invitere deg selv');
      return;
    }

    try {
      setLoading(true);
      await shareHousehold(email.trim());
      setEmail('');
      await loadPendingInvitations();
    } catch (error: any) {
      console.error('Failed to share household:', error);
      setError(error.message || 'Kunne ikke sende invitasjon. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      await loadPendingInvitations();
      onClose();
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      setError(error.message || 'Kunne ikke akseptere invitasjon.');
    }
  };

  if (!currentHousehold) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-display-semibold-20">Del husholdning</h2>
          <button onClick={onClose} className="modal-close" aria-label="Lukk">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="share-section">
            <h3 className="font-display-semibold-16">Send invitasjon</h3>
            <form onSubmit={handleSubmit} className="share-form">
              <div className="form-group">
                <label htmlFor="invite-email" className="font-regular-16">
                  E-postadresse
                </label>
                <div className="input-with-button">
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="person@example.com"
                    className="form-input font-regular-16"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="invite-button font-display-semibold-16"
                    disabled={loading || !email.trim()}
                  >
                    <Mail size={16} />
                    Send
                  </button>
                </div>
              </div>

              {error && <div className="form-error font-regular-14">{error}</div>}
            </form>
          </div>

          <div className="invitations-section">
            <h3 className="font-display-semibold-16">Ventende invitasjoner</h3>
            {loadingInvitations ? (
              <div className="invitations-loading font-regular-16">Laster...</div>
            ) : pendingInvitations.length === 0 ? (
              <div className="invitations-empty font-regular-16">
                Ingen ventende invitasjoner
              </div>
            ) : (
              <div className="invitations-list">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation.$id} className="invitation-item">
                    <span className="invitation-email font-regular-16">{invitation.email}</span>
                    <span className="invitation-status font-light-16">
                      {invitation.status === 'pending' ? 'Venter' : invitation.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="household-members-section">
            <h3 className="font-display-semibold-16">Medlemmer</h3>
            <div className="members-list">
              {currentHousehold.memberIds.map((memberId) => (
                <div key={memberId} className="member-item">
                  <span className="member-id font-regular-16">
                    {memberId === currentHousehold.ownerId ? 'Eier' : 'Medlem'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

