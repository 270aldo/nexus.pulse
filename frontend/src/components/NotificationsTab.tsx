import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lightbulb,
  Award,
  MessageCircleWarning,
  Settings,
  Filter,
  MoreVertical,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Users,
  Target,
  Activity,
  Heart,
  Brain,
  Smartphone,
  Mail,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAppContext } from './AppProvider';
import { apiClient } from '../utils/apiClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  user_id: string;
  title?: string | null;
  body: string;
  message_type: 'ALERT' | 'INFO' | 'RECOMMENDATION' | 'PRAISE' | 'MOTIVATION' | 'WARNING' | 'ERROR' | 'REMINDER';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  deep_link?: string | null;
  created_at: string;
  read_at?: string | null;
  category: 'health' | 'fitness' | 'nutrition' | 'system' | 'social';
  source: 'ai_coach' | 'system' | 'user' | 'device';
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
  categories: {
    health: boolean;
    fitness: boolean;
    nutrition: boolean;
    system: boolean;
    social: boolean;
  };
  urgencyFilters: {
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const NotificationsTab: React.FC = () => {
  const { currentUserId } = useAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'high' | 'today'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: false,
    soundEnabled: true,
    categories: {
      health: true,
      fitness: true,
      nutrition: true,
      system: true,
      social: false
    },
    urgencyFilters: {
      high: true,
      medium: true,
      low: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    }
  });

  // Mock data - in a real app, this would come from the backend
  const mockNotifications: Notification[] = [
    {
      id: '1',
      user_id: currentUserId || '',
      title: 'Meta de Sueño Alcanzada',
      body: '¡Excelente! Has dormido 8.2 horas anoche, superando tu meta de 8 horas.',
      message_type: 'PRAISE',
      urgency: 'LOW',
      created_at: new Date().toISOString(),
      category: 'health',
      source: 'ai_coach'
    },
    {
      id: '2',
      user_id: currentUserId || '',
      title: 'HRV Bajo Detectado',
      body: 'Tu HRV está 15% por debajo del promedio. Considera tomar un día de descanso.',
      message_type: 'WARNING',
      urgency: 'HIGH',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      category: 'health',
      source: 'ai_coach',
      deep_link: '/biometric-log-page'
    },
    {
      id: '3',
      user_id: currentUserId || '',
      title: 'Recordatorio de Entrenamiento',
      body: 'Tu sesión de pierna y core está programada para las 10:00 AM.',
      message_type: 'REMINDER',
      urgency: 'MEDIUM',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      category: 'fitness',
      source: 'system',
      deep_link: '/training-log-page'
    },
    {
      id: '4',
      user_id: currentUserId || '',
      title: 'Análisis Nutricional',
      body: 'Has consumido solo 65% de tu proteína diaria recomendada.',
      message_type: 'INFO',
      urgency: 'LOW',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      category: 'nutrition',
      source: 'ai_coach',
      read_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '5',
      user_id: currentUserId || '',
      title: 'Racha de 7 Días',
      body: '¡Increíble! Has completado 7 días consecutivos de actividad física.',
      message_type: 'PRAISE',
      urgency: 'LOW',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      category: 'fitness',
      source: 'system',
      read_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
    }
  ];

  useEffect(() => {
    loadNotifications();
  }, [currentUserId]);

  useEffect(() => {
    applyFilters();
  }, [notifications, selectedFilter, selectedCategory]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      setTimeout(() => {
        setNotifications(mockNotifications);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Apply basic filters
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read_at);
        break;
      case 'high':
        filtered = filtered.filter(n => n.urgency === 'HIGH');
        break;
      case 'today':
        const today = new Date();
        filtered = filtered.filter(n => {
          const notifDate = new Date(n.created_at);
          return notifDate.toDateString() === today.toDateString();
        });
        break;
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory);
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read_at: new Date().toISOString() }
          : notif
      )
    );
  };

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notif => ({ 
        ...notif, 
        read_at: notif.read_at || new Date().toISOString() 
      }))
    );
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (messageType: string, urgency: string) => {
    switch (messageType.toUpperCase()) {
      case 'ALERT':
        return { Icon: AlertTriangle, color: urgency === 'HIGH' ? 'text-red-400' : 'text-amber-400' };
      case 'RECOMMENDATION':
        return { Icon: Lightbulb, color: 'text-lime-400' };
      case 'PRAISE':
        return { Icon: Award, color: 'text-emerald-400' };
      case 'MOTIVATION':
        return { Icon: CheckCircle2, color: 'text-teal-400' };
      case 'WARNING':
        return { Icon: MessageCircleWarning, color: 'text-yellow-400' };
      case 'ERROR':
        return { Icon: AlertTriangle, color: 'text-red-500' };
      case 'REMINDER':
        return { Icon: Clock, color: 'text-blue-400' };
      case 'INFO':
      default:
        return { Icon: Info, color: 'text-sky-400' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return Heart;
      case 'fitness': return Activity;
      case 'nutrition': return Target;
      case 'system': return Settings;
      case 'social': return Users;
      default: return Bell;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " año" : " años");
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " mes" : " meses");
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " día" : " días");
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hora" : " horas");
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " min" : " mins");
    return "Hace un momento";
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Centro de Notificaciones</h2>
          <p className="text-sm text-neutral-400">
            Gestiona tus alertas y mensajes del sistema
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-violet-600/20 text-violet-400 text-xs rounded-full">
                {unreadCount} sin leer
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={markAllAsRead}
            variant="outline"
            size="sm"
            className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
            disabled={unreadCount === 0}
          >
            <CheckCircle2 size={16} className="mr-2" />
            Marcar todo como leído
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="bg-neutral-800/60 border border-neutral-700/70 p-1 rounded-lg">
          <TabsTrigger value="notifications" className="text-xs">Notificaciones</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedFilter} onValueChange={(value: 'all' | 'unread' | 'high' | 'today') => setSelectedFilter(value)}>
              <SelectTrigger className="w-full sm:w-48 bg-neutral-800 border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Sin leer ({unreadCount})</SelectItem>
                <SelectItem value="high">Urgentes</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-neutral-800 border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="health">Salud</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="nutrition">Nutrición</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-neutral-800 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto text-neutral-600 mb-4" />
                <p className="text-neutral-400">No hay notificaciones que mostrar</p>
                <p className="text-sm text-neutral-500">
                  {selectedFilter !== 'all' || selectedCategory !== 'all' 
                    ? 'Intenta cambiar los filtros' 
                    : 'Las nuevas notificaciones aparecerán aquí'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(notification => {
                const { Icon, color } = getNotificationIcon(notification.message_type, notification.urgency);
                const CategoryIcon = getCategoryIcon(notification.category);
                const isUnread = !notification.read_at;

                return (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border transition-all duration-200 hover:bg-neutral-800/50 ${
                      isUnread 
                        ? 'bg-violet-500/5 border-violet-500/30' 
                        : 'bg-neutral-800/30 border-neutral-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Notification Icon */}
                      <div className={`p-2 rounded-lg ${isUnread ? 'bg-violet-500/20' : 'bg-neutral-700/50'} flex-shrink-0`}>
                        <Icon size={20} className={color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {notification.title && (
                              <h4 className={`font-medium mb-1 ${isUnread ? 'text-white' : 'text-neutral-300'}`}>
                                {notification.title}
                              </h4>
                            )}
                            <p className={`text-sm ${isUnread ? 'text-neutral-200' : 'text-neutral-400'}`}>
                              {notification.body}
                            </p>
                            
                            {/* Metadata */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                              <div className="flex items-center gap-1">
                                <CategoryIcon size={12} />
                                <span className="capitalize">{notification.category}</span>
                              </div>
                              <span>{getTimeAgo(notification.created_at)}</span>
                              <span className={`px-2 py-1 rounded-full ${
                                notification.urgency === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                notification.urgency === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {notification.urgency.toLowerCase()}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isUnread && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 w-8 p-0 hover:bg-neutral-700"
                              >
                                <Eye size={16} />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </Button>

                            {isUnread && (
                              <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                            )}
                          </div>
                        </div>

                        {/* Deep Link Action */}
                        {notification.deep_link && (
                          <div className="mt-3">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-xs"
                            >
                              Ver detalles
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <div className="ngx-card">
              <h3 className="text-lg font-semibold text-white mb-4">Configuración General</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone size={20} className="text-neutral-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Notificaciones Push</p>
                      <p className="text-xs text-neutral-400">Recibir notificaciones en tu dispositivo</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.pushEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({...prev, pushEnabled: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-neutral-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Notificaciones por Email</p>
                      <p className="text-xs text-neutral-400">Recibir resúmenes diarios por correo</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.emailEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({...prev, emailEnabled: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.soundEnabled ? <Volume2 size={20} className="text-neutral-400" /> : <VolumeX size={20} className="text-neutral-400" />}
                    <div>
                      <p className="text-white text-sm font-medium">Sonido</p>
                      <p className="text-xs text-neutral-400">Reproducir sonido con notificaciones</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({...prev, soundEnabled: checked}))}
                  />
                </div>
              </div>
            </div>

            {/* Category Settings */}
            <div className="ngx-card">
              <h3 className="text-lg font-semibold text-white mb-4">Categorías</h3>
              
              <div className="space-y-4">
                {Object.entries(settings.categories).map(([category, enabled]) => {
                  const Icon = getCategoryIcon(category);
                  const labels: Record<string, string> = {
                    health: 'Salud',
                    fitness: 'Fitness',
                    nutrition: 'Nutrición',
                    system: 'Sistema',
                    social: 'Social'
                  };

                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="text-neutral-400" />
                        <p className="text-white text-sm font-medium">{labels[category]}</p>
                      </div>
                      <Switch 
                        checked={enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev, 
                          categories: { ...prev.categories, [category]: checked }
                        }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="ngx-card">
              <h3 className="text-lg font-semibold text-white mb-4">Horario Silencioso</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-neutral-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Activar horario silencioso</p>
                      <p className="text-xs text-neutral-400">No recibir notificaciones durante estas horas</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.quietHours.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev, 
                      quietHours: { ...prev.quietHours, enabled: checked }
                    }))}
                  />
                </div>

                {settings.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Inicio</label>
                      <input
                        type="time"
                        value={settings.quietHours.start}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, start: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Fin</label>
                      <input
                        type="time"
                        value={settings.quietHours.end}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, end: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Urgency Filters */}
            <div className="ngx-card">
              <h3 className="text-lg font-semibold text-white mb-4">Filtros por Urgencia</h3>
              
              <div className="space-y-4">
                {Object.entries(settings.urgencyFilters).map(([level, enabled]) => {
                  const colors = {
                    high: 'text-red-400',
                    medium: 'text-yellow-400',
                    low: 'text-green-400'
                  };

                  const labels = {
                    high: 'Alta',
                    medium: 'Media',
                    low: 'Baja'
                  };

                  return (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className={colors[level as keyof typeof colors]} />
                        <p className="text-white text-sm font-medium">Urgencia {labels[level as keyof typeof labels]}</p>
                      </div>
                      <Switch 
                        checked={enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev, 
                          urgencyFilters: { ...prev.urgencyFilters, [level]: checked }
                        }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white">
              Guardar Configuración
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsTab;