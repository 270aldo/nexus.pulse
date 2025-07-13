
import React, { createContext, useContext, useEffect, useState, ReactNode, startTransition } from "react";
import { supabase } from "../utils/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface AppContextType {
  session: Session | null;
  isLoadingSession: boolean;
  currentUserId: string | null;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        setIsLoadingSession(true);
        
        // Verificar si hay usuario offline primero
        const offlineUser = localStorage.getItem("offline_user");
        if (offlineUser) {
          const userData = JSON.parse(offlineUser);
          console.log("Usuario offline encontrado:", userData);
          setCurrentUserId(userData.id);
          setIsLoadingSession(false);
          return;
        }
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setCurrentUserId(currentSession?.user?.id ?? null);
        console.log("Sesión Supabase cargada:", currentSession ? "Logged in" : "Not logged in");
      } catch (error) {
        console.error("Error fetching session:", error);
        setSession(null);
        setCurrentUserId(null);
      } finally {
        setIsLoadingSession(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setCurrentUserId(newSession?.user?.id ?? null);
      setIsLoadingSession(false);
      
      if (_event === "SIGNED_OUT") {
        localStorage.removeItem("offline_user");
        startTransition(() => {
          navigate("/auth-page");
        });
      }
    });

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    }
    // Limpiar usuario offline también
    localStorage.removeItem("offline_user");
    setSession(null);
    setCurrentUserId(null);
    startTransition(() => {
      navigate("/auth-page");
    });
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
