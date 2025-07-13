import React, { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute"; // Importar ProtectedRoute
import StyledContentBox from "../components/StyledContentBox"; // Importar StyledContentBox
import KPIValueCard from "../components/KPIValueCard"; // Import the new KPI card
import SleepTrendSection from "../components/SleepTrendSection"; // Import SleepTrendSection
import HrvTrendSection from "../components/HrvTrendSection"; // Import HrvTrendSection
import { Dumbbell, Apple, ClipboardList, Smile, HeartPulse, CheckCircle2, Bed, Activity as ActivityIcon, Footprints, BarChartHorizontalBig, CalendarDays, Brain as BrainIconLucide, Users, TrendingUp, AlertTriangle, Bot, Target, LayoutDashboard, Utensils, BarChart3, ChevronRight, Settings, LogOut, BookOpenText, Info, MessageCircleWarning, Award, Lightbulb, BellRing, Link as LinkIcon, Download as DownloadIcon } from 'lucide-react'; // Added DownloadIcon
import { supabase } from "../utils/supabaseClient"; // Import supabase client
import { subDays, format, eachDayOfInterval, startOfDay, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'; // Added Recharts imports (AreaChart, Area)
import { useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation
import { toast } from "sonner"; // For potential error notifications
import { useAppContext } from "../components/AppProvider"; // Para isLoadingSession y currentUserId
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { apiClient } from "../utils/apiClient";
import { ThemeToggle } from "../components/ThemeToggle";


const DashboardPageContent: React.FC = () => { // Renombrar el contenido original
  const navigate = useNavigate(); // Initialize navigate
  const { isLoadingSession, currentUserId } = useAppContext(); // Obtener isLoadingSession y currentUserId
  const [sleepHours, setSleepHours] = useState<string | null>(null);
  const [steps, setSteps] = useState<string | null>(null);
  const [hrv, setHrv] = useState<string | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);
  // const [userId, setUserId] = useState<string | null>(null); // Replaced by currentUserId from useAppContext

interface AICoachMessage {
  id: string;
  user_id: string;
  title?: string | null;
  body: string;
  message_type: string; // ALERT, INFO, RECOMMENDATION, PRAISE, MOTIVATION, WARNING, ERROR
  urgency: string; // LOW, MEDIUM, HIGH
  deep_link?: string | null;
  created_at: string; // Assuming ISO string from backend
  read_at?: string | null;
}
const [aiCoachMessages, setAiCoachMessages] = useState<AICoachMessage[]>([]);
const [isLoadingAiCoachMessages, setIsLoadingAiCoachMessages] = useState<boolean>(true);



interface HrvTrendData {
  date: string; // Formatted date e.g., "10 may"
  hrv: number | null;
}
const [hrv7DayTrend, setHrv7DayTrend] = useState<HrvTrendData[]>([]);

interface SleepTrendData {
  date: string; // Formatted date e.g., "10 may"
  hours: number | null; // Horas de sueño
}
const [sleep7DayTrend, setSleep7DayTrend] = useState<SleepTrendData[]>([]);

  // useEffect para obtener el userId - REMOVED as currentUserId comes from AppContext
  // useEffect(() => {
  //   const fetchUser = async () => {
  //     const { data: { user } } = await supabase.auth.getUser();
  //     if (user) {
  //       setUserId(user.id);
  //     } else {
  //       console.warn("Dashboard: Usuario no encontrado al cargar métricas.");
  //       setIsLoadingMetrics(false); // No hay usuario, no se cargarán métricas
  //     }
  //   };
  //   fetchUser();
  // }, []);

  // useEffect para obtener las métricas una vez que tenemos el currentUserId y la sesión no está cargando
  useEffect(() => {
    if (!currentUserId || isLoadingSession) {
      // Si no hay currentUserId o la sesión aún está cargando, no intentes buscar métricas.
      // Si isLoadingSession es true, esperamos. Si es false y no hay currentUserId, el efecto anterior ya puso isLoadingMetrics a false.
      if (!isLoadingSession && !currentUserId) {
         setIsLoadingMetrics(false);
      }
      return;
    }

    const fetchBiometrics = async () => {
      setIsLoadingMetrics(true);
      try {
        // Sueño
        const { data: sleepData, error: sleepError } = await supabase
          .from('biometric_entries')
          .select('value_numeric, unit, entry_date')
          .eq('user_id', currentUserId) // Use currentUserId
          .eq('metric_type', 'sleep_hours')
          .order('entry_date', { ascending: false })
          .limit(1)
          .maybeSingle(); // Use maybeSingle para manejar 0 o 1 fila sin error

        if (sleepError && sleepError.code !== 'PGRST116') {
          console.error('Error fetching sleep data:', sleepError);
        } else if (sleepData) {
          setSleepHours(`${parseFloat(sleepData.value_numeric).toFixed(1)}${sleepData.unit ? ` ${sleepData.unit.charAt(0)}` : 'h'}`);
        }

        // Pasos
        const { data: stepsData, error: stepsError } = await supabase
          .from('biometric_entries')
          .select('value_numeric, entry_date')
          .eq('user_id', currentUserId) // Use currentUserId
          .eq('metric_type', 'steps')
          .order('entry_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (stepsError && stepsError.code !== 'PGRST116') {
          console.error('Error fetching steps data:', stepsError);
        } else if (stepsData) {
          setSteps(Number(stepsData.value_numeric).toLocaleString('es-ES'));
        }

        // HRV
        const { data: hrvData, error: hrvError } = await supabase
          .from('biometric_entries')
          .select('value_numeric, unit, entry_date')
          .eq('user_id', currentUserId) // Use currentUserId
          .eq('metric_type', 'hrv')
          .order('entry_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (hrvError && hrvError.code !== 'PGRST116') {
          console.error('Error fetching HRV data:', hrvError);
        } else if (hrvData) {
          setHrv(`${hrvData.value_numeric}${hrvData.unit ? ` ${hrvData.unit}` : 'ms'}`);
        }

        // Define date range for trends (today and last 7 days)
        const today = startOfDay(new Date());
        const sevenDaysAgo = subDays(today, 6); // Inclusive of today, so 6 days back
        const dateInterval = eachDayOfInterval({ start: sevenDaysAgo, end: today });

        // HRV 7-Day Trend
        const { data: hrvEntries, error: hrvTrendError } = await supabase
          .from('biometric_entries')
          .select('value_numeric, entry_date')
          .eq('user_id', currentUserId) // Use currentUserId
          .eq('metric_type', 'hrv')
          .gte('entry_date', format(sevenDaysAgo, 'yyyy-MM-dd'))
          .lte('entry_date', format(today, 'yyyy-MM-dd'))
          .order('entry_date', { ascending: true });

        if (hrvTrendError) {
          console.error('Error fetching HRV trend data:', hrvTrendError);
          toast.error('Error al cargar tendencia de HRV.');
        } else if (hrvEntries) {
          const dateInterval = eachDayOfInterval({ start: sevenDaysAgo, end: today });
          const processedTrendData = dateInterval.map(dayInInterval => {
            const dayString = format(dayInInterval, 'yyyy-MM-dd');
            const entriesForDay = hrvEntries.filter(entry => {
              const entryDateObj = parseISO(entry.entry_date);
              return isValid(entryDateObj) && format(startOfDay(entryDateObj), 'yyyy-MM-dd') === dayString;
            });

            let dailyAverageHrv: number | null = null;
            if (entriesForDay.length > 0) {
              const sum = entriesForDay.reduce((acc, curr) => acc + curr.value_numeric, 0);
              dailyAverageHrv = sum / entriesForDay.length;
            }
            return {
              date: format(dayInInterval, 'd MMM', { locale: es }), // e.g., "10 may"
              hrv: dailyAverageHrv !== null ? parseFloat(dailyAverageHrv.toFixed(1)) : null,
            };
          });
          setHrv7DayTrend(processedTrendData);
        }

        // Sleep 7-Day Trend
        const { data: sleepEntries, error: sleepTrendError } = await supabase
          .from('biometric_entries')
          .select('value_numeric, entry_date')
          .eq('user_id', currentUserId) // Use currentUserId
          .eq('metric_type', 'sleep_hours') // Asegurarse que el tipo es correcto para sueño
          .gte('entry_date', format(sevenDaysAgo, 'yyyy-MM-dd'))
          .lte('entry_date', format(today, 'yyyy-MM-dd'))
          .order('entry_date', { ascending: true });

        if (sleepTrendError) {
          console.error('Error fetching sleep trend data:', sleepTrendError);
          toast.error('Error al cargar tendencia de sueño.');
        } else if (sleepEntries) {
          const processedSleepTrendData = dateInterval.map(dayInInterval => {
            const dayString = format(dayInInterval, 'yyyy-MM-dd');
            const entriesForDay = sleepEntries.filter(entry => {
              const entryDateObj = parseISO(entry.entry_date);
              return isValid(entryDateObj) && format(startOfDay(entryDateObj), 'yyyy-MM-dd') === dayString;
            });

            let dailySleepHours: number | null = null;
            if (entriesForDay.length > 0) {
              // Asumimos que solo hay una entrada de sueño por día, o tomamos la primera si hay varias
              // Si se pueden registrar múltiples parciales de sueño, se necesitaría sumarlos o promediarlos según la lógica de negocio
              dailySleepHours = entriesForDay[0].value_numeric;
            }
            return {
              date: format(dayInInterval, 'd MMM', { locale: es }), // e.g., "10 may"
              hours: dailySleepHours !== null ? parseFloat(dailySleepHours.toFixed(1)) : null,
            };
          });
          setSleep7DayTrend(processedSleepTrendData);
        }

      } catch (error) {
        console.error('Error fetching biometric data:', error);
        toast.error('Error al cargar métricas biométricas.');
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchBiometrics();

    const fetchAiCoachMessages = async () => {
      if (!currentUserId) return; // No need to fetch if no user
      setIsLoadingAiCoachMessages(true);
      try {
        // The actual brain client function name might vary slightly,
        // e.g., getAiCoachMessages or listAiCoachMessages.
        // Assuming it's getAiCoachMessages based on previous inspection.
        const response = await apiClient.get('/api/ai/coach-messages');
        const messages: AICoachMessage[] = response.success ? response.data : [];
        setAiCoachMessages(messages);
      } catch (error) {
        console.error("Error fetching AI Coach messages:", error);
        toast.error("Error al cargar mensajes del AI Coach.");
        setAiCoachMessages([]); // Set to empty array on error
      } finally {
        setIsLoadingAiCoachMessages(false);
      }
    };

    fetchAiCoachMessages();
  }, [currentUserId, isLoadingSession]); // Depend on currentUserId from AppContext

  const handleLogoutClick = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error);
        toast.error(`Error al cerrar sesión: ${error.message}`);
      } else {
        // La redirección es manejada por AppProvider onAuthStateChange
        // No es necesario navegar explícitamente aquí si AppProvider lo hace.
        // toast.success("Sesión cerrada exitosamente"); // Podría ser redundante si se redirige inmediatamente
      }
    } catch (error: any) {
      console.error("Unexpected error logging out:", error);
      toast.error(`Error inesperado al cerrar sesión: ${error.message}`);
    }
  };
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 sm:p-6 lg:p-8 flex flex-col">
      {/* Placeholder for Top Global Navigation Bar (visual only) */}
      <div className="h-16 bg-neutral-800/30 border-b border-neutral-700/50 flex items-center justify-between px-6 mb-6 rounded-t-lg shadow-md">
        <div className="flex items-center space-x-2">
          {/* Placeholder for Logo/User Avatar */}
          <div className="w-8 h-8 bg-brand-violet rounded-full" /> 
          <span className="font-semibold text-neutral-200">Alicia Koch</span>
        </div>
        <nav className="flex items-center space-x-4">
          {["Overview", "Customers", "Products", "Settings"].map((item) => (
            <a key={item} href="#" className="text-sm text-neutral-400 hover:text-brand-teal transition-colors">
              {item}
            </a>
          ))}
          <ThemeToggle />
        </nav>
      </div>

      {/* Dashboard Header Section */}
      <header className="mb-6 px-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-50 tracking-tight">
            Dashboard
          </h1>
          <div className="flex items-center space-x-3 mt-3 sm:mt-0">
            <Button variant="outline" className="bg-neutral-800/60 border-neutral-700 hover:bg-neutral-700/80 text-neutral-300 hover:text-neutral-100">
              <CalendarDays size={16} className="mr-2 text-neutral-400" />
              <span className="text-xs">Ene 20, 2023 - Feb 09, 2023</span>
            </Button>
            <Button className="bg-brand-violet hover:bg-brand-violet/90 text-white">
              <DownloadIcon size={16} className="mr-2" />
              <span className="text-xs">Descargar</span>
            </Button>
          </div>
        </div>
        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="bg-neutral-800/60 border border-neutral-700/70 p-1 rounded-lg">
            <TabsTrigger value="resumen" className="text-xs data-[state=active]:bg-brand-violet/20 data-[state=active]:text-brand-violet data-[state=active]:shadow-sm hover:text-neutral-100 text-neutral-400 px-3 py-1.5">Resumen</TabsTrigger>
            <TabsTrigger value="analiticas" className="text-xs data-[state=active]:bg-brand-violet/20 data-[state=active]:text-brand-violet data-[state=active]:shadow-sm hover:text-neutral-100 text-neutral-400 px-3 py-1.5">Analíticas</TabsTrigger>
            <TabsTrigger value="reportes" className="text-xs data-[state=active]:bg-brand-violet/20 data-[state=active]:text-brand-violet data-[state=active]:shadow-sm hover:text-neutral-100 text-neutral-400 px-3 py-1.5">Reportes</TabsTrigger>
            <TabsTrigger value="notificaciones" className="text-xs data-[state=active]:bg-brand-violet/20 data-[state=active]:text-brand-violet data-[state=active]:shadow-sm hover:text-neutral-100 text-neutral-400 px-3 py-1.5">Notificaciones</TabsTrigger>
          </TabsList>
          <TabsContent value="resumen" className="mt-6">
            {/* Main content grid will go here */}
            {/* Existing main grid: */}
            <div className="space-y-6">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <KPIValueCard 
                  title="Horas de Sueño"
                  value={sleepHours}
                  unit="h"
                  icon={Bed}
                  iconColor="text-blue-400"
                  isLoading={isLoadingMetrics}
                />
                <KPIValueCard 
                  title="HRV Promedio"
                  value={hrv}
                  unit="ms"
                  icon={BarChartHorizontalBig} 
                  iconColor="text-purple-400"
                  isLoading={isLoadingMetrics}
                />
                <KPIValueCard 
                  title="Pasos Hoy"
                  value={steps}
                  icon={Footprints}
                  iconColor="text-green-400"
                  isLoading={isLoadingMetrics}
                />
                <KPIValueCard 
                  title="Adh. Entrenamiento"
                  value="5/7" // Placeholder - connect to actual data later if available
                  unit="Sesiones"
                  icon={Dumbbell}
                  iconColor="text-sky-400"
                  isLoading={false} // Assuming this part isn't tied to isLoadingMetrics for now
                />
              </div>

              {/* Main Content Area (Chart + Sidebar) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Sleep Trend Chart */}
                <div className="lg:col-span-2">
                  <SleepTrendSection sleep7DayTrend={sleep7DayTrend} isLoadingMetrics={isLoadingMetrics} />
                </div>
                
                {/* Sidebar Content */}
                <div className="lg:col-span-1 space-y-6">
                  <HrvTrendSection hrv7DayTrend={hrv7DayTrend} isLoadingMetrics={isLoadingMetrics} />

                  <StyledContentBox title="Próximas Actividades">
                    <div className="space-y-4">
                      {/* Actividad 1 */}
                      <div className="flex items-start space-x-3">
                        <CalendarDays className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-neutral-200 text-sm font-medium">Entrenamiento: Pierna y Core</h4>
                          <p className="text-xs text-amber-400">Hoy <span className="text-neutral-400">· 10:00 AM - 11:00 AM</span></p>
                        </div>
                      </div>
                      {/* Actividad 2 */}
                      <div className="flex items-start space-x-3">
                        <BrainIconLucide className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-neutral-200 text-sm font-medium">Ejercicio Cognitivo: Enfoque</h4>
                          <p className="text-xs text-violet-400">Hoy <span className="text-neutral-400">· 2:30 PM</span></p>
                        </div>
                      </div>
                      {/* Actividad 3 */}
                      <div className="flex items-start space-x-3">
                        <Users className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-neutral-200 text-sm font-medium">Check-in con Coach</h4>
                          <p className="text-xs text-cyan-400">Mañana <span className="text-neutral-400">· 9:00 AM</span></p>
                        </div>
                      </div>
                    </div>
                  </StyledContentBox>

                  <StyledContentBox title="Mensajes del AI Coach">
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800/50 scrollbar-thumb-rounded-full">
                      {isLoadingAiCoachMessages ? (
                        <p className="text-neutral-400 text-sm p-3">Cargando mensajes del coach...</p>
                      ) : aiCoachMessages.length === 0 ? (
                        <div className="flex items-center space-x-3 p-3 bg-neutral-700/30 border border-neutral-600/50 rounded-lg">
                          <Info className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-neutral-100 text-sm font-semibold">Todo en Orden</h4>
                            <p className="text-xs text-neutral-300">No hay nuevos mensajes de tu AI Coach por ahora.</p>
                          </div>
                        </div>
                      ) : (
                        aiCoachMessages.slice(0, 3).map((msg) => {
                          let IconComponent = Info;
                          let iconColor = "text-sky-400";
                          let bgColor = "bg-sky-500/10";
                          let borderColor = "border-sky-500/30";

                          switch (msg.message_type.toUpperCase()) {
                            case 'ALERT':
                              IconComponent = AlertTriangle;
                              iconColor = msg.urgency === 'HIGH' ? "text-red-400" : "text-amber-400";
                              bgColor = msg.urgency === 'HIGH' ? "bg-red-500/10" : "bg-amber-500/10";
                              borderColor = msg.urgency === 'HIGH' ? "border-red-500/30" : "border-amber-500/30";
                              break;
                            case 'RECOMMENDATION':
                              IconComponent = Lightbulb;
                              iconColor = "text-lime-400";
                              bgColor = "bg-lime-500/10";
                              borderColor = "border-lime-500/30";
                              break;
                            case 'PRAISE':
                              IconComponent = Award;
                              iconColor = "text-emerald-400";
                              bgColor = "bg-emerald-500/10";
                              borderColor = "border-emerald-500/30";
                              break;
                            case 'MOTIVATION':
                              IconComponent = CheckCircle2;
                              iconColor = "text-teal-400";
                              bgColor = "bg-teal-500/10";
                              borderColor = "border-teal-500/30";
                              break;
                            case 'WARNING':
                              IconComponent = MessageCircleWarning; 
                              iconColor = "text-yellow-400";
                              bgColor = "bg-yellow-500/10";
                              borderColor = "border-yellow-500/30";
                              break;
                            case 'ERROR':
                              IconComponent = AlertTriangle;
                              iconColor = "text-red-500";
                              bgColor = "bg-red-600/10";
                              borderColor = "border-red-600/30";
                              break;
                            case 'INFO':
                            default:
                              IconComponent = Info;
                              iconColor = "text-sky-400";
                              bgColor = "bg-sky-500/10";
                              borderColor = "border-sky-500/30";
                              break;
                          }
                          
                          const timeSince = (date: string) => {
                            const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
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
                            return Math.floor(seconds) + (Math.floor(seconds) === 1 ? " seg" : " segs");
                          };

                          return (
                            <div key={msg.id} className={`flex items-start space-x-3 p-3 ${bgColor} border ${borderColor} rounded-lg shadow-sm`}>
                              <IconComponent className={`w-5 h-5 ${iconColor} mt-0.5 flex-shrink-0`} />
                              <div className="flex-1">
                                {msg.title && <h4 className={`text-neutral-100 text-sm font-semibold mb-0.5 ${msg.read_at ? 'opacity-70' : ''}`}>{msg.title}</h4>}
                                <p className={`text-xs ${msg.read_at ? 'text-neutral-400' : 'text-neutral-200'} ${msg.title ? '' : 'font-semibold'}`}>{msg.body}</p>
                                <div className="flex items-center justify-between mt-1.5">
                                  <p className={`text-xs ${msg.read_at ? 'text-neutral-500' : 'text-neutral-400'}`}>Hace {timeSince(msg.created_at)}</p>
                                  {msg.deep_link && (
                                    <button 
                                      onClick={() => navigate(msg.deep_link!)}
                                      className={`flex items-center text-xs ${iconColor.replace('text-', 'hover:text-')} underline hover:no-underline transition-colors`}
                                    >
                                      Ver más <LinkIcon size={12} className="ml-1" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {!msg.read_at && <BellRing size={14} className={`${iconColor} opacity-70 animate-pulse`} />}
                            </div>
                          );
                        })
                      )}
                      {aiCoachMessages.length > 3 && (
                        <button 
                          onClick={() => navigate("/notifications-page")}
                          className="w-full text-xs text-center text-brand-violet hover:text-brand-violet/80 underline hover:no-underline mt-2"
                        >
                          Ver todos los mensajes ({aiCoachMessages.length})
                        </button>
                      )}
                    </div>
                  </StyledContentBox>

                  {/* Fin de Mensajes del AI Coach StyledContentBox */}

                  {/* Accesos Rápidos - Direct Title */}
                  <div>
                    <h3 
                      className={`
                        text-base font-semibold text-neutral-100 
                        mb-3 sm:mb-4 
                        pb-2 border-b border-neutral-700/70
                      `}
                    >
                      Accesos Rápidos
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { icon: Dumbbell, label: "Registrar Entrenamiento", color: "text-sky-400", onClick: () => navigate("/training-log-page") },
                        { icon: Utensils, label: "Plan Nutricional", color: "text-emerald-400", onClick: () => navigate("/nutrition-log-page") },
                        { icon: BarChart3, label: "Ver Biométricas", color: "text-purple-400", onClick: () => navigate("/biometric-log-page") },
                        { icon: Bot, label: "Chat con AI Coach", color: "text-brand-violet", onClick: () => navigate("/chat-page") },
                      ].map((item, index) => (
                        <button 
                          key={index} 
                          onClick={item.onClick}
                          className={`
                            flex items-center justify-between w-full p-3 
                            bg-neutral-700/40 hover:bg-neutral-600/70 
                            border border-neutral-600/80 hover:border-neutral-500/90
                            rounded-lg text-left text-sm font-medium text-neutral-200 
                            transition-all duration-200 ease-in-out group
                          `}
                        >
                          <div className="flex items-center">
                            <item.icon size={18} className={`mr-2.5 flex-shrink-0 ${item.color}`} />
                            {item.label}
                          </div>
                          <ChevronRight size={16} className={`text-neutral-500 group-hover:text-neutral-300 transition-colors ${item.color.replace("text-", "group-hover:text-")}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Fin de Accesos Rápidos - Direct Title */}
                </div>
              </div>
            </div>
          </TabsContent>
          {/* Placeholder for other TabsContent if needed in future */}
          <TabsContent value="analiticas"><p className="text-center text-neutral-500 py-12">Contenido de Analíticas (Próximamente)</p></TabsContent>
          <TabsContent value="reportes"><p className="text-center text-neutral-500 py-12">Contenido de Reportes (Próximamente)</p></TabsContent>
          <TabsContent value="notificaciones"><p className="text-center text-neutral-500 py-12">Contenido de Notificaciones (Próximamente)</p></TabsContent>
        </Tabs>

      </header>
    </div>
  );
};

// El componente exportado ahora es el que envuelve el contenido con ProtectedRoute
const DashboardPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
};

export default DashboardPage;
