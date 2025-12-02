import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Meal, MealCategory } from '../types';
import { useHousehold } from './HouseholdContext';
import { databases, DATABASE_ID, COLLECTIONS, DEV_MODE } from '../config/appwrite';
import { Query } from 'appwrite';

const STORAGE_KEY = 'meals';

interface MealDocument {
  $id: string;
  householdId: string;
  name: string;
  category: string;
  link?: string;
  about?: string;
  ingredients: string;
  favorite: boolean;
  weekendMeal: boolean;
}

interface MealsContextType {
  meals: Meal[];
  loading: boolean;
  addMeal: (meal: Omit<Meal, 'id' | 'favorite' | 'weekendMeal'> & { weekendMeal?: boolean }) => Promise<string>;
  updateMeal: (id: string, updates: Partial<Meal>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const MealsContext = createContext<MealsContextType | undefined>(undefined);

export function MealsProvider({ children }: { children: ReactNode }) {
  const { currentHousehold } = useHousehold();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const loadMeals = useCallback(async () => {
    if (!currentHousehold) {
      setMeals([]);
      setLoading(false);
      return;
    }

    if (DEV_MODE) {
      // In dev mode, use localStorage
      try {
        setLoading(true);
        const stored = sessionStorage.getItem(STORAGE_KEY);
        const loadedMeals: Meal[] = stored ? JSON.parse(stored) : [];
        setMeals(loadedMeals.map((meal) => ({
          ...meal,
          weekendMeal: meal.weekendMeal ?? false,
        })));
      } catch (error) {
        console.error('Failed to load meals from localStorage:', error);
        setMeals([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const response = (await databases!.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MEALS,
        [Query.equal('householdId', currentHousehold.$id)]
      )) as unknown as { documents: MealDocument[] };

      const loadedMeals: Meal[] = response.documents.map((doc) => ({
        id: doc.$id,
        name: doc.name,
        category: doc.category as MealCategory,
        link: doc.link,
        about: doc.about,
        ingredients: JSON.parse(doc.ingredients),
        favorite: doc.favorite ?? false,
        weekendMeal: doc.weekendMeal ?? false,
      }));

      setMeals(loadedMeals);
    } catch (error) {
      console.error('Failed to load meals:', error);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, [currentHousehold]);

  useEffect(() => {
    loadMeals();

    // Set up real-time subscription (only in production)
    /*if (currentHousehold && !DEV_MODE) {
      // Unsubscribe from previous subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      realtime!.subscribe<MealDocument>(
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.MEALS}.documents`,
        (response) => {
          if (response.payload.householdId === currentHousehold.$id) {
            if (response.events.includes(`databases.${DATABASE_ID}.collections.${COLLECTIONS.MEALS}.documents.*.create`)) {
              loadMeals();
            } else if (response.events.includes(`databases.${DATABASE_ID}.collections.${COLLECTIONS.MEALS}.documents.*.update`)) {
              loadMeals();
            } else if (response.events.includes(`databases.${DATABASE_ID}.collections.${COLLECTIONS.MEALS}.documents.*.delete`)) {
              loadMeals();
            }
          }
        }
      ).then((subscription) => {
        unsubscribeRef.current = () => {
          subscription.close();
        };
      });
    }*/

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHousehold]);

  const addMeal = useCallback(
    async (meal: Omit<Meal, 'id' | 'favorite' | 'weekendMeal'> & { weekendMeal?: boolean }): Promise<string> => {
      if (!currentHousehold) throw new Error('No household selected');

      if (DEV_MODE) {
        // In dev mode, add to local state
        const newMeal: Meal = {
          ...meal,
          id: Date.now().toString(),
          favorite: false,
          weekendMeal: meal.weekendMeal ?? false,
        };
        setMeals((prev) => {
          const updated = [...prev, newMeal];
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (error) {
            console.error('Failed to save meals to localStorage:', error);
          }
          return updated;
        });
        return newMeal.id;
      }

      try {
        const doc = (await databases!.createDocument(
          DATABASE_ID,
          COLLECTIONS.MEALS,
          'unique()',
          {
            householdId: currentHousehold.$id,
            name: meal.name,
            category: meal.category,
            link: meal.link,
            about: meal.about,
            ingredients: JSON.stringify(meal.ingredients),
            favorite: false,
            weekendMeal: meal.weekendMeal ?? false,
          } as any
        )) as unknown as MealDocument;
        return doc.$id;
      } catch (error) {
        console.error('Failed to add meal:', error);
        throw error;
      }
    },
    [currentHousehold]
  );

  const updateMeal = useCallback(
    async (id: string, updates: Partial<Meal>) => {
      if (!currentHousehold) throw new Error('No household selected');

      if (DEV_MODE) {
        // In dev mode, update local state
        setMeals((prev) => {
          const updated = prev.map((meal) => (meal.id === id ? { ...meal, ...updates } : meal));
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (error) {
            console.error('Failed to save meals to localStorage:', error);
          }
          return updated;
        });
        return;
      }

      try {
        const updateData: Partial<MealDocument> = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.link !== undefined) updateData.link = updates.link;
        if (updates.about !== undefined) updateData.about = updates.about;
        if (updates.ingredients !== undefined) updateData.ingredients = JSON.stringify(updates.ingredients);
        if (updates.favorite !== undefined) updateData.favorite = updates.favorite;
        if (updates.weekendMeal !== undefined) updateData.weekendMeal = updates.weekendMeal;

        await databases!.updateDocument(DATABASE_ID, COLLECTIONS.MEALS, id, updateData);
        loadMeals();
      } catch (error) {
        console.error('Failed to update meal:', error);
        throw error;
      }
    },
    [currentHousehold]
  );

  const deleteMeal = useCallback(
    async (id: string) => {
      if (!currentHousehold) throw new Error('No household selected');

      if (DEV_MODE) {
        // In dev mode, update local state
        setMeals((prev) => {
          const updated = prev.filter((meal) => meal.id !== id);
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (error) {
            console.error('Failed to save meals to localStorage:', error);
          }
          return updated;
        });
        return;
      }

      try {
        await databases!.deleteDocument(DATABASE_ID, COLLECTIONS.MEALS, id);
      } catch (error) {
        console.error('Failed to delete meal:', error);
        throw error;
      }
    },
    [currentHousehold]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const meal = meals.find((m) => m.id === id);
      if (meal) {
        await updateMeal(id, { favorite: !meal.favorite });
      }
    },
    [meals, updateMeal]
  );

  return (
    <MealsContext.Provider value={{ meals, loading, addMeal, updateMeal, deleteMeal, toggleFavorite }}>
      {children}
    </MealsContext.Provider>
  );
}

export function useMeals() {
  const context = useContext(MealsContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealsProvider');
  }
  return context;
}

