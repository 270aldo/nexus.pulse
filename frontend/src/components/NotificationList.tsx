import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge"; // Para tipos de notificación o estado
import { ThumbsUp, AlertTriangle, MessageSquare, CalendarCheck2, Bell } from "lucide-react"; // Iconos ejemplo

// Definición del tipo de Notificación (debería coincidir o ser un subconjunto de lo que venga de la DB)
export interface NotificationItem {
  id: string;
  type: "recordatorio_checkin" | "evento_programa" | "mensaje_coach" | "logro" | "alerta";
  title: string;
  message: string;
  timestamp: Date;
  is_read: boolean;
  link_to?: string;
}

// Datos de ejemplo
const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "recordatorio_checkin",
    title: "¡No olvides tu Check-in!",
    message: "Registra tu progreso de hoy para mantener el impulso.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // Hace 30 mins
    is_read: false,
    link_to: "/daily-checkin",
  },
  {
    id: "2",
    type: "logro",
    title: "¡Nuevo Logro Desbloqueado!",
    message: "Completaste 3 entrenamientos esta semana. ¡Sigue así!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // Hace 3 horas
    is_read: false,
  },
  {
    id: "3",
    type: "mensaje_coach",
    title: "Mensaje de tu Coach",
    message: "He revisado tu último registro y tengo algunas sugerencias para tu próxima sesión.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Ayer
    is_read: true,
    link_to: "/chat-page", // Asumiendo que hay una página de chat con el coach
  },
  {
    id: "4",
    type: "alerta",
    title: "Revisión de Progreso Semanal",
    message: "Es momento de revisar tus métricas de la semana y planificar la siguiente.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // Hace 2 días
    is_read: true,
  },
];


interface NotificationListProps {
  notifications?: NotificationItem[]; 
  onNotificationClick?: (notification: NotificationItem) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

const getNotificationIcon = (type: NotificationItem["type"]) => {
  switch (type) {
    case "recordatorio_checkin":
      return <CalendarCheck2 className="h-5 w-5 text-blue-400" />;
    case "logro":
      return <ThumbsUp className="h-5 w-5 text-green-400" />;
    case "mensaje_coach":
      return <MessageSquare className="h-5 w-5 text-purple-400" />;
    case "alerta":
      return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    default:
      return <Bell className="h-5 w-5 text-neutral-400" />;
  }
};

const NotificationList: React.FC<NotificationListProps> = ({
  notifications = mockNotifications, // Usar mock data por ahora
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col h-full max-h-[70vh] sm:max-h-[600px]">
      <header className="p-4 border-b border-neutral-700 sticky top-0 bg-neutral-850 z-10">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-neutral-100">Notificaciones</h3>
          {/* Botón para marcar todas como leídas (funcionalidad futura) */}
          {/* {unreadCount > 0 && onMarkAllAsRead && (
             <Button variant="link" size="sm" onClick={onMarkAllAsRead} className="text-brand-violet hover:text-brand-violet/80 px-0 h-auto">
              Marcar todas como leídas
            </Button>
          )} */}
        </div>
      </header>

      {notifications.length === 0 ? (
        <div className="flex-grow flex items-center justify-center p-8">
          <p className="text-sm text-neutral-500">No tienes notificaciones nuevas.</p>
        </div>
      ) : (
        <ScrollArea className="flex-grow">
          <div className="divide-y divide-neutral-750">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-neutral-800 cursor-pointer ${notification.is_read ? "opacity-70" : ""}`}
                onClick={() => {
                  if (onNotificationClick) onNotificationClick(notification);
                  // Lógica para marcar como leída (funcionalidad futura)
                  // if (!notification.is_read && onMarkAsRead) onMarkAsRead(notification.id);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-0.5">
                       <h4 className={`text-sm font-medium ${notification.is_read ? "text-neutral-400" : "text-neutral-100"}`}>
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-brand-violet flex-shrink-0 ml-2" title="No leída"></span>
                      )}
                    </div>
                    <p className={`text-xs ${notification.is_read ? "text-neutral-500" : "text-neutral-300"} mb-1 leading-relaxed line-clamp-2`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {notification.timestamp.toLocaleDateString([], { day: '2-digit', month: 'short' })}, {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      
      {notifications.length > 0 && (
         <footer className="p-3 border-t border-neutral-700 sticky bottom-0 bg-neutral-850 z-10">
            <p className="text-xs text-center text-neutral-500">
              {unreadCount > 0 ? `${unreadCount} no leídas` : "Todo al día"}
            </p>
         </footer>
      )}
    </div>
  );
};

export default NotificationList;