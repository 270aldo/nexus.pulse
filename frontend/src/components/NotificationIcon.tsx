import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import NotificationList, { NotificationItem } from './NotificationList';
import { useAppContext } from "./AppProvider";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom"; // Importar useNavigate

interface NotificationIconProps {
  className?: string;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { currentUserId } = useAppContext();
  const navigate = useNavigate(); // Hook de navegación

  const fetchNotifications = async () => {
    if (!currentUserId) {
      setNotifications([]);
      setHasUnreadNotifications(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
        setHasUnreadNotifications(false);
      } else if (data) {
        const formattedData = data.map(n => ({
          ...n,
          timestamp: new Date(n.created_at),
        })) as NotificationItem[];
        setNotifications(formattedData);
        setHasUnreadNotifications(formattedData.some(n => !n.is_read));
      }
    } catch (err) {
      console.error("Unexpected error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
        fetchNotifications();
    } else {
        setNotifications([]);
        setHasUnreadNotifications(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchNotifications(); 
    }
  }, [isOpen, currentUserId]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    setIsOpen(false); // Iniciar cierre del popover inmediatamente

    // Marcar como leída si no lo está
    if (!notification.is_read) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      if (error) {
        console.error("Error marking notification as read:", error);
        // Podríamos optar por no continuar si falla, o continuar con la navegación
      } else {
        // Actualizar estado local para reflejar el cambio inmediatamente
        setNotifications(prevNotifications => {
          const updatedNotifications = prevNotifications.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          );
          setHasUnreadNotifications(updatedNotifications.some(n => !n.is_read));
          return updatedNotifications;
        });
      }
    }

    // Navegar si hay link, después de un breve retardo
    if (notification.link_to) {
      setTimeout(() => {
        navigate(notification.link_to);
      }, 100); // Retardo de 100ms para permitir que el popover se cierre
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative text-neutral-300 hover:text-brand-violet hover:bg-neutral-700/50 rounded-full ${className}`}
          aria-label="Notificaciones"
          disabled={isLoading && !isOpen} // No deshabilitar si ya está abierto y recargando
        >
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          {hasUnreadNotifications && (
            <span className="absolute top-1 right-1.5 sm:top-1.5 sm:right-2 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 bg-neutral-850 border-neutral-700 shadow-2xl p-0 text-neutral-100"
        align="end"
        sideOffset={8}
      >
        <NotificationList 
          notifications={notifications} 
          onNotificationClick={handleNotificationClick} // Pasar la función handler
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationIcon;
