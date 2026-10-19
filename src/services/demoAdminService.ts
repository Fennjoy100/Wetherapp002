import { UserProfile } from '../types/weather.ts';

export interface DemoActivityItem {
  id: string;
  userName: string;
  action: string;
  type: 'login' | 'logout';
  timestamp: string;
}

export interface DemoStats {
  totalLogins: number;
  totalLogouts: number;
  lastLoginTime: string;
  lastLogoutTime: string;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'weatherise_demo_user',
  STATS: 'weatherise_demo_stats',
  ACTIVITY: 'weatherise_demo_activity',
};

// Formats timestamp nicely for college demo
export function formatDemoTimestamp(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleDateString('en-US', options);
}

// Initial sample demonstration activity items (as specified in user requirements)
const INITIAL_SAMPLE_ACTIVITY: DemoActivityItem[] = [
  {
    id: 'act-sample-1',
    userName: 'Teacher',
    action: 'Teacher logged in',
    type: 'login',
    timestamp: 'Today at 08:30 AM',
  },
  {
    id: 'act-sample-2',
    userName: 'Student',
    action: 'Student logged out',
    type: 'logout',
    timestamp: 'Yesterday at 05:45 PM',
  },
  {
    id: 'act-sample-3',
    userName: 'Demo user',
    action: 'Demo user logged in',
    type: 'login',
    timestamp: 'Yesterday at 02:15 PM',
  },
];

const INITIAL_STATS: DemoStats = {
  totalLogins: 4,
  totalLogouts: 2,
  lastLoginTime: 'Today at 08:30 AM',
  lastLogoutTime: 'Yesterday at 05:45 PM',
};

// Get current demo logged-in user
export function getDemoUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Save demo logged-in user
export function setDemoUser(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
  // Dispatch custom event for reactive real-time updates across the app
  window.dispatchEvent(new CustomEvent('weatherise:auth_change', { detail: user }));
}

// Get demo statistics
export function getDemoStats(): DemoStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(INITIAL_STATS));
      return INITIAL_STATS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STATS;
  }
}

// Save demo statistics
export function saveDemoStats(stats: DemoStats): void {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  window.dispatchEvent(new CustomEvent('weatherise:stats_change', { detail: stats }));
}

// Get demo activity log
export function getDemoActivities(): DemoActivityItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(INITIAL_SAMPLE_ACTIVITY));
      return INITIAL_SAMPLE_ACTIVITY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAMPLE_ACTIVITY;
  } catch {
    return INITIAL_SAMPLE_ACTIVITY;
  }
}

// Save activity log
export function saveDemoActivities(activities: DemoActivityItem[]): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activities));
  window.dispatchEvent(new CustomEvent('weatherise:activity_change', { detail: activities }));
}

// Record a Login Event
export function recordDemoLogin(userName: string): UserProfile {
  const cleanName = userName.trim() || 'Demo user';
  const nowStr = formatDemoTimestamp();

  // Create User Profile
  const profile: UserProfile = {
    id: `demo-${Date.now()}`,
    name: cleanName,
    email: `${cleanName.toLowerCase().replace(/\s+/g, '')}@weatherise.demo`,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
    preferredUnit: 'celsius',
    preferredWindUnit: 'kmh',
    savedLocations: [],
  };

  setDemoUser(profile);

  // Update Stats
  const currentStats = getDemoStats();
  const updatedStats: DemoStats = {
    ...currentStats,
    totalLogins: (currentStats.totalLogins || 0) + 1,
    lastLoginTime: nowStr,
  };
  saveDemoStats(updatedStats);

  // Prepend to Activity Log
  const activities = getDemoActivities();
  const newActivity: DemoActivityItem = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userName: cleanName,
    action: `${cleanName} logged in`,
    type: 'login',
    timestamp: nowStr,
  };
  saveDemoActivities([newActivity, ...activities.slice(0, 49)]);

  return profile;
}

// Record a Logout Event
export function recordDemoLogout(): void {
  const currentUser = getDemoUser();
  const userName = currentUser?.name || 'Demo user';
  const nowStr = formatDemoTimestamp();

  setDemoUser(null);

  // Update Stats
  const currentStats = getDemoStats();
  const updatedStats: DemoStats = {
    ...currentStats,
    totalLogouts: (currentStats.totalLogouts || 0) + 1,
    lastLogoutTime: nowStr,
  };
  saveDemoStats(updatedStats);

  // Prepend to Activity Log
  const activities = getDemoActivities();
  const newActivity: DemoActivityItem = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userName,
    action: `${userName} logged out`,
    type: 'logout',
    timestamp: nowStr,
  };
  saveDemoActivities([newActivity, ...activities.slice(0, 49)]);
}

// Reset demonstration data back to initial presentation baseline
export function resetDemoData(): { stats: DemoStats; activities: DemoActivityItem[] } {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(INITIAL_STATS));
  localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(INITIAL_SAMPLE_ACTIVITY));
  window.dispatchEvent(new CustomEvent('weatherise:stats_change', { detail: INITIAL_STATS }));
  window.dispatchEvent(new CustomEvent('weatherise:activity_change', { detail: INITIAL_SAMPLE_ACTIVITY }));
  return { stats: INITIAL_STATS, activities: INITIAL_SAMPLE_ACTIVITY };
}
