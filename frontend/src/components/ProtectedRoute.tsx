
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppContext } from "./AppProvider"; // Asegúrate que la ruta sea correcta
import { Skeleton } from "@/components/ui/skeleton"; // Para el estado de carga

interface ProtectedRouteProps {
  // No se necesitan props explícitas aquí, ya que el contexto maneja la sesión
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, isLoadingSession } = useAppContext();
  const location = useLocation();

  if (isLoadingSession) {
    // Muestra un esqueleto o spinner mientras se carga la sesión
    // Esto mejora la UX evitando un parpadeo de la página de login
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full bg-slate-700" />
          <Skeleton className="h-8 w-3/4 bg-slate-700" />
          <Skeleton className="h-32 w-full bg-slate-700" />
          <Skeleton className="h-10 w-1/2 bg-slate-700" />
        </div>
      </div>
    );
  }

  if (!session) {
    // Si no hay sesión y la carga ha terminado, redirige a la página de autenticación
    // Guarda la ubicación actual para redirigir de vuelta después del login
    return <Navigate to="/auth-page" state={{ from: location }} replace />;
  }

  // Si hay una sesión, renderiza el contenido de la ruta protegida (sus hijos directos)
  return <>{children}</>;
};

export default ProtectedRoute;
