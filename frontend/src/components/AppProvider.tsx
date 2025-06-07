
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"; // Ensured useEffect is imported
import { Toaster } from "@/components/ui/sonner";
import GlobalAICoachWidget from "./GlobalAICoachWidget"; // Importar el nuevo widget
import NotificationIcon from "./NotificationIcon"; // Importar NotificationIcon

import { supabase } from "../utils/supabaseClient"; // Asegúrate que la ruta sea correcta
import { Session } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
// import FeedbackWidget from "./FeedbackWidget"; // Removed
// import FeedbackModal from "./FeedbackModal"; // Removed

interface AppContextType {
  session: Session | null;
  isLoadingSession: boolean;
  currentUserId: string | null; // Added currentUserId
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // Usar useLocation aquí
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        setIsLoadingSession(true);
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setCurrentUserId(currentSession?.user?.id ?? null);
      } catch (error) {
        console.error("Error fetching session:", error);
        setSession(null); // Asegurar que la sesión sea null en caso de error
        setCurrentUserId(null);
      } finally {
        setIsLoadingSession(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setCurrentUserId(newSession?.user?.id ?? null);
      setIsLoadingSession(false); // Cuando hay un cambio, la carga ha terminado
      if (_event === "SIGNED_OUT") {
        navigate("/auth-page");
      } else if (_event === "SIGNED_IN" && newSession) {
        // Opcional: Redirigir al dashboard si se inicia sesión y no está ya allí.
        // Considerar si esto es deseable o si la redirección debe ser manejada por la página de login.
        // if (window.location.pathname === "/auth" || window.location.pathname === "/") {
        //   navigate("/dashboard");
        // }
      }
    });

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []); // Removed navigate from dependencies, it should be stable
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      // Considerar mostrar un toast de error aquí
    } else {
      // La redirección se maneja con onAuthStateChange SIGNED_OUT
      // setSession(null); // se actualiza via onAuthStateChange
    }
  };

  // const handleOpenFeedbackModal = () => { // Removed
  //   if (!currentUserId) {
  //     console.warn("Feedback modal opened without a logged-in user. Submission will fail.");
  //   }
  //   setIsFeedbackModalOpen(true);
  // };

  // Podrías añadir un botón o enlace de logout en algún lugar accesible, como un Header
  // Ejemplo rápido de un botón de logout si hay sesión:
  // {session && <button onClick={handleLogout}>Logout</button>}


  // Rutas donde NO se mostrará el ícono de notificaciones
  const noNotificationIconRoutes = ["/", "/auth-page"];

  return (
    <AppContext.Provider value={{ session, isLoadingSession, currentUserId }}> {/* Added currentUserId to context */}
      {/* ThemeProvider global ya es manejado por el framework (AppWrapper.tsx) */}
      {children}
      <Toaster richColors theme="dark" closeButton />
      <GlobalAICoachWidget />
      {/* Mostrar NotificationIcon condicionalmente */}
      {!noNotificationIconRoutes.includes(location.pathname) && (
        <NotificationIcon className="fixed top-4 right-4 z-50" />
      )}
      {/* <FeedbackWidget onClick={handleOpenFeedbackModal} /> */}{/* Removed */}
      {/* <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onOpenChange={setIsFeedbackModalOpen} 
        userId={currentUserId}
        contextIdentifier={contextIdentifier}
      /> */}{/* Removed */}
    </AppContext.Provider>
  );
};
