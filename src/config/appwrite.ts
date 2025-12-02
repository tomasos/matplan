import { Client, Account, Databases, Realtime } from 'appwrite';

export const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

// Only require Appwrite config if not in dev mode
if (!DEV_MODE && (!endpoint || !projectId)) {
  throw new Error('Missing Appwrite environment variables. Please set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID');
}

export const client = DEV_MODE
  ? null
  : new Client().setEndpoint(endpoint!).setProject(projectId!);

export const account = DEV_MODE ? null : new Account(client!);
export const databases = DEV_MODE ? null : new Databases(client!);
export const realtime = DEV_MODE ? null : new Realtime(client!);

// Database and Collection IDs
export const DATABASE_ID = '692da612003db210ff79';
export const COLLECTIONS = {
  HOUSEHOLDS: 'households',
  HOUSEHOLD_INVITATIONS: 'household_invitations',
  MEALS: 'meals',
  WEEK_PLANS: 'week_plans',
  SHOPPING_LISTS: 'shopping_lists',
  USER_PREFERENCES: 'user_preferences',
} as const;

