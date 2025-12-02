import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { databases, DATABASE_ID, COLLECTIONS, DEV_MODE } from '../config/appwrite';
import { Household, HouseholdInvitation } from '../types';
import { Query } from 'appwrite';

interface HouseholdContextType {
  currentHousehold: Household | null;
  households: Household[];
  invitations: HouseholdInvitation[];
  loading: boolean;
  createHousehold: (name: string) => Promise<string>;
  joinHousehold: (householdId: string) => Promise<void>;
  switchHousehold: (householdId: string) => void;
  shareHousehold: (email: string) => Promise<void>;
  loadHouseholds: () => Promise<void>;
  loadInvitations: () => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  getCustomItemHistory: () => string[];
  addToCustomItemHistory: (itemName: string) => Promise<void>;
  removeFromCustomItemHistory: (itemName: string) => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

const CURRENT_HOUSEHOLD_KEY = 'currentHouseholdId';

// Mock household for dev mode
const MOCK_HOUSEHOLD: Household = {
  $id: 'dev-household-123',
  name: 'Dev Household',
  ownerId: 'dev-user-123',
  memberIds: ['dev-user-123'],
  createdAt: new Date().toISOString(),
  customItemHistory: [],
};

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHouseholds = useCallback(async () => {
    if (!user) {
      setHouseholds([]);
      setCurrentHousehold(null);
      setLoading(false);
      return;
    }

    if (DEV_MODE) {
      // In dev mode, use mock household
      const mockHousehold = MOCK_HOUSEHOLD;
      setHouseholds([mockHousehold]);
      setCurrentHousehold(mockHousehold);
      localStorage.setItem(CURRENT_HOUSEHOLD_KEY, mockHousehold.$id);
      setLoading(false);
      return;
    }

    try {
      // Find households where user is owner or member
      const ownerHouseholds = (await databases!.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HOUSEHOLDS,
        [Query.equal('ownerId', user.$id)]
      )) as unknown as { documents: Household[] };

      const memberHouseholds = (await databases!.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HOUSEHOLDS,
        [Query.contains('memberIds', [user.$id])]
      )) as unknown as { documents: Household[] };

      // Combine and deduplicate
      const allHouseholds = [
        ...ownerHouseholds.documents,
        ...memberHouseholds.documents.filter(
          (h) => !ownerHouseholds.documents.find((oh) => oh.$id === h.$id)
        ),
      ];

      setHouseholds(allHouseholds);

      // Restore current household from localStorage or use first one
      const savedHouseholdId = localStorage.getItem(CURRENT_HOUSEHOLD_KEY);
      const savedHousehold = allHouseholds.find((h) => h.$id === savedHouseholdId);
      
      if (savedHousehold) {
        setCurrentHousehold(savedHousehold);
      } else if (allHouseholds.length > 0) {
        setCurrentHousehold(allHouseholds[0]);
        localStorage.setItem(CURRENT_HOUSEHOLD_KEY, allHouseholds[0].$id);
      } else {
        setCurrentHousehold(null);
        localStorage.removeItem(CURRENT_HOUSEHOLD_KEY);
      }
    } catch (error: any) {
      console.error('Failed to load households:', error);
      // Provide more helpful error message for database not found
      if (error?.message?.includes('Database not found') || error?.code === 404) {
        console.error(
          `Database '${DATABASE_ID}' not found in Appwrite. Please create a database with ID '${DATABASE_ID}' in your Appwrite project.`
        );
      }
      setHouseholds([]);
      setCurrentHousehold(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadInvitations = useCallback(async () => {
    if (!user) {
      setInvitations([]);
      return;
    }

    if (DEV_MODE) {
      // In dev mode, no invitations
      setInvitations([]);
      return;
    }

    try {
      // Load invitations for user's email
      const userInvitations = (await databases!.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HOUSEHOLD_INVITATIONS,
        [
          Query.equal('email', user.email),
          Query.equal('status', 'pending'),
        ]
      )) as unknown as { documents: HouseholdInvitation[] };
      setInvitations(userInvitations.documents);
    } catch (error) {
      console.error('Failed to load invitations:', error);
      setInvitations([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadHouseholds();
      loadInvitations();
    } else {
      setHouseholds([]);
      setCurrentHousehold(null);
      setInvitations([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createHousehold = useCallback(
    async (name: string): Promise<string> => {
      if (!user) throw new Error('User must be logged in');

      if (DEV_MODE) {
        // In dev mode, just update the mock household name
        const newHousehold: Household = {
          ...MOCK_HOUSEHOLD,
          name,
        };
        setHouseholds([newHousehold]);
        setCurrentHousehold(newHousehold);
        localStorage.setItem(CURRENT_HOUSEHOLD_KEY, newHousehold.$id);
        return newHousehold.$id;
      }

      try {
        const household = (await databases!.createDocument(
          DATABASE_ID,
          COLLECTIONS.HOUSEHOLDS,
          'unique()',
          {
            name,
            ownerId: user.$id,
            memberIds: [user.$id],
          } as any
        )) as unknown as Household;

        await loadHouseholds();
        setCurrentHousehold(household);
        localStorage.setItem(CURRENT_HOUSEHOLD_KEY, household.$id);
        return household.$id;
      } catch (error) {
        console.error('Failed to create household:', error);
        throw error;
      }
    },
    [user, loadHouseholds]
  );

  const joinHousehold = useCallback(
    async (householdId: string) => {
      if (!user) throw new Error('User must be logged in');

      if (DEV_MODE) {
        // In dev mode, just switch to the mock household
        setCurrentHousehold(MOCK_HOUSEHOLD);
        localStorage.setItem(CURRENT_HOUSEHOLD_KEY, MOCK_HOUSEHOLD.$id);
        return;
      }

      try {
        const household = (await databases!.getDocument(
          DATABASE_ID,
          COLLECTIONS.HOUSEHOLDS,
          householdId
        )) as unknown as Household;

        if (!household.memberIds.includes(user.$id)) {
          await databases!.updateDocument(
            DATABASE_ID,
            COLLECTIONS.HOUSEHOLDS,
            householdId,
            {
              memberIds: [...household.memberIds, user.$id],
            }
          );
        }

        await loadHouseholds();
        setCurrentHousehold(household);
        localStorage.setItem(CURRENT_HOUSEHOLD_KEY, householdId);
      } catch (error) {
        console.error('Failed to join household:', error);
        throw error;
      }
    },
    [user, loadHouseholds]
  );

  const switchHousehold = useCallback((householdId: string) => {
    const household = households.find((h) => h.$id === householdId);
    if (household) {
      setCurrentHousehold(household);
      localStorage.setItem(CURRENT_HOUSEHOLD_KEY, householdId);
    }
  }, [households]);

  const shareHousehold = useCallback(
    async (email: string) => {
      if (!user || !currentHousehold) throw new Error('User must be logged in and have a household');

      if (DEV_MODE) {
        // In dev mode, just log the action
        console.log('Dev mode: Would share household with', email);
        return;
      }

      try {
        await databases!.createDocument(
          DATABASE_ID,
          COLLECTIONS.HOUSEHOLD_INVITATIONS,
          'unique()',
          {
            householdId: currentHousehold.$id,
            email: email.toLowerCase().trim(),
            inviterId: user.$id,
            status: 'pending',
          } as any
        ) as unknown as HouseholdInvitation;

        await loadInvitations();
      } catch (error) {
        console.error('Failed to share household:', error);
        throw error;
      }
    },
    [user, currentHousehold, loadInvitations]
  );

  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      if (!user) throw new Error('User must be logged in');

      if (DEV_MODE) {
        // In dev mode, just join the mock household
        await joinHousehold(MOCK_HOUSEHOLD.$id);
        return;
      }

      try {
        const invitation = (await databases!.getDocument(
          DATABASE_ID,
          COLLECTIONS.HOUSEHOLD_INVITATIONS,
          invitationId
        )) as unknown as HouseholdInvitation;

        if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
          throw new Error('Invitation email does not match user email');
        }

        // Update invitation status
        await databases!.updateDocument(
          DATABASE_ID,
          COLLECTIONS.HOUSEHOLD_INVITATIONS,
          invitationId,
          {
            status: 'accepted',
          }
        );

        // Join the household
        await joinHousehold(invitation.householdId);

        // Reload invitations
        await loadInvitations();
      } catch (error) {
        console.error('Failed to accept invitation:', error);
        throw error;
      }
    },
    [user, joinHousehold, loadInvitations]
  );

  const getCustomItemHistory = useCallback((): string[] => {
    return currentHousehold?.customItemHistory || [];
  }, [currentHousehold]);

  const updateHouseholdHistory = useCallback(
    async (newHistory: string[]) => {
      if (!currentHousehold) return;

      if (DEV_MODE) {
        // In dev mode, just update local state
        const updatedHousehold: Household = {
          ...currentHousehold,
          customItemHistory: newHistory,
        };
        setCurrentHousehold(updatedHousehold);
        setHouseholds((prev) =>
          prev.map((h) => (h.$id === updatedHousehold.$id ? updatedHousehold : h))
        );
        return;
      }

      try {
        await databases!.updateDocument(
          DATABASE_ID,
          COLLECTIONS.HOUSEHOLDS,
          currentHousehold.$id,
          {
            customItemHistory: newHistory,
          }
        );

        // Update local state
        const updatedHousehold: Household = {
          ...currentHousehold,
          customItemHistory: newHistory,
        };
        setCurrentHousehold(updatedHousehold);
        setHouseholds((prev) =>
          prev.map((h) => (h.$id === updatedHousehold.$id ? updatedHousehold : h))
        );
      } catch (error) {
        console.error('Failed to update custom item history:', error);
        throw error;
      }
    },
    [currentHousehold]
  );

  const addToCustomItemHistory = useCallback(
    async (itemName: string) => {
      const trimmedName = itemName.trim();
      if (!trimmedName || !currentHousehold) return;

      const currentHistory = currentHousehold.customItemHistory || [];
      
      // If already in history, don't add again
      if (currentHistory.includes(trimmedName)) {
        return;
      }

      // Add to beginning and keep last 20
      const newHistory = [trimmedName, ...currentHistory].slice(0, 20);
      await updateHouseholdHistory(newHistory);
    },
    [currentHousehold, updateHouseholdHistory]
  );

  const removeFromCustomItemHistory = useCallback(
    async (itemName: string) => {
      if (!currentHousehold) return;

      const currentHistory = currentHousehold.customItemHistory || [];
      const newHistory = currentHistory.filter((item) => item !== itemName);
      await updateHouseholdHistory(newHistory);
    },
    [currentHousehold, updateHouseholdHistory]
  );

  return (
    <HouseholdContext.Provider
      value={{
        currentHousehold,
        households,
        invitations,
        loading,
        createHousehold,
        joinHousehold,
        switchHousehold,
        shareHousehold,
        loadHouseholds,
        loadInvitations,
        acceptInvitation,
        getCustomItemHistory,
        addToCustomItemHistory,
        removeFromCustomItemHistory,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
}

