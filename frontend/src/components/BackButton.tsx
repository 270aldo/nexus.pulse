import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Navega a la entrada anterior en el historial
  };

  return (
    <Button
      variant="outline"
      size="sm" // Opcional: 'default' o 'lg' si se prefiere más grande
      className={`text-neutral-300 hover:text-neutral-100 border-neutral-700 hover:border-neutral-600 inline-flex items-center ${className}`}
      onClick={handleGoBack}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Volver
    </Button>
  );
};

export default BackButton;
