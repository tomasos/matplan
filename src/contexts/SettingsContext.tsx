import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { MealCategory } from '../types';
import { useAuth } from './AuthContext';
import { databases, realtime, DATABASE_ID, COLLECTIONS, DEV_MODE } from '../config/appwrite';
import { Query } from 'appwrite';

export interface CategoryWeightings {
  meat: number;
  fish: number;
  vegetarian: number;
}

const DEFAULT_WEIGHTINGS: CategoryWeightings = {
  meat: 1,
  fish: 1,
  vegetarian: 1,
};

interface UserPreferencesDocument {
  $id: string;
  userId: string;
  categoryWeightings: string;
  updatedAt: string;
}

interface SettingsContextType {
  categoryWeightings: CategoryWeightings;
  loading: boolean;
  updateCategoryWeighting: (category: MealCategory, weighting: number) => Promise<void>;
  resetWeightings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [categoryWeightings, setCategoryWeightings] = useState<CategoryWeightings>(DEFAULT_WEIGHTINGS);
  const [loading, setLoading] = useState(true);
  const documentIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const loadPreferences = useCallback(async () => {
    if (!user) {
      setCategoryWeightings(DEFAULT_WEIGHTINGS);
      setLoading(false);
      documentIdRef.current = null;
      return;
    }

    if (DEV_MODE) {
      // In dev mode, use default weightings
      setCategoryWeightings(DEFAULT_WEIGHTINGS);
      setLoading(false);
      documentIdRef.current = null;
      return;
    }

    try {
      setLoading(true);
      const response = (await databases!.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_PREFERENCES,
        [Query.equal('userId', user.$id), Query.limit(1)]
      )) as unknown as { documents: UserPreferencesDocument[] };

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        documentIdRef.current = doc.$id;
        const weightings = JSON.parse(doc.categoryWeightings);
        // Validate weightings
        if (
          typeof weightings.meat === 'number' &&
          typeof weightings.fish === 'number' &&
          typeof weightings.vegetarian === 'number' &&
          weightings.meat >= 0 &&
          weightings.fish >= 0 &&
          weightings.vegetarian >= 0
        ) {
          setCategoryWeightings(weightings);
        } else {
          setCategoryWeightings(DEFAULT_WEIGHTINGS);
        }
      } else {
        // Create new document with defaults
        const newDoc = (await databases!.createDocument(
          DATABASE_ID,
          COLLECTIONS.USER_PREFERENCES,
          'unique()',
          {
            userId: user.$id,
            categoryWeightings: JSON.stringify(DEFAULT_WEIGHTINGS),
          } as any
        )) as unknown as UserPreferencesDocument;
        documentIdRef.current = newDoc.$id;
        setCategoryWeightings(DEFAULT_WEIGHTINGS);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setCategoryWeightings(DEFAULT_WEIGHTINGS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPreferences();

    // Set up real-time subscription
    if (user && documentIdRef.current && !DEV_MODE) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      realtime!.subscribe<UserPreferencesDocument>(
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.USER_PREFERENCES}.documents.${documentIdRef.current}`,
        (response) => {
          if (response.payload.userId === user.$id && response.payload.categoryWeightings) {
            setCategoryWeightings(JSON.parse(response.payload.categoryWeightings));
          }
        }
      ).then((subscription) => {
        unsubscribeRef.current = () => {
          subscription.close();
        };
      });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const savePreferences = useCallback(
    async (weightings: CategoryWeightings) => {
      if (!user) return;

      if (DEV_MODE) {
        // In dev mode, just update local state
        return;
      }

      try {
        if (documentIdRef.current) {
          await databases!.updateDocument(
            DATABASE_ID,
            COLLECTIONS.USER_PREFERENCES,
            documentIdRef.current,
            {
              categoryWeightings: JSON.stringify(weightings),
            }
          );
        } else {
          const newDoc = (await databases!.createDocument(
            DATABASE_ID,
            COLLECTIONS.USER_PREFERENCES,
            'unique()',
            {
              userId: user.$id,
              categoryWeightings: JSON.stringify(weightings),
            } as any
          )) as unknown as UserPreferencesDocument;
          documentIdRef.current = newDoc.$id;
        }
      } catch (error) {
        console.error('Failed to save preferences:', error);
        throw error;
      }
    },
    [user]
  );

  const updateCategoryWeighting = useCallback(
    async (category: MealCategory, weighting: number) => {
      const updated = {
        ...categoryWeightings,
        [category]: Math.max(0, weighting), // Ensure non-negative
      };
      setCategoryWeightings(updated);
      await savePreferences(updated);
    },
    [categoryWeightings, savePreferences]
  );

  const resetWeightings = useCallback(async () => {
    setCategoryWeightings(DEFAULT_WEIGHTINGS);
    await savePreferences(DEFAULT_WEIGHTINGS);
  }, [savePreferences]);

  return (
    <SettingsContext.Provider value={{ categoryWeightings, loading, updateCategoryWeighting, resetWeightings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

