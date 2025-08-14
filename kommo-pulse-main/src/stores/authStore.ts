import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  kommo_account: string;
  email_verified: boolean;
  stripe_customer_id: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  plan_type: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';
  trial_ends_at: string | null;
  billing_cycle_ends_at: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  cancel_at_period_end: boolean | null;
  cancelled_at: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  kommoAccount?: string;
}

type AuthStore = AuthState & AuthActions & { api: typeof api };

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Create the auth store
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      subscription: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      api, // Add the api instance

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, subscription, tokens } = response.data.data;
          
          set({
            user,
            subscription,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Set up axios interceptor with the new token
          setupAxiosInterceptor(tokens.accessToken);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            subscription: null,
            tokens: null,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post('/auth/register', data);
          const { user, subscription, tokens } = response.data.data;
          
          set({
            user,
            subscription,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Set up axios interceptor with the new token
          setupAxiosInterceptor(tokens.accessToken);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            subscription: null,
            tokens: null,
          });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        set({
          user: null,
          subscription: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
        });

        // Remove axios interceptor
        delete api.defaults.headers.common['Authorization'];
      },

      refreshToken: async () => {
        const { tokens, isAuthenticated } = get();
        
        // Don't try to refresh if user is not authenticated
        if (!isAuthenticated || !tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await api.post('/auth/refresh', {
            refreshToken: tokens.refreshToken,
          });
          
          const { accessToken } = response.data.data;
          const newTokens = { ...tokens, accessToken };
          
          set({ tokens: newTokens });
          setupAxiosInterceptor(accessToken);
        } catch (error: any) {
          // Refresh failed, logout user
          get().logout();
          throw new Error('Session expired. Please login again.');
        }
      },

      clearError: () => {
        set({ error: null });
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.put('/auth/profile', data);
          const { user } = response.data.data;
          
          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Profile update failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      checkAuth: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) {
          return;
        }

        try {
          setupAxiosInterceptor(tokens.accessToken);
          const response = await api.get('/auth/validate');
          const { user, subscription } = response.data.data;
          
          set({
            user,
            subscription,
            isAuthenticated: true,
            error: null,
          });
        } catch (error) {
          // Token is invalid, logout
          get().logout();
        }
      },

      refreshSubscription: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) {
          return;
        }

        try {
          setupAxiosInterceptor(tokens.accessToken);
          const response = await api.get('/auth/validate');
          const { subscription } = response.data.data;
          
          set({
            subscription,
            error: null,
          });
        } catch (error) {
          console.error('Error refreshing subscription:', error);
        }
      },

      forceRefresh: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) {
          return;
        }

        try {
          setupAxiosInterceptor(tokens.accessToken);
          const response = await api.get('/auth/validate');
          const { user, subscription } = response.data.data;
          
          // Force update all data
          set({
            user,
            subscription,
            isAuthenticated: true,
            error: null,
          });
        } catch (error) {
          console.error('Error force refreshing:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        subscription: state.subscription,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Setup axios interceptor for authenticated requests
function setupAxiosInterceptor(accessToken: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  
  // Response interceptor to handle token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // Only attempt token refresh if:
      // 1. Status is 401 (Unauthorized)
      // 2. Request hasn't been retried yet
      // 3. User is authenticated
      // 4. Request is not to auth endpoints (to avoid infinite loops)
      if (error.response?.status === 401 && 
          !originalRequest._retry && 
          useAuthStore.getState().isAuthenticated &&
          !originalRequest.url?.includes('/auth/refresh') &&
          !originalRequest.url?.includes('/auth/login') &&
          !originalRequest.url?.includes('/auth/register')) {
        
        originalRequest._retry = true;
        
        try {
          await useAuthStore.getState().refreshToken();
          const newToken = useAuthStore.getState().tokens?.accessToken;
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, user will be logged out by refreshToken method
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
}

// Initialize axios interceptor if user is already authenticated
const initialState = useAuthStore.getState();
if (initialState.tokens?.accessToken) {
  setupAxiosInterceptor(initialState.tokens.accessToken);
}

// Export the configured API instance for use in other parts of the app
export { api };
