import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useHousehold } from './HouseholdContext';
import { databases, DATABASE_ID, COLLECTIONS, DEV_MODE } from '../config/appwrite';
import { Query } from 'appwrite';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity?: number;
  checked: boolean;
  isCustom: boolean; // true for manually added items, false for ingredients from meals
}

interface ShoppingListData {
  items: ShoppingListItem[];
}

interface ShoppingListDocument {
  $id: string;
  householdId: string;
  weekKey: string;
  items: string[];
  updatedAt: string;
}

interface ShoppingListContextType {
  getShoppingList: (weekKey: string) => ShoppingListItem[];
  getCustomItemHistory: () => string[];
  ensureShoppingListLoaded: (weekKey: string) => Promise<void>;
  toggleItemChecked: (weekKey: string, itemId: string) => Promise<void>;
  addCustomItem: (weekKey: string, itemName: string) => Promise<void>;
  removeItem: (weekKey: string, itemId: string) => Promise<void>;
  removeAllItems: (weekKey: string) => Promise<void>;
  syncItemsFromWeekPlan: (weekKey: string, items: Omit<ShoppingListItem, 'id' | 'checked'>[]) => Promise<void>;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const { currentHousehold, getCustomItemHistory: getHouseholdCustomItemHistory, addToCustomItemHistory } = useHousehold();
  const [shoppingLists, setShoppingLists] = useState<Record<string, ShoppingListData>>({});
  const loadedWeekKeysRef = useRef<Set<string>>(new Set());
  const unsubscribeRefsRef = useRef<Map<string, () => void>>(new Map());

