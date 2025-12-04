export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  estimatedMinutes: number;
  category?: string;
  createdAt: number;
  reminderTime?: number; // timestamp
}

export interface TaskBreakdown {
  subtasks: {
    title: string;
    estimatedMinutes: number;
    priority: Priority;
  }[];
}

export type ThemeType = 'light' | 'dark' | 'nature' | 'sunset' | 'ocean';

export interface ThemeConfig {
  name: string;
  primary: string; // Tailwind color name (e.g., 'indigo', 'emerald')
  bg: string;      // Tailwind bg class for page background
  isDark: boolean;
}
