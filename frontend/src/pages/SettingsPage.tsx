import React, { useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import FeedbackModal from "../components/FeedbackModal";
import { Button } from "@/components/ui/button";
import { useAppContext } from "../components/AppProvider";
import { useLocation } from "react-router-dom";
import { MessageSquareText } from "lucide-react"; // Icon for feedback
import BackButton from "@/components/BackButton"; // Importar BackButton

const SettingsPageContent: React.FC = () => {
  const { currentUserId } = useAppContext();
  const location = useLocation();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const contextIdentifier = location.pathname;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 sm:p-6 lg:p-8">
      <BackButton className="mb-6" /> {/* Añadir BackButton */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-brand-violet tracking-tight">
          Configuración y Ayuda
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Gestiona tus preferencias y obtén soporte.
        </p>
      </header>

      <main className="space-y-6 max-w-2xl">
        <section>
          <h2 className="text-xl font-semibold text-neutral-200 mb-3">Feedback</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Tus comentarios nos ayudan a mejorar NGX Pulse. Si tienes alguna sugerencia o encuentras algún problema, no dudes en hacérnoslo saber.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-neutral-100 border-neutral-700 hover:border-neutral-600 shadow-md text-sm py-2 px-4 rounded-lg inline-flex items-center"
            onClick={() => setIsFeedbackModalOpen(true)}
          >
            <MessageSquareText className="w-4 h-4 mr-2" />
            Enviar comentarios sobre la aplicación
          </Button>
        </section>
        
        {/* Ejemplo de futuras secciones comentadas 
        <section>
          <h2 className="text-xl font-semibold text-neutral-200 mb-3">Preferencias de Notificaciones</h2>
          <p className="text-sm text-neutral-400 mb-4">Elige qué notificaciones deseas recibir.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-200 mb-3">Cuenta</h2>
          <p className="text-sm text-neutral-400 mb-4">Información de tu cuenta.</p>
        </section>
        */}
      </main>

      {currentUserId && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onOpenChange={setIsFeedbackModalOpen}
          userId={currentUserId}
          contextIdentifier={contextIdentifier}
        />
      )}
    </div>
  );
};

const SettingsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
};

export default SettingsPage;
