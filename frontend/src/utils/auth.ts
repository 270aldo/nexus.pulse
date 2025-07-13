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

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
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
        console.log('Auth state changed:', event, session?.user?.id);
        
        this.updateState({
          user: session?.user ? this.mapUser(session.user) : null,
          session,
          loading: false,
          error: null
        });
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      this.updateState({
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Auth initialization failed'
      });
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

  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session refresh failed';
      return { success: false, error: errorMessage };
    }
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