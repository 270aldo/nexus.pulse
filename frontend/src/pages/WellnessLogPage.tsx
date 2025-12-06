import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DashboardCard from "@/components/DashboardCard";
import ProtectedRoute from "../components/ProtectedRoute"; // Importar ProtectedRoute
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, PlusCircle, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react"; // Added useEffect
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { supabase, fetchWellnessDataForDashboard, WellnessData } from "../utils/supabaseClient"; // Added Supabase client and new function
import { useAppContext } from "../components/AppProvider"; // Added AppContext
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Definiciones de Tipos e Interfaces
export type ActivityType = 
  | "meditacion"
  | "respiracion"
  | "lectura"
  | "ejercicio_cognitivo"
  | "escritura_diario"
  | "otro";

export type MobilityActivityType =
  | "yoga"
  | "estiramientos_dinamicos"
  | "estiramientos_estaticos"
  | "foam_roller"
  | "terapia_manual"
  | "otro_movilidad";

interface WellnessEntry {
  id: string;
  date: Date;
  activityType: ActivityType;
  duration: number; // en minutos
  stressLevel?: number; // Escala 1-5 o 1-10
  moodLevel?: number; // Escala 1-5 o 1-10
  notes?: string;
}

// No necesitamos una interfaz separada para MobilitySessionEntry si los campos son similares
// y se distinguen por el tipo de actividad y la tabla de destino.
// Sin embargo, para claridad en el backend y potencial divergencia, las tablas separadas son buenas.

const activityTypeTranslations: Record<ActivityType, string> = {
  meditacion: "Meditación",
  respiracion: "Ejercicio de Respiración",
  lectura: "Lectura",
  ejercicio_cognitivo: "Ejercicio Cognitivo",
  escritura_diario: "Escritura / Diario",
  otro: "Otro",
};

const mobilityActivityTranslations: Record<MobilityActivityType, string> = {
  yoga: "Yoga",
  estiramientos_dinamicos: "Estiramientos Dinámicos",
  estiramientos_estaticos: "Estiramientos Estáticos",
  foam_roller: "Foam Roller / Auto-liberación Miofascial",
  terapia_manual: "Terapia Manual (Masaje, etc.)",
  otro_movilidad: "Otra Actividad de Movilidad",
};


