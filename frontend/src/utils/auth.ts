// NGX Pulse Auth Utils - Secure authentication wrapper for Supabase
import { supabase } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: Record<string, any>;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

class AuthManager {
  private listeners: Array<(state: AuthState) => void> = [];
  private currentState: AuthState = {
    user: null,
    session: null,
    loading: true,
    error: null
  };
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initializeAuth();
  }

  // Method to await full initialization
  async ready(): Promise<AuthState> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    return this.currentState;
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.updateState({ 
          user: null, 
          session: null, 
          loading: false, 
          error: error.message 
        });
        this.initializationPromise = null; // Mark as complete
        return;
      }

      this.updateState({
        user: session?.user ? this.mapUser(session.user) : null,
        session,
        loading: false,
        error: null
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        // Note: Removing console.log for production readiness
        
        this.updateState({
          user: session?.user ? this.mapUser(session.user) : null,
          session,
          loading: false,
          error: null
        });
      });

    } catch (error) {
      // Log auth errors in development only
      if (import.meta.env.DEV) {
        console.error('Auth initialization error:', error);
      }
      this.updateState({
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Auth initialization failed'
      });
    } finally {
      // Mark initialization as complete
      this.initializationPromise = null;
    }
  }

  private mapUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      user_metadata: user.user_metadata
    };
  }

  private updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  // Public methods
  getState(): AuthState {
    return this.currentState;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ loading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        this.updateState({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        // State will be updated via onAuthStateChange
        return { success: true };
      }

      this.updateState({ loading: false, error: 'Login failed' });
      return { success: false, error: 'Login failed' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.updateState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ loading: true, error: null });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password
      });

      if (error) {
        this.updateState({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        // State will be updated via onAuthStateChange
        return { success: true };
      }

      this.updateState({ loading: false, error: 'Registration failed' });
      return { success: false, error: 'Registration failed' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      this.updateState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ loading: true, error: null });

      const { error } = await supabase.auth.signOut();

      if (error) {
        this.updateState({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      // Clean up any offline mode artifacts
      localStorage.removeItem('offline_user');
      
      // State will be updated via onAuthStateChange
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      this.updateState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async refreshSession(maxRetries: number = 3): Promise<{ success: boolean; error?: string }> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          lastError = error.message;
          
          // Don't retry on certain error types
          if (error.message.includes('invalid_grant') || error.message.includes('token_expired')) {
            return { success: false, error: lastError };
          }
          
          // Calculate backoff delay (exponential: 1s, 2s, 4s)
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else {
          return { success: true };
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Session refresh failed';
        
        // Calculate backoff delay for network errors
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    return { success: false, error: `Failed after ${maxRetries} attempts: ${lastError}` };
  }

  // Helper methods
  isAuthenticated(): boolean {
    return !!this.currentState.session;
  }

  getUser(): AuthUser | null {
    return this.currentState.user;
  }

  getSession(): Session | null {
    return this.currentState.session;
  }

  getAccessToken(): string | null {
    return this.currentState.session?.access_token || null;
  }
}

// Export singleton instance
export const authManager = new AuthManager();

// React hook for auth state
export function useAuthState(): AuthState {
  const [state, setState] = React.useState<AuthState>(authManager.getState());

  React.useEffect(() => {
    const unsubscribe = authManager.subscribe(setState);
    return unsubscribe;
  }, []);

  return state;
}

// Import React for the hook
import React from 'react';