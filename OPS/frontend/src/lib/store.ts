import { create } from 'zustand';
import type { Project } from '@/types';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AppState {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedProject: null,
  setSelectedProject: (project) => set({ selectedProject: project }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: 'system',
  setTheme: (theme) => {
    set({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  },
  user: null,
  isAuthenticated: false,
  login: async (email: string, _password: string) => {
    // Mock auth — accept any credentials
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({
      user: {
        id: 'u1',
        name: 'Eng. Silva',
        email,
        role: 'engenheiro',
      },
      isAuthenticated: true,
    });
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
}));
