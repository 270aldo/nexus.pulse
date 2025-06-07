import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Importar useLocation
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

const GlobalAICoachWidget: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Obtener la ubicación actual

  const handleNavigateToChat = () => {
    navigate('/chat-page');
  };

  // No renderizar el widget si estamos en la página de chat
  if (location.pathname === '/chat-page') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        variant="outline"
        size="icon"
        className="bg-brand-violet hover:bg-brand-violet/90 text-white rounded-full shadow-lg w-14 h-14 border-none"
        onClick={handleNavigateToChat}
        aria-label="Abrir chat con NGX AI Coach"
      >
        <Bot className="w-7 h-7" />
      </Button>
    </div>
  );
};

export default GlobalAICoachWidget;
