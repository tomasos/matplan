import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { WeekPlan } from '../types';
import { useHousehold } from './HouseholdContext';
import { databases, realtime, DATABASE_ID, COLLECTIONS, DEV_MODE } from '../config/appwrite';
import { Query } from 'appwrite';

interface WeekPlanDocument {
  $id: string;
  householdId: string;
  plans: string;
  updatedAt: string;
}

interface WeekPlanContextType {
  weekPlans: WeekPlan;
  loading: boolean;
  setMealForDay: (dayKey: string, mealId: string | null) => Promise<void>;
  clearWeek: (dayKeys: string[]) => Promise<void>;
}

const WeekPlanContext = createContext<WeekPlanContextType | undefined>(undefined);

export function WeekPlanProvider({ children }: { children: ReactNode }) {
  const { currentHousehold } = useHousehold();
  const [weekPlans, setWeekPlans] = useState<WeekPlan>({});
  const [loading, setLoading] = useState(true);
  const documentIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const loadWeekPlans = useCallback(async () => {
    if (!currentHousehold) {
      setWeekPlans({});
      setLoading(false);
      documentIdRef.current = null;
      return;
    }

    if (DEV_MODE) {
      // In dev mode, use empty week plans
      setWeekPlans({});
      setLoading(false);
      documentIdRef.current = null;
      return;
    }

    try {
      setLoading(true);
      const response = (await databases!.listDocuments(
        DATABASE_ID,
        COLLECTIONS.WEEK_PLANS,
        [Query.equal('householdId', currentHousehold.$id), Query.limit(1)]
      )) as unknown as { documents: WeekPlanDocument[] };

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        documentIdRef.current = doc.$id;
        setWeekPlans(JSON.parse(doc.plans) || {});
      } else {
        // Create new document if it doesn't exist
        const newDoc = (await databases!.createDocument(
          DATABASE_ID,
          COLLECTIONS.WEEK_PLANS,
          'unique()',
          {
            householdId: currentHousehold.$id,
            plans: JSON.stringify({}),
          }
        )) as unknown as WeekPlanDocument;
        documentIdRef.current = newDoc.$id;
        setWeekPlans({});
      }
    } catch (error) {
      console.error('Failed to load week plans:', error);
      setWeekPlans({});
    } finally {
      setLoading(false);
    }
  }, [currentHousehold]);

  useEffect(() => {
    loadWeekPlans();

    // Set up real-time subscription
    if (currentHousehold && documentIdRef.current && !DEV_MODE) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      realtime!.subscribe<WeekPlanDocument>(
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.WEEK_PLANS}.documents.${documentIdRef.current}`,
        (response) => {
          if (response.payload.householdId === currentHousehold.$id && response.payload.plans) {
            setWeekPlans(JSON.parse(response.payload.plans));
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
  }, [currentHousehold]);

  const saveWeekPlans = useCallback(
    async (plans: WeekPlan) => {
      if (!currentHousehold || !documentIdRef.current) return;

      if (DEV_MODE) {
        // In dev mode, just update local state
        return;
      }

      try {
        await databases!.updateDocument(DATABASE_ID, COLLECTIONS.WEEK_PLANS, documentIdRef.current, {
          plans: JSON.stringify(plans),
        });
      } catch (error) {
        console.error('Failed to save week plans:', error);
        throw error;
      }
    },
    [currentHousehold]
  );

  const setMealForDay = useCallback(
    async (dayKey: string, mealId: string | null) => {
      const updated = {
        ...weekPlans,
        [dayKey]: mealId,
      };
      setWeekPlans(updated);
      await saveWeekPlans(updated);
    },
    [weekPlans, saveWeekPlans]
  );

  const clearWeek = useCallback(
    async (dayKeys: string[]) => {
      const updated = { ...weekPlans };
      dayKeys.forEach((dayKey) => {
        updated[dayKey] = null;
      });
      setWeekPlans(updated);
      await saveWeekPlans(updated);
    },
    [weekPlans, saveWeekPlans]
  );

  return (
    <WeekPlanContext.Provider value={{ weekPlans, loading, setMealForDay, clearWeek }}>
      {children}
    </WeekPlanContext.Provider>
  );
}

export function useWeekPlan() {
  const context = useContext(WeekPlanContext);
  if (context === undefined) {
    throw new Error('useWeekPlan must be used within a WeekPlanProvider');
  }
  return context;
}