const WellnessLogPageContent = () => { // Renombrar el contenido original
  const navigate = useNavigate();
  const { session } = useAppContext(); // Get session
  const [isSaving, setIsSaving] = useState(false); // Saving state
  const [isLoadingEntries, setIsLoadingEntries] = useState(false); // Loading state for entries
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [logType, setLogType] = useState<"bienestar" | "movilidad">("bienestar");

  // Estados para el formulario de Bienestar
  const [currentActivityType, setCurrentActivityType] = useState<ActivityType>("meditacion");
  const [currentDuration, setCurrentDuration] = useState<string>("");
  const [currentStressLevel, setCurrentStressLevel] = useState<number | undefined>(undefined);
  const [currentMoodLevel, setCurrentMoodLevel] = useState<number | undefined>(undefined);
  const [currentNotes, setCurrentNotes] = useState<string>("");

  // Estados para el formulario de Movilidad
  const [currentMobilityActivityType, setCurrentMobilityActivityType] = useState<MobilityActivityType>("yoga");
  const [currentMobilityDuration, setCurrentMobilityDuration] = useState<string>("");
  const [currentMobilityNotes, setCurrentMobilityNotes] = useState<string>("");


  const [wellnessEntries, setWellnessEntries] = useState<WellnessEntry[]>([]); // Para almacenar las entradas del día

  // State for the new dashboard
  const [wellnessDashboardData, setWellnessDashboardData] = useState<WellnessData[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);


  // TODO: Handlers para añadir, editar, eliminar entradas

  // Effect to load entries when date or user changes
  useEffect(() => {
    const fetchWellnessEntries = async () => {
      if (!selectedDate || !session?.user) {
        setWellnessEntries([]);
        return;
      }

      setIsLoadingEntries(true);
      const userId = session.user.id;
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      try {
        const { data, error } = await supabase
          .from("registros_bienestar")
          .select("*, id") // Ensure 'id' is explicitly selected if needed for keys
          .eq("user_id", userId)
          .eq("fecha_actividad", formattedDate)
          .order("created_at", { ascending: true }); // Or order by another relevant field like time if available

        if (error) {
          console.error("Error fetching wellness entries:", error);
          toast.error(`Error al cargar las actividades: ${error.message}`);
          setWellnessEntries([]);
        } else {
          const loadedEntries: WellnessEntry[] = data ? data.map(entry => ({
            id: entry.id, // Supabase provides 'id' by default for every table
            date: new Date(entry.fecha_actividad + 'T00:00:00'), // Ensure date is parsed correctly
            activityType: entry.tipo_actividad as ActivityType,
            duration: entry.duracion_minutos,
            stressLevel: entry.nivel_estres,
            moodLevel: entry.nivel_animo,
            notes: entry.notas_bienestar,
          })) : [];
          setWellnessEntries(loadedEntries);
          if (loadedEntries.length > 0) {
            // toast.success("Actividades del día cargadas."); // Can be a bit noisy if called every time
          } else {
            // toast.info("No hay actividades registradas para esta fecha.");
          }
        }
      } catch (error: any) {
        console.error("Error completo en fetchWellnessEntries:", error);
        toast.error(error.message || "Ocurrió un error desconocido al cargar actividades.");
        setWellnessEntries([]);
      } finally {
        setIsLoadingEntries(false);
      }
    };

    fetchWellnessEntries();
  }, [selectedDate, session?.user?.id]);

  // Effect to load data for the wellness dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!session?.user?.id) {
        setIsDashboardLoading(false);
        setWellnessDashboardData([]);
        return;
      }
      setIsDashboardLoading(true);
      setDashboardError(null);
      try {
        const data = await fetchWellnessDataForDashboard(session.user.id);
        setWellnessDashboardData(data);
      } catch (error: any) {
        console.error("Error fetching wellness dashboard data:", error);
        setDashboardError(error.message || "Error al cargar datos del dashboard.");
        toast.error(error.message || "Error al cargar datos del dashboard de bienestar.");
      }
      setIsDashboardLoading(false);
    };

    loadDashboardData();
  }, [session?.user?.id]);


  const handleSubmit = async () => {
    if (!session?.user) {
      toast.error("Debes iniciar sesión para guardar.");
      return;
    }
    if (!selectedDate) {
      toast.error("Por favor, selecciona una fecha.");
      return;
    }

    setIsSaving(true);
    const userId = session.user.id;
    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    if (logType === "bienestar") {
      if (!currentDuration) {
          toast.error("La duración es obligatoria para actividades de bienestar.");
          setIsSaving(false);
          return;
      }
      const durationInMinutes = parseInt(currentDuration, 10);
      if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
        toast.error("La duración debe ser un número positivo.");
        setIsSaving(false);
        return;
      }

      try {
        const { error } = await supabase
          .from("registros_bienestar")
          .insert({
            user_id: userId,
            fecha_actividad: formattedDate,
            tipo_actividad: currentActivityType,
            duracion_minutos: durationInMinutes,
            nivel_estres: currentStressLevel,
            nivel_animo: currentMoodLevel,
            notas_bienestar: currentNotes,
          });

        if (error) {
          console.error("Error inserting into registros_bienestar:", error);
          throw new Error(`Error al guardar actividad de bienestar: ${error.message}`);
        }

        toast.success("Actividad de bienestar registrada.");
        setCurrentActivityType("meditacion"); // Reset to default
        setCurrentDuration("");
        setCurrentStressLevel(undefined);
        setCurrentMoodLevel(undefined);
        setCurrentNotes("");
        // TODO: Reload wellness entries for the day if needed
      } catch (error: any) {
        console.error("Error en handleSubmit (Bienestar):", error);
        toast.error(error.message || "Error al guardar actividad de bienestar.");
      } finally {
        setIsSaving(false);
      }

    } else if (logType === "movilidad") {
      if (!currentMobilityDuration) {
        toast.error("La duración es obligatoria para sesiones de movilidad.");
        setIsSaving(false);
        return;
      }
      const durationInMinutes = parseInt(currentMobilityDuration, 10);
      if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
        toast.error("La duración debe ser un número positivo.");
        setIsSaving(false);
        return;
      }

      try {
        const { error } = await supabase
          .from("sesiones_movilidad") // Tabla correcta para movilidad
          .insert({
            user_id: userId,
            fecha_sesion: formattedDate, // Asegúrate que el nombre de columna sea correcto
            tipo_actividad_movilidad: currentMobilityActivityType,
            duracion_minutos: durationInMinutes,
            notas_sesion: currentMobilityNotes, // Asegúrate que el nombre de columna sea correcto
          });

        if (error) {
          console.error("Error inserting into sesiones_movilidad:", error);
          throw new Error(`Error al guardar sesión de movilidad: ${error.message}`);
        }

        toast.success("Sesión de movilidad registrada.");
        setCurrentMobilityActivityType("yoga"); // Reset to default
        setCurrentMobilityDuration("");
        setCurrentMobilityNotes("");
        // No se llama a fetchWellnessEntries aquí, ya que es específico para bienestar.
        // La carga de sesiones de movilidad se manejaría por separado si se muestran en esta página.
      } catch (error: any) {
        console.error("Error en handleSubmit (Movilidad):", error);
        toast.error(error.message || "Error al guardar sesión de movilidad.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteEntry = async (id: string) => { // Make async for Supabase
    if (!session?.user) {
      toast.error("Debes iniciar sesión para eliminar actividades.");
      return;
    }
    // Optimistic update (optional, but good for UX)
    // const previousEntries = [...wellnessEntries];
    // setWellnessEntries(prev => prev.filter(entry => entry.id !== id));

    // toast.info("Eliminación de la base de datos pendiente de implementación completa.");
    // For now, we will directly try to delete from Supabase and then reload.
    try {
      setIsLoadingEntries(true); // Use same loader for quick operations
      const { error } = await supabase
        .from("registros_bienestar")
        .delete()
        .match({ id: id, user_id: session.user.id }); // Ensure user can only delete their own

      if (error) {
        console.error("Error deleting wellness entry:", error);
        // setWellnessEntries(previousEntries); // Revert optimistic update if there was one
        throw new Error(`Error al eliminar la actividad: ${error.message}`);
      }

      toast.success("Actividad eliminada correctamente.");
      // Refresh entries for the current day
      if (selectedDate && session?.user) {
        const updatedEntries = await supabase
            .from("registros_bienestar")
            .select("*, id")
            .eq("user_id", session.user.id)
            .eq("fecha_actividad", format(selectedDate, "yyyy-MM-dd"))
            .order("created_at", { ascending: true });
        if (updatedEntries.data) {
            const loadedEntries: WellnessEntry[] = updatedEntries.data.map(entry => ({
                id: entry.id,
                date: new Date(entry.fecha_actividad + 'T00:00:00'),
                activityType: entry.tipo_actividad as ActivityType,
                duration: entry.duracion_minutos,
                stressLevel: entry.nivel_estres,
                moodLevel: entry.nivel_animo,
                notes: entry.notas_bienestar,
            }));
            setWellnessEntries(loadedEntries);
        }
      }
    } catch (error: any) {
      console.error("Error completo en handleDeleteEntry:", error);
      toast.error(error.message || "Ocurrió un error desconocido al eliminar.");
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const getStressMoodLabel = (level: number | undefined, type: 'stress' | 'mood'): string => {
    if (level === undefined) return "N/A";
    const stressLabels = ["Muy Bajo", "Bajo", "Moderado", "Alto", "Muy Alto"];
    const moodLabels = ["Muy Negativo", "Negativo", "Neutral", "Positivo", "Muy Positivo"];
    const labels = type === 'stress' ? stressLabels : moodLabels;
    return labels[level-1] || "N/A";
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-neutral-100 p-4 sm:p-6 lg:p-8 font-sans ${isLoadingEntries ? 'opacity-70 pointer-events-none' : ''}`}>
      {isLoadingEntries && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-violet"></div>
          <p className="ml-4 text-xl text-brand-violet/80">Cargando actividades...</p>
        </div>
      )}
      <Toaster richColors position="bottom-right" />
      <header className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)} // O una ruta específica como "/dashboard"
          className="text-brand-violet hover:text-brand-violet/90 mb-4 px-0 hover:bg-transparent"
        >
          <ChevronLeft size={20} className="mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-violet via-purple-600 to-fuchsia-600">
          Registro de Bienestar y Cognición
        </h1>
        <p className="text-neutral-400 mt-2 text-sm sm:text-base">
          Dedica un momento a registrar tus actividades de bienestar y cómo te sientes.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna de Registro */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardCard 
            title="Registrar Nueva Actividad"
            titleClassName="text-xl text-brand-violet"
          >
            <div className="space-y-6 p-2">
              {/* Selector de Tipo de Log */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-neutral-300 block mb-2.5">¿Qué tipo de actividad quieres registrar?</Label>
                <RadioGroup
                  value={logType}
                  onValueChange={(value: "bienestar" | "movilidad") => {
                    setLogType(value);
                    // Resetear formularios al cambiar de tipo para evitar confusión de datos
                    setCurrentDuration("");
                    setCurrentStressLevel(undefined);
                    setCurrentMoodLevel(undefined);
                    setCurrentNotes("");
                    setCurrentMobilityDuration("");
                    setCurrentMobilityNotes("");
                  }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-md bg-neutral-700/50 border border-transparent has-[:checked]:border-brand-violet has-[:checked]:bg-brand-violet/10 transition-all">
                    <RadioGroupItem value="bienestar" id="logTypeBienestar" className="text-brand-violet border-neutral-600 focus:ring-brand-violet" />
                    <Label htmlFor="logTypeBienestar" className="text-sm font-normal text-neutral-200 cursor-pointer select-none">
                      Actividad de Bienestar General
                      <p className="text-xs text-neutral-400">Meditación, lectura, estado de ánimo, etc.</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-md bg-neutral-700/50 border border-transparent has-[:checked]:border-brand-violet has-[:checked]:bg-brand-violet/10 transition-all">
                    <RadioGroupItem value="movilidad" id="logTypeMovilidad" className="text-brand-violet border-neutral-600 focus:ring-brand-violet" />
                    <Label htmlFor="logTypeMovilidad" className="text-sm font-normal text-neutral-200 cursor-pointer select-none">
                      Sesión de Movilidad / Recuperación Activa
                      <p className="text-xs text-neutral-400">Yoga, estiramientos, foam roller, etc.</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Selector de Fecha */}
              <div className="w-full sm:w-auto">
                <Label htmlFor="activityDate" className="text-xs font-medium text-neutral-400 block mb-1.5">Fecha de la Actividad</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal h-10 bg-neutral-700/70 border-neutral-600 hover:bg-neutral-600/70 hover:text-neutral-100 focus:ring-1 focus:ring-brand-violet ${!selectedDate && "text-neutral-500"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-brand-violet" />
                      {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span className="text-neutral-400">Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700 shadow-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      locale={es}
                      className="text-neutral-200"
                      classNames={{
                        day_selected: "bg-brand-violet text-white hover:bg-brand-violet/90 focus:bg-brand-violet focus:text-white",
                        day_today: "text-brand-violet border-brand-violet",
                        head_cell: "text-neutral-400 font-semibold",
                        nav_button: "text-brand-violet hover:text-brand-violet/90 hover:bg-neutral-700/50",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>


              {/* --- INICIO FORMULARIO BIENESTAR --- */}
              {logType === "bienestar" && (
                <>
                  {/* Tipo de Actividad */}
                  <div>
                    <Label htmlFor="activityType" className="text-xs font-medium text-neutral-400 block mb-1.5">Tipo de Actividad de Bienestar</Label>
                    <Select value={currentActivityType} onValueChange={(value) => setCurrentActivityType(value as ActivityType)}>
                      <SelectTrigger id="activityType" className="bg-neutral-700/70 border-neutral-600 focus:ring-1 focus:ring-brand-violet h-10">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100">
                        <SelectGroup>
                          <SelectLabel className="text-neutral-400">Actividades Comunes</SelectLabel>
                          {Object.entries(activityTypeTranslations).map(([key, value]) => (
                            <SelectItem key={key} value={key} className="hover:bg-neutral-700 focus:bg-neutral-700">
                              {value}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duración Bienestar */}
                  <div>
                    <Label htmlFor="durationBienestar" className="text-xs font-medium text-neutral-400 block mb-1.5">Duración (minutos)</Label>
                    <Input 
                      type="number"
                      id="durationBienestar"
                      value={currentDuration} // Usar currentDuration para bienestar
                      onChange={(e) => setCurrentDuration(e.target.value)}
                      placeholder="Ej: 30"
                      min="1"
                      className="bg-neutral-700/70 border-neutral-600 focus:ring-1 focus:ring-brand-violet h-10"
                    />
                  </div>
                  
                  {/* Nivel de Estrés */}
                  <div>
                    <Label className="text-xs font-medium text-neutral-400 block mb-2">Nivel de Estrés Percibido</Label>
                    <RadioGroup
                      value={currentStressLevel?.toString()} // RadioGroup value is string
                      onValueChange={(value) => setCurrentStressLevel(value ? parseInt(value) : undefined)}
                      className="flex flex-wrap gap-x-4 gap-y-2"
                    >
                      {[1, 2, 3, 4, 5].map((level) => {
                        const labels = ["Muy Bajo", "Bajo", "Moderado", "Alto", "Muy Alto"];
                        return (
                          <div key={`stress-${level}`} className="flex items-center space-x-2">
                            <RadioGroupItem value={level.toString()} id={`stress-${level}`} className="text-brand-violet border-neutral-600 focus:ring-brand-violet" />
                            <Label htmlFor={`stress-${level}`} className="text-sm font-normal text-neutral-300 cursor-pointer">{labels[level-1]}</Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  {/* Nivel de Ánimo */}
                  <div>
                    <Label className="text-xs font-medium text-neutral-400 block mb-2">Estado de Ánimo General</Label>
                    <RadioGroup
                      value={currentMoodLevel?.toString()} // RadioGroup value is string
                      onValueChange={(value) => setCurrentMoodLevel(value ? parseInt(value) : undefined)}
                      className="flex flex-wrap gap-x-4 gap-y-2"
                    >
                      {[1, 2, 3, 4, 5].map((level) => {
                        const labels = ["Muy Negativo", "Negativo", "Neutral", "Positivo", "Muy Positivo"];
                        return (
                          <div key={`mood-${level}`} className="flex items-center space-x-2">
                            <RadioGroupItem value={level.toString()} id={`mood-${level}`} className="text-brand-violet border-neutral-600 focus:ring-brand-violet" />
                            <Label htmlFor={`mood-${level}`} className="text-sm font-normal text-neutral-300 cursor-pointer">{labels[level-1]}</Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  {/* Notas Bienestar */}
                  <div>
                    <Label htmlFor="notesBienestar" className="text-xs font-medium text-neutral-400 block mb-1.5">Notas Adicionales / Reflexión</Label>
                    <Textarea 
                      id="notesBienestar"
                      value={currentNotes} // Usar currentNotes para bienestar
                      onChange={(e) => setCurrentNotes(e.target.value)}
                      placeholder="Escribe aquí tus pensamientos, sensaciones, o detalles adicionales sobre la actividad..."
                      className="bg-neutral-700/70 border-neutral-600 focus:ring-1 focus:ring-brand-violet min-h-[100px]"
                    />
                  </div>
                </>
              )}
              {/* --- FIN FORMULARIO BIENESTAR --- */}

              {/* --- INICIO FORMULARIO MOVILIDAD --- */}
              {logType === "movilidad" && (
                <>
                  {/* Tipo de Actividad de Movilidad */}
                  <div>
                    <Label htmlFor="mobilityActivityType" className="text-xs font-medium text-neutral-400 block mb-1.5">Tipo de Actividad de Movilidad</Label>
                    <Select value={currentMobilityActivityType} onValueChange={(value) => setCurrentMobilityActivityType(value as MobilityActivityType)}>
                      <SelectTrigger id="mobilityActivityType" className="bg-neutral-700/70 border-neutral-600 focus:ring-1 focus:ring-brand-violet h-10">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100">
                        <SelectGroup>
                          <SelectLabel className="text-neutral-400">Actividades Comunes de Movilidad</SelectLabel>
                          {Object.entries(mobilityActivityTranslations).map(([key, value]) => (
                            <SelectItem key={key} value={key} className="hover:bg-neutral-700 focus:bg-neutral-700">
                              {value}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duración Movilidad */}
                  <div>
                    <Label htmlFor="durationMovilidad" className="text-xs font-medium text-neutral-400 block mb-1.5">Duración (minutos)</Label>
                    <Input 
                      type="number"
                      id="durationMovilidad"
                      value={currentMobilityDuration} // Usar currentMobilityDuration para movilidad
                      onChange={(e) => setCurrentMobilityDuration(e.target.value)}
                      placeholder="Ej: 20"
                      min="1"
                      className="bg-neutral-700/70 border-neutral-600 focus:ring-1 focus:ring-brand-violet h-10"
                    />
                  </div>

                  {/* Notas Movilidad */}
                  <div>
                    <Label htmlFor="notesMovilidad" className="text-xs font-medium text-neutral-400 block mb-1.5">Notas Adicionales (Foco, Sensaciones, etc.)</Label>
                    <Textarea 
                      id="notesMovilidad"
                      value={currentMobilityNotes} // Usar currentMobilityNotes para movilidad
                      onChange={(e) => setCurrentMobilityNotes(e.target.value)}
                      placeholder="Describe brevemente la sesión, qué trabajaste, cómo te sentiste..."
                      className="bg-neutral-700/70 border-neutral-600 focus:ring-1 focus:ring-brand-violet min-h-[100px]"
                    />
                  </div>
                </>
              )}
              {/* --- FIN FORMULARIO MOVILIDAD --- */}
              
              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button 
                  onClick={handleSubmit} 
                  className="w-full sm:flex-grow bg-brand-violet hover:bg-brand-violet/90 text-white disabled:opacity-70"
                  disabled={isSaving || (logType === 'bienestar' && !currentDuration) || (logType === 'movilidad' && !currentMobilityDuration)}
                >
                  <PlusCircle size={18} className="mr-2" />
                  {logType === 'bienestar' ? 'Registrar Actividad de Bienestar' : 'Registrar Sesión de Movilidad'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (logType === 'bienestar') {
                      setCurrentActivityType("meditacion");
                      setCurrentDuration("");
                      setCurrentStressLevel(undefined);
                      setCurrentMoodLevel(undefined);
                      setCurrentNotes("");
                    } else if (logType === 'movilidad') {
                      setCurrentMobilityActivityType("yoga");
                      setCurrentMobilityDuration("");
                      setCurrentMobilityNotes("");
                    }
                    toast.info("Formulario limpiado.");
                  }}
                  className="w-full sm:w-auto border-neutral-600 text-neutral-300 hover:bg-neutral-700/30 hover:text-neutral-100"
                >
                  Limpiar Campos
                </Button>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Columna de Entradas Registradas (Resumen) */}
        <div className="lg:col-span-1 space-y-6">
          <DashboardCard 
            title="Actividades del Día"
            titleClassName="text-xl text-brand-violet"
          >
            <div className="p-2 space-y-3">
              {/* Aquí se listarán las entradas de wellnessEntries para selectedDate */}
              {isLoadingEntries && wellnessEntries.length === 0 && <p className="text-sm text-neutral-500">Cargando actividades...</p>}
              {!isLoadingEntries && wellnessEntries.length === 0 && (
                 <p className="text-sm text-neutral-500">
                   No hay actividades registradas para {selectedDate ? format(selectedDate, "PPP", { locale: es }) : 'hoy'}.
                 </p>
              )}
              {wellnessEntries.length > 0 && (
                <p className="text-sm text-neutral-400 mb-3">
                  Actividades registradas para {selectedDate ? format(selectedDate, "PPP", { locale: es }) : 'hoy'}:
                </p>
              )}
              {wellnessEntries
                // .filter(e => selectedDate && format(e.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")) // No longer needed as useEffect filters
                .map(entry => (
                  <div key={entry.id} className="p-3 border border-neutral-700 rounded-lg bg-neutral-800/60 shadow-sm hover:border-neutral-600 transition-colors duration-150">
                    <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-semibold text-brand-violet text-base">{activityTypeTranslations[entry.activityType]}</h3>
                        <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-red-500 h-7 w-7 -mt-1 -mr-1" onClick={() => handleDeleteEntry(entry.id)}>
                            <Trash2 size={16} />
                        </Button>
                    </div>
                    <p className="text-sm text-neutral-300 mb-1">Duración: <span className="font-medium">{entry.duration} min</span></p>
                    {entry.stressLevel !== undefined && (
                        <p className="text-xs text-neutral-400">Estrés: <span className="text-neutral-300">{getStressMoodLabel(entry.stressLevel, 'stress')}</span></p>
                    )}
                    {entry.moodLevel !== undefined && (
                        <p className="text-xs text-neutral-400">Ánimo: <span className="text-neutral-300">{getStressMoodLabel(entry.moodLevel, 'mood')}</span></p>
                    )}
                    {entry.notes && (
                        <p className="text-xs text-neutral-400 mt-1 pt-1 border-t border-neutral-700/70">Nota: <span className="text-neutral-300 italic">{entry.notes}</span></p>
                    )}
                  </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Wellness Dashboard Section */}
      <div className="my-8">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-200 mb-4 pb-2 border-b border-neutral-700/80">
          Tu Resumen de Bienestar (Últimos 7 Días)
        </h2>
        {isDashboardLoading && (
          <div className="flex items-center justify-center h-64 bg-neutral-800/50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-violet"></div>
            <p className="ml-3 text-neutral-400">Cargando datos del dashboard...</p>
          </div>
        )}
        {!isDashboardLoading && dashboardError && (
          <div className="p-4 text-center text-red-400 bg-red-900/30 rounded-lg">
            <p>{dashboardError}</p>
          </div>
        )}
        {!isDashboardLoading && !dashboardError && wellnessDashboardData.length === 0 && (
          <div className="p-4 text-center text-neutral-500 bg-neutral-800/50 rounded-lg">
            <p>No hay suficientes datos para mostrar el resumen de bienestar.</p>
          </div>
        )}
        {!isDashboardLoading && !dashboardError && wellnessDashboardData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-neutral-800/60 border-neutral-700/70 shadow-lg hover:border-neutral-600/90 transition-all">
              <CardHeader className="pb-2 border-b border-neutral-700/50">
                <CardTitle className="text-base font-medium text-brand-violet">Tendencia de Ánimo</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={wellnessDashboardData}
                    margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#6b7280"/>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(tick) => format(new Date(tick + 'T00:00:00'), "d MMM", { locale: es })}
                      stroke="#9ca3af" 
                      fontSize={12} 
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      domain={[1, 5]} // Assuming mood is 1-5 scale
                      tickCount={5}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} 
                      labelStyle={{ color: '#e5e7eb'}} 
                      itemStyle={{ color: '#c084fc'}}
                      formatter={(value: number) => [value.toFixed(1), "Promedio Ánimo"]}
                    />
                    <Legend wrapperStyle={{fontSize: "12px", color: "#d1d5db"}}/>
                    <Line type="monotone" dataKey="avg_mood" name="Ánimo Promedio" stroke="#c084fc" strokeWidth={2} dot={{ r: 4, fill: '#c084fc' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Stress Chart */}
            <Card className="bg-neutral-800/60 border-neutral-700/70 shadow-lg hover:border-neutral-600/90 transition-all">
              <CardHeader className="pb-2 border-b border-neutral-700/50">
                <CardTitle className="text-base font-medium text-brand-violet">Niveles de Estrés</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={wellnessDashboardData}
                    margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#6b7280"/>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(tick) => format(new Date(tick + 'T00:00:00'), "d MMM", { locale: es })}
                      stroke="#9ca3af" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      domain={[1, 5]} // Assuming stress is 1-5 scale
                      tickCount={5}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} 
                      labelStyle={{ color: '#e5e7eb'}} 
                      itemStyle={{ color: '#f87171'}}
                      formatter={(value: number) => [value.toFixed(1), "Promedio Estrés"]}
                    />
                    <Legend wrapperStyle={{fontSize: "12px", color: "#d1d5db"}}/>
                    <Line type="monotone" dataKey="avg_stress" name="Estrés Promedio" stroke="#f87171" strokeWidth={2} dot={{ r: 4, fill: '#f87171' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Meditation Chart */}
            <Card className="bg-neutral-800/60 border-neutral-700/70 shadow-lg hover:border-neutral-600/90 transition-all">
              <CardHeader className="pb-2 border-b border-neutral-700/50">
                <CardTitle className="text-base font-medium text-brand-violet">Minutos de Mindfulness</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wellnessDashboardData}
                    margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#6b7280"/>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(tick) => format(new Date(tick + 'T00:00:00'), "d MMM", { locale: es })}
                      stroke="#9ca3af" 
                      fontSize={12}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false}/>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} 
                      labelStyle={{ color: '#e5e7eb'}} 
                      itemStyle={{ color: '#60a5fa'}}
                      formatter={(value: number) => [value, "Minutos Meditación"]}
                    />
                    <Legend wrapperStyle={{fontSize: "12px", color: "#d1d5db"}}/>
                    <Bar dataKey="total_meditation_minutes" name="Meditación" fill="#60a5fa" radius={[4, 4, 0, 0]}>
                      {wellnessDashboardData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.total_meditation_minutes && entry.total_meditation_minutes > 0 ? "#60a5fa" : "#374151"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {/* End Wellness Dashboard Section */}

    </div>
  );
};

// El componente exportado ahora es el que envuelve el contenido con ProtectedRoute
const WellnessLogPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <WellnessLogPageContent />
    </ProtectedRoute>
  );
};

export default WellnessLogPage;
