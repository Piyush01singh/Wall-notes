export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  userId: string; // Link note to user
  parentId?: string | null; // For nested pages
  expanded?: boolean; // UI state for sidebar
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // stored as plain text per request (normally hashed)
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: number;
}

export type ViewMode = 'edit' | 'view' | 'split';
export type AppView = 'login' | 'signup' | 'app' | 'admin';