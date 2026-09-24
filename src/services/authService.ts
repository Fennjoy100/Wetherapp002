import { DEFAULT_LOCATIONS } from './weatherService.ts';
import { LocationData, TempUnit, UserProfile, WindUnit } from '../types/weather.ts';

const USER_STORAGE_KEY = 'weatherflow_current_user';
const ALL_USERS_KEY = 'weatherflow_registered_users';

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'demo-alex',
    name: 'Alex Rivera',
    email: 'alex.rivera@weatherflow.io',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    preferredUnit: 'celsius',
    preferredWindUnit: 'kmh',
    savedLocations: [
      DEFAULT_LOCATIONS[0], // San Francisco
      DEFAULT_LOCATIONS[2], // Tokyo
      DEFAULT_LOCATIONS[4], // Paris
    ],
  },
  {
    id: 'demo-sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@skywatch.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    preferredUnit: 'fahrenheit',
    preferredWindUnit: 'mph',
    savedLocations: [
      DEFAULT_LOCATIONS[3], // New York
      DEFAULT_LOCATIONS[1], // London
      DEFAULT_LOCATIONS[5], // Sydney
    ],
  },
];

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserSession(user: UserProfile): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearUserSession(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function createGuestUser(): UserProfile {
  return {
    id: `guest-${Date.now()}`,
    name: 'Guest Explorer',
    email: 'guest@weatherflow.local',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    preferredUnit: 'celsius',
    preferredWindUnit: 'kmh',
    savedLocations: [DEFAULT_LOCATIONS[0], DEFAULT_LOCATIONS[1]],
    isGuest: true,
  };
}

export function updateUserPreferences(
  updates: Partial<Pick<UserProfile, 'preferredUnit' | 'preferredWindUnit' | 'name'>>,
): UserProfile | null {
  const user = getStoredUser();
  if (!user) return null;

  const updated: UserProfile = {
    ...user,
    ...updates,
  };
  saveUserSession(updated);
  return updated;
}

export function toggleFavoriteLocation(
  user: UserProfile,
  location: LocationData,
): { user: UserProfile; isFavorite: boolean } {
  const existingIndex = user.savedLocations.findIndex(
    (loc) =>
      (loc.id && loc.id === location.id) ||
      (Math.abs(loc.latitude - location.latitude) < 0.05 &&
        Math.abs(loc.longitude - location.longitude) < 0.05) ||
      loc.name.toLowerCase() === location.name.toLowerCase(),
  );

  let updatedLocations: LocationData[];
  let isFavorite: boolean;

  if (existingIndex >= 0) {
    updatedLocations = user.savedLocations.filter((_, idx) => idx !== existingIndex);
    isFavorite = false;
  } else {
    updatedLocations = [...user.savedLocations, location];
    isFavorite = true;
  }

  const updatedUser: UserProfile = {
    ...user,
    savedLocations: updatedLocations,
  };

  saveUserSession(updatedUser);
  return { user: updatedUser, isFavorite };
}
