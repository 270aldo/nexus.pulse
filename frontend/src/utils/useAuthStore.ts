import { create } from 'zustand';
import { supabase } from './supabaseClient'; // Asegúrate que la ruta sea correcta
import { log } from './logger';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  checkUserSession: () => Promise<void>; // Para la carga inicial de la sesión
  signOut: () => Promise<void>; // Para cerrar sesión
}

const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true, // Inicia en true hasta que se verifique la sesión

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  checkUserSession: async () => {
    try {
      get().setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error.message);
        // Considera cómo manejar el error, quizás setear user/session a null
      }
      get().setSession(session);
    } catch (error) {
      console.error('Error in checkUserSession:', error);
    } finally {
      get().setLoading(false);
    }
  },
  
  signOut: async () => {
    try {
      get().setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
        // Aquí también, maneja el error como sea apropiado
      }
      // setSession(null) se maneja por onAuthStateChange o explícitamente si es necesario
      // pero Supabase debería limpiar la sesión localmente.
      // Por seguridad, podrías setearlo a null explícitamente:
      get().setSession(null);
    } catch (error) {
      console.error('Error in signOut:', error);
    } finally {
      get().setLoading(false);
    }
  },
}));

// Escuchar cambios en el estado de autenticación para mantener el store sincronizado
// Esto se ejecuta una vez cuando el store se importa por primera vez.
supabase.auth.onAuthStateChange((event, session) => {
  const store = useAuthStore.getState();
  log('Supabase auth state change:', event, session);
  store.setSession(session);
  store.setLoading(false); // Asegurarse de que loading sea false después del cambio
});

// Llamar a checkUserSession una vez al inicio para cargar el estado inicial de la sesión
// Esto es importante si la página se recarga y ya hay una sesión activa.
// Se puede llamar en un componente de nivel superior (App.tsx o similar) o aquí directamente.
// Si se llama aquí, se ejecutará cuando este módulo se cargue.
// Considerar si es mejor llamarlo desde AppProvider.tsx o un hook de inicialización.
// Por ahora, para asegurar que se cargue:
// useAuthStore.getState().checkUserSession(); 
// Nota: Llamarlo aquí directamente puede tener implicaciones en SSR o si el módulo se carga múltiples veces.
// Es más seguro llamarlo desde un useEffect en un componente raíz de la app.

export default useAuthStore;