  const loadShoppingList = useCallback(
    async (weekKey: string) => {
      if (!currentHousehold || loadedWeekKeysRef.current.has(weekKey)) {
        return;
      }

      if (DEV_MODE) {
        // In dev mode, use empty shopping list
        setShoppingLists((prev) => ({
          ...prev,
          [weekKey]: {
            items: [],
          },
        }));
        loadedWeekKeysRef.current.add(weekKey);
        return;
      }

      try {
        const response = (await databases!.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SHOPPING_LISTS,
          [
            Query.equal('householdId', currentHousehold.$id),
            Query.equal('weekKey', weekKey),
            Query.limit(1),
          ]
        )) as unknown as { documents: ShoppingListDocument[] };

        if (response.documents.length > 0) {
          const doc = response.documents[0];
          let parsedItems: ShoppingListItem[] = [];
          try {
            if (doc.items) {
              parsedItems = doc.items.map((item) => JSON.parse(item)) || [];
            }
          } catch (error) {
            console.error(`Failed to parse items for ${weekKey}:`, error);
            parsedItems = [];
          }
          setShoppingLists((prev) => ({
            ...prev,
            [weekKey]: {
              items: parsedItems,
            },
          }));
          loadedWeekKeysRef.current.add(weekKey);

          // Set up real-time subscription
          /*realtime!.subscribe<ShoppingListDocument>(
            `databases.${DATABASE_ID}.collections.${COLLECTIONS.SHOPPING_LISTS}.documents.${doc.$id}`,
            (response) => {
              if (response.payload.householdId === currentHousehold.$id && response.payload.weekKey.toString() === weekKey) {
                setShoppingLists((prev) => ({
                  ...prev,
                  [weekKey]: {
                    items: response.payload.items || [],
                  },
                }));
              }
            }
          ).then((subscription) => {
            unsubscribeRefsRef.current.set(weekKey, () => {
              subscription.close();
            });
          });*/
        } else {
          // Create new document if it doesn't exist
          await databases!.createDocument(
            DATABASE_ID,
            COLLECTIONS.SHOPPING_LISTS,
            'unique()',
            {
              householdId: currentHousehold.$id,
              weekKey: weekKey,
              items: [],
            } as any
          );
          setShoppingLists((prev) => ({
            ...prev,
            [weekKey]: {
              items: [],
            },
          }));
          loadedWeekKeysRef.current.add(weekKey);
        }
      } catch (error) {
        console.error(`Failed to load shopping list for ${weekKey}:`, error);
      }
    },
    [currentHousehold]
  );

  const saveShoppingList = useCallback(
    async (weekKey: string, data: ShoppingListData) => {
      if (!currentHousehold) return;

      if (DEV_MODE) {
        // In dev mode, just update local state
        return;
      }

      try {
        // Find existing document
        const response = (await databases!.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SHOPPING_LISTS,
          [
            Query.equal('householdId', currentHousehold.$id),
            Query.equal('weekKey', weekKey),
            Query.limit(1),
          ]
        )) as unknown as { documents: ShoppingListDocument[] };

        if (response.documents.length > 0) {
          await databases!.updateDocument(
            DATABASE_ID,
            COLLECTIONS.SHOPPING_LISTS,
            response.documents[0].$id,
            {
              items: data.items.map(item => JSON.stringify(item)),
            }
          );
        } else {
          await databases!.createDocument(
            DATABASE_ID,
            COLLECTIONS.SHOPPING_LISTS,
            'unique()',
            {
              householdId: currentHousehold.$id,
              weekKey: weekKey,
              items: JSON.stringify(data.items),
            } as any
          );
        }
      } catch (error) {
        console.error(`Failed to save shopping list for ${weekKey}:`, error);
        throw error;
      }
    },
    [currentHousehold]
  );

  useEffect(() => {
    // Cleanup subscriptions when household changes
    return () => {
      unsubscribeRefsRef.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefsRef.current.clear();
      loadedWeekKeysRef.current.clear();
      setShoppingLists({});
    };
  }, [currentHousehold]);

  // Expose a function to ensure shopping list is loaded (for use in useEffect)
  const ensureShoppingListLoaded = useCallback(
    async (weekKey: string) => {
      if (!loadedWeekKeysRef.current.has(weekKey)) {
        await loadShoppingList(weekKey);
      }
    },
    [loadShoppingList]
  );

  const getShoppingList = useCallback(
    (weekKey: string): ShoppingListItem[] => {
      return shoppingLists[weekKey]?.items || [];
    },
    [shoppingLists]
  );

  const getCustomItemHistory = useCallback((): string[] => {
    return getHouseholdCustomItemHistory();
  }, [getHouseholdCustomItemHistory]);

  const toggleItemChecked = useCallback(
    async (weekKey: string, itemId: string) => {
      if (!loadedWeekKeysRef.current.has(weekKey)) {
        await loadShoppingList(weekKey);
      }

      const weekData = shoppingLists[weekKey] || { items: [] };
      const updatedItems = weekData.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      const updated = {
        ...weekData,
        items: updatedItems,
      };
      setShoppingLists((prev) => ({
        ...prev,
        [weekKey]: updated,
      }));
      await saveShoppingList(weekKey, updated);
    },
    [shoppingLists, loadShoppingList, saveShoppingList]
  );

  const addCustomItem = useCallback(
    async (weekKey: string, itemName: string) => {
      const trimmedName = itemName.trim();
      if (!trimmedName) return;

      if (!loadedWeekKeysRef.current.has(weekKey)) {
        await loadShoppingList(weekKey);
      }

      const weekData = shoppingLists[weekKey] || { items: [] };

      // Check if item already exists (case-insensitive)
      const existingItem = weekData.items.find(
        (item) => item.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (existingItem) {
        // If exists and is checked, uncheck it; otherwise do nothing
        if (existingItem.checked) {
          const updatedItems = weekData.items.map((item) =>
            item.id === existingItem.id ? { ...item, checked: false } : item
          );
          const updated = {
            ...weekData,
            items: updatedItems,
          };
          setShoppingLists((prev) => ({
            ...prev,
            [weekKey]: updated,
          }));
          await saveShoppingList(weekKey, updated);
        }
        return;
      }

      const newItem: ShoppingListItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: trimmedName,
        checked: false,
        isCustom: true,
      };

      // Add to household custom item history
      await addToCustomItemHistory(trimmedName);

      const updated = {
        items: [...weekData.items, newItem],
      };
      setShoppingLists((prev) => ({
        ...prev,
        [weekKey]: updated,
      }));
      await saveShoppingList(weekKey, updated);
    },
    [shoppingLists, loadShoppingList, saveShoppingList]
  );

  const removeItem = useCallback(
    async (weekKey: string, itemId: string) => {
      if (!loadedWeekKeysRef.current.has(weekKey)) {
        await loadShoppingList(weekKey);
      }

      const weekData = shoppingLists[weekKey];
      if (!weekData) return;

      const updatedItems = weekData.items.filter((item) => item.id !== itemId);
      const updated = {
        ...weekData,
        items: updatedItems,
      };
      setShoppingLists((prev) => ({
        ...prev,
        [weekKey]: updated,
      }));
      await saveShoppingList(weekKey, updated);
    },
    [shoppingLists, loadShoppingList, saveShoppingList]
  );

  const removeAllItems = useCallback(
    async (weekKey: string) => {
      if (!loadedWeekKeysRef.current.has(weekKey)) {
        await loadShoppingList(weekKey);
      }

      const weekData = shoppingLists[weekKey];
      if (!weekData) return;

      const updated = {
        ...weekData,
        items: [],
      };
      setShoppingLists((prev) => ({
        ...prev,
        [weekKey]: updated,
      }));
      await saveShoppingList(weekKey, updated);
    },
    [shoppingLists, loadShoppingList, saveShoppingList]
  );

  const syncItemsFromWeekPlan = useCallback(
    async (weekKey: string, newItems: Omit<ShoppingListItem, 'id' | 'checked'>[]) => {
      if (!loadedWeekKeysRef.current.has(weekKey)) {
        await loadShoppingList(weekKey);
        // Wait a bit for state to update after loading
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Use functional update to read current state and update atomically
      let updated: ShoppingListData | null = null;
      setShoppingLists((prev) => {
        const weekData = prev[weekKey] || { items: [] };

        // Keep all custom items (always)
        const customItems = weekData.items.filter((item) => item.isCustom);

        // Keep checked ingredient items (even if not in new week plan)
        const checkedIngredientItems = weekData.items.filter(
          (item) => !item.isCustom && item.checked
        );

        // Create new ingredient items from week plan
        const newIngredientItems: ShoppingListItem[] = newItems.map((item) => ({
          ...item,
          id: `ingredient-${item.name}-${item.quantity || ''}`,
          checked: false,
          isCustom: false,
        }));

        // Create a map of new ingredient items by id
        const newIngredientMap = new Map(newIngredientItems.map((item) => [item.id, item]));

        // For checked ingredient items, keep them if they still exist in new week plan (preserve checked state)
        // or if they don't exist anymore (keep them anyway)
        const keptCheckedItems = checkedIngredientItems.map((item) => {
          const newItem = newIngredientMap.get(item.id);
          if (newItem) {
            // Item still exists, keep it with checked state
            return { ...newItem, checked: true };
          }
          // Item no longer exists in week plan, but keep it since it's checked
          return item;
        });

        // Combine: custom items + kept checked items + new unchecked ingredient items
        const keptCheckedIds = new Set(keptCheckedItems.map((item) => item.id));
        const newUncheckedItems = newIngredientItems.filter((item) => !keptCheckedIds.has(item.id));

        const mergedItems = [...customItems, ...keptCheckedItems, ...newUncheckedItems];

        updated = {
          ...weekData,
          items: mergedItems,
        };
        
        return {
          ...prev,
          [weekKey]: updated,
        };
      });

      // Save to database if we have updated data
      if (updated) {
        await saveShoppingList(weekKey, updated);
      }
    },
    [loadShoppingList, saveShoppingList]
  );

  return (
    <ShoppingListContext.Provider
      value={{
        getShoppingList,
        getCustomItemHistory,
        ensureShoppingListLoaded,
        toggleItemChecked,
        addCustomItem,
        removeItem,
        removeAllItems,
        syncItemsFromWeekPlan,
      }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext);
  if (context === undefined) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider');
  }
  return context;
}

