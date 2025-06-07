import React, { useState, useEffect } from 'react';
import DashboardCard from '../components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from "@/components/ui/separator";
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Añadido para los componentes Card
import { format } from 'date-fns'; // For formatting the date
import { es } from 'date-fns/locale'; // For Spanish locale in date formatting
import { ChevronLeft, Save, XCircle, PlusCircle, Trash2, CalendarIcon, BarChart as BarChartIcon } from 'lucide-react'; // Renombrado BarChart de lucide
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'; // Para gráficos
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner'; // Importando Toaster y toast
import { supabase } from "../utils/supabaseClient"; // Supabase client
import { useAppContext } from "../components/AppProvider"; // App context for session
import { subWeeks, startOfWeek, endOfWeek, format as formatDateFns, subDays, startOfDay as startOfDayFns, endOfDay as endOfDayFns } from 'date-fns'; // Para dashboard de entrenamiento

// --- Interfaces y tipos para el Dashboard de Entrenamiento ---
interface WeeklyVolumeDataPoint {
  week: string; // Ej: "Semana Actual", "Hace 1 Semana", o rango de fechas "13-19 May"
  volume: number; // Suma de (series * reps * weight)
}

interface MuscleGroupFrequencyDataPoint {
  name: string; // Nombre del grupo muscular
  value: number; // Número de veces entrenado
  fill: string; // Color para el gráfico
}
// --- Fin Interfaces y tipos para el Dashboard de Entrenamiento ---

// Interfaces para la estructura de datos del entrenamiento
interface ExerciseSet { // Placeholder, se detallará más adelante
  id: string;
  reps?: number;
  weight?: number;
  rpe?: number;
  rest?: number;
  notes?: string;
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  sets: ExerciseSet[];
}

const TrainingLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAppContext(); // Get session from context
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [sessionName, setSessionName] = useState<string>("");
  const [sessionDuration, setSessionDuration] = useState<string>(""); // Kept as string for input, convert to number on save
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [generalNotes, setGeneralNotes] = useState<string>("");
  const [rpeSession, setRpeSession] = useState<number>(7); // Default RPE for session
  const [overallFeeling, setOverallFeeling] = useState<string>(""); // Sensación general

  const [isLoading, setIsLoading] = useState<boolean>(false); // For loading existing data
  const [isSaving, setIsSaving] = useState<boolean>(false); // For saving data
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null); // To track existing session

  // Estados para el Dashboard de Entrenamiento
  const [weeklyVolumeData, setWeeklyVolumeData] = useState<WeeklyVolumeDataPoint[]>([]);
  const [muscleGroupFrequencyData, setMuscleGroupFrequencyData] = useState<MuscleGroupFrequencyDataPoint[]>([]);
  const [isLoadingTrainingDashboardData, setIsLoadingTrainingDashboardData] = useState<boolean>(true);

  // --- Colores para el gráfico de Grupos Musculares (Ejemplo) ---
  const MUSCLE_GROUP_COLORS: Record<string, string> = {
    pecho: '#ef4444',
    espalda: '#22c55e',
    piernas: '#3b82f6',
    hombros: '#eab308',
    biceps: '#f97316',
    triceps: '#8b5cf6',
    core: '#14b8a6',
    cardio: '#64748b',
    otro: '#a1a1aa',
    default: '#71717a'
  };
  // --- Fin Colores ---

  const userIdForEffect = session?.user?.id ?? null;

  // Function to reset form fields
  const resetForm = () => {
    setSessionName("");
    setSessionDuration("");
    setExercises([]);
    setGeneralNotes("");
    setRpeSession(7); // Default RPE
    setOverallFeeling("");
    setLoadedSessionId(null); // Reset loaded session ID
    // selectedDate is managed separately
  };

  // Load training session data when date or user changes
  useEffect(() => {
    const loadTrainingData = async () => {
      if (!selectedDate || !userIdForEffect) {
        resetForm();
        setWeeklyVolumeData([]);
        setMuscleGroupFrequencyData([]);
        setIsLoadingTrainingDashboardData(false);
        return;
      }

      setIsLoading(true);
      setIsLoadingTrainingDashboardData(true);

      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      // >>> Inicia carga de datos de la sesión del día <<<
      try {
        const { data: trainingSession, error: sessionError } = await supabase
          .from("registros_sesion_entrenamiento")
          .select("*")
          .eq("user_id", userIdForEffect)
          .eq("fecha_entrenamiento", formattedDate)
          .maybeSingle();

        if (sessionError) {
          console.error("Error fetching training session:", sessionError);
          toast.error(`Error al cargar la sesión: ${sessionError.message}`);
          resetForm(); 
        } else if (trainingSession) {
          setSessionName(trainingSession.nombre_sesion || "");
          setSessionDuration(trainingSession.duracion_total_minutos?.toString() || "");
          setGeneralNotes(trainingSession.notas_sesion || "");
          setRpeSession(trainingSession.rpe_sesion !== null ? trainingSession.rpe_sesion : 7);
          setOverallFeeling(trainingSession.sensacion_general || "");
          setLoadedSessionId(trainingSession.id);

          const { data: fetchedExercises, error: exercisesError } = await supabase
            .from("ejercicios_sesion")
            .select("id, nombre_ejercicio, grupo_muscular, series, orden_ejercicio")
            .eq("sesion_id", trainingSession.id)
            .order("orden_ejercicio", { ascending: true });

          if (exercisesError) {
            console.error("Error fetching exercises:", exercisesError);
            toast.error(`Error al cargar los ejercicios: ${exercisesError.message}`);
            setExercises([]);
          } else if (fetchedExercises) {
            const transformedExercises: Exercise[] = fetchedExercises.map(ex => ({
              id: ex.id,
              name: ex.nombre_ejercicio,
              muscleGroup: ex.grupo_muscular,
              sets: (ex.series as unknown as ExerciseSet[] || []).map((set, index) => ({ 
                ...set, 
                id: `${ex.id}-set-${index}-${Date.now()}`
              })),
            }));
            setExercises(transformedExercises);
          }
          if(!sessionError && exercisesError) {
            toast.info("Sesión de entrenamiento cargada (con errores en ejercicios).");
          } else if (!sessionError) {
            toast.info("Sesión de entrenamiento cargada.");
          }
        } else {
          resetForm();
        }
      } catch (error: any) {
        console.error("Full error in loadTrainingSessionForDate:", error);
        toast.error(error.message || "Ocurrió un error desconocido al cargar los datos de la sesión.");
        resetForm();
      } finally {
        setIsLoading(false); 
      }
      // >>> Fin carga de datos de la sesión del día <<<

      // >>> Inicio Carga y Procesamiento de Datos para el Dashboard de Entrenamiento <<<
      if (userIdForEffect) {
        try {
          const today = startOfDayFns(selectedDate); 
          const fourWeeksIntervals: { start: Date; end: Date; label: string }[] = [];
          for (let i = 0; i < 4; i++) {
            const targetDate = subWeeks(today, i);
            fourWeeksIntervals.push({
              start: startOfWeek(targetDate, { weekStartsOn: 1 }), 
              end: endOfWeek(targetDate, { weekStartsOn: 1 }),     
              label: `Semana ${formatDateFns(startOfWeek(targetDate, { weekStartsOn: 1 }), 'dd/MM')} - ${formatDateFns(endOfWeek(targetDate, { weekStartsOn: 1 }), 'dd/MM')}`
            });
          }
          fourWeeksIntervals.reverse(); 

          const weeklyVolumesPromises = fourWeeksIntervals.map(async (week) => {
            const { data: sessionsInWeek, error: sessionsError } = await supabase
              .from('registros_sesion_entrenamiento')
              .select('id, fecha_entrenamiento')
              .eq('user_id', userIdForEffect) 
              .gte('fecha_entrenamiento', formatDateFns(week.start, 'yyyy-MM-dd'))
              .lte('fecha_entrenamiento', formatDateFns(week.end, 'yyyy-MM-dd'));

            if (sessionsError) {
              console.error(`Error fetching sessions for week ${week.label}:`, sessionsError);
              return { week: week.label, volume: 0 }; 
            }
            if (!sessionsInWeek || sessionsInWeek.length === 0) {
              return { week: week.label, volume: 0 };
            }

            let totalVolumeForWeek = 0;
            for (const sessionItem of sessionsInWeek) {
              const { data: exercisesInSession, error: exercisesError } = await supabase
                .from('ejercicios_sesion')
                .select('series') 
                .eq('sesion_id', sessionItem.id);

              if (exercisesError) {
                console.error(`Error fetching exercises for session ${sessionItem.id}:`, exercisesError);
                continue; 
              }

              if (exercisesInSession) {
                exercisesInSession.forEach(exercise => {
                  const sets = exercise.series as ExerciseSet[]; 
                  if (Array.isArray(sets)) {
                    sets.forEach(set => {
                      const reps = typeof set.reps === 'number' ? set.reps : 0;
                      const weight = typeof set.weight === 'number' ? set.weight : 0;
                      if (reps > 0 && weight > 0) { 
                        totalVolumeForWeek += reps * weight;
                      }
                    });
                  }
                });
              }
            }
            return { week: week.label, volume: totalVolumeForWeek };
          });
          
          const calculatedWeeklyVolumes = await Promise.all(weeklyVolumesPromises);
          setWeeklyVolumeData(calculatedWeeklyVolumes);

          const thirtyDaysAgo = startOfDayFns(subDays(selectedDate, 29)); 
          const endDateForFrequency = endOfDayFns(selectedDate);

          const { data: sessionsForFrequency, error: freqSessionsError } = await supabase
            .from('registros_sesion_entrenamiento')
            .select('id')
            .eq('user_id', userIdForEffect) 
            .gte('fecha_entrenamiento', formatDateFns(thirtyDaysAgo, 'yyyy-MM-dd'))
            .lte('fecha_entrenamiento', formatDateFns(endDateForFrequency, 'yyyy-MM-dd'));

          const muscleGroupCounts: Record<string, number> = {};

          if (freqSessionsError) {
            console.error("Error fetching sessions for frequency chart:", freqSessionsError);
            setMuscleGroupFrequencyData([]);
          } else if (sessionsForFrequency && sessionsForFrequency.length > 0) {
            for (const sessionItem of sessionsForFrequency) {
              const { data: exercisesInSessionFreq, error: exercisesFreqError } = await supabase
                .from('ejercicios_sesion')
                .select('grupo_muscular') 
                .eq('sesion_id', sessionItem.id);

              if (exercisesFreqError) {
                console.error(`Error fetching exercises for session (freq) ${sessionItem.id}:`, exercisesFreqError);
                continue;
              }
              if (exercisesInSessionFreq) {
                exercisesInSessionFreq.forEach(exercise => {
                  const group = exercise.grupo_muscular as string | undefined;
                  if (group && group.trim() !== "") {
                    muscleGroupCounts[group] = (muscleGroupCounts[group] || 0) + 1;
                  }
                });
              }
            }
            const formattedFrequencyData: MuscleGroupFrequencyDataPoint[] = Object.entries(muscleGroupCounts).map(([name, value]) => ({
              name,
              value,
              fill: MUSCLE_GROUP_COLORS[name.toLowerCase()] || MUSCLE_GROUP_COLORS.default,
            }));
            setMuscleGroupFrequencyData(formattedFrequencyData);
          } else {
            setMuscleGroupFrequencyData([]);
          }

        } catch (dashboardError: any) {
          console.error("Error processing training dashboard data:", dashboardError);
          toast.error("Error al cargar datos del dashboard de entrenamiento.");
          setWeeklyVolumeData([]);
          setMuscleGroupFrequencyData([]);
        } finally {
          setIsLoadingTrainingDashboardData(false); 
        }
      } else {
        setWeeklyVolumeData([]);
        setMuscleGroupFrequencyData([]);
        setIsLoadingTrainingDashboardData(false);
      }
    };

    loadTrainingData();
  }, [selectedDate, userIdForEffect]); // Rerun on date or user change



  const addExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: "",
      muscleGroup: undefined,
      sets: [], // Inicialmente sin series, se añadirán dinámicamente después
    };
    setExercises(prevExercises => [...prevExercises, newExercise]);
  };

  const deleteExercise = (exerciseId: string) => {
    setExercises(prevExercises => prevExercises.filter(ex => ex.id !== exerciseId));
  };

  const handleExerciseInputChange = (exerciseId: string, fieldName: keyof Exercise, value: string) => {
    setExercises(prevExercises =>
      prevExercises.map(ex =>
        ex.id === exerciseId ? { ...ex, [fieldName]: value } : ex
      )
    );
  };

  const handleSaveSession = async () => {
    if (!session?.user) {
      toast.error("Debes iniciar sesión para guardar el entrenamiento.");
      return;
    }
    if (!selectedDate) {
      toast.error("Por favor, selecciona una fecha para la sesión.");
      return;
    }
    // Allow saving if updating an existing session even if exercises might be cleared by user,
    // or if it's a new session, it must have exercises.
    if (exercises.length === 0 && !loadedSessionId) { 
      toast.error("Añade al menos un ejercicio para guardar una nueva sesión.");
      return;
    }

    setIsSaving(true);
    const userId = session.user.id;
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    let currentTrainingSessionId: string | null = loadedSessionId; // Use loaded ID as starting point for the operation

    try {
      const sessionDataPayload = {
        user_id: userId, 
        fecha_entrenamiento: formattedDate, 
        nombre_sesion: sessionName || null,
        duracion_total_minutos: sessionDuration ? parseInt(sessionDuration, 10) : null,
        sensacion_general: overallFeeling || null,
        rpe_sesion: rpeSession !== null ? rpeSession : null, 
        notas_sesion: generalNotes || null,
      };

      if (currentTrainingSessionId) {
        // UPDATE existing session
        // Note: user_id and fecha_entrenamiento are not typically updated, but used for matching.
        // Here, we only send fields that are meant to be mutable for an existing session.
        const { data: updatedSessionData, error: sessionUpdateError } = await supabase
          .from("registros_sesion_entrenamiento")
          .update({
            nombre_sesion: sessionDataPayload.nombre_sesion,
            duracion_total_minutos: sessionDataPayload.duracion_total_minutos,
            sensacion_general: sessionDataPayload.sensacion_general,
            rpe_sesion: sessionDataPayload.rpe_sesion,
            notas_sesion: sessionDataPayload.notas_sesion,
          })
          .eq("id", currentTrainingSessionId)
          .eq("user_id", userId) // Security check: ensure the user owns this session
          .select()
          .single();

        if (sessionUpdateError || !updatedSessionData) {
          console.error("Error updating training session:", sessionUpdateError);
          throw new Error(sessionUpdateError?.message || "No se pudo actualizar la sesión de entrenamiento.");
        }
        // currentTrainingSessionId remains the same, it's updatedSessionData.id
        // toast.info("Sesión de entrenamiento actualizada."); // Temporary, final success toast is at the end
      } else {
        // INSERT new session
        const { data: insertedSessionData, error: sessionInsertError } = await supabase
          .from("registros_sesion_entrenamiento")
          .insert(sessionDataPayload) // This payload includes user_id and fecha_entrenamiento
          .select()
          .single();

        if (sessionInsertError || !insertedSessionData) {
          console.error("Error inserting training session:", sessionInsertError);
          throw new Error(sessionInsertError?.message || "No se pudo guardar la nueva sesión de entrenamiento.");
        }
        currentTrainingSessionId = insertedSessionData.id;
        setLoadedSessionId(currentTrainingSessionId); // Important: Update state for subsequent saves without page reload
        // toast.info("Nueva sesión de entrenamiento creada."); // Temporary
      }

      // At this point, currentTrainingSessionId reliably holds the ID of the saved (updated or inserted) session.

      // 2. Handle exercises: Delete ALL existing exercises for this session, then insert current ones.
      // This is simpler than trying to diff and update individual exercises.
      if (currentTrainingSessionId) {
        const { error: deleteExercisesError } = await supabase
          .from("ejercicios_sesion")
          .delete()
          .eq("sesion_id", currentTrainingSessionId);

        if (deleteExercisesError) {
          console.error("Error deleting old exercises:", deleteExercisesError);
          // Non-fatal for the main session record, but data is inconsistent. User needs to be informed.
          throw new Error(`Error al limpiar ejercicios antiguos: ${deleteExercisesError.message}. La sesión principal puede estar guardada/actualizada, pero los ejercicios no.`);
        }

        // Now, insert current exercises if there are any
        if (exercises.length > 0) {
          const exercisesToInsert = exercises.map((exercise, index) => ({
            sesion_id: currentTrainingSessionId,
            user_id: userId, // Good for RLS and queries
            nombre_ejercicio: exercise.name,
            orden_ejercicio: index + 1,
            series: exercise.sets.map(set => ({ // Prune IDs from sets, only save relevant data
              reps: set.reps,
              weight: set.weight,
              rpe: set.rpe,
              rest: set.rest,
              notes: set.notes,
            })),
            // notas_ejercicio: exercise.notas_ejercicio || null, // If you add notes per exercise
          }));

          const { error: insertExercisesError } = await supabase
            .from("ejercicios_sesion")
            .insert(exercisesToInsert);

          if (insertExercisesError) {
            console.error("Error saving new exercises:", insertExercisesError);
            throw new Error(`Error al guardar los nuevos ejercicios: ${insertExercisesError.message}. La sesión principal está guardada/actualizada, pero los ejercicios pueden estar inconsistentes.`);
          }
        }
      }

      toast.success("¡Sesión de entrenamiento guardada con éxito!");
      // Optionally, trigger a reload of data to ensure UI consistency if needed, or rely on current state.
      // loadTrainingSessionForDate(); // This might be too aggressive or cause loops if not handled carefully.

    } catch (error: any) {
      console.error("Full error in handleSaveSession:", error);
      toast.error(error.message || "Ocurrió un error desconocido al guardar la sesión.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetField = (exerciseId: string, setId: string, fieldName: keyof ExerciseSet, value: any) => {
    setExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s => {
              if (s.id === setId) {
                let processedValue = value;
                if (fieldName === 'reps' || fieldName === 'weight' || fieldName === 'rpe' || fieldName === 'rest') {
                  processedValue = value === '' ? undefined : Number(value);
                }
                return { ...s, [fieldName]: processedValue };
              }
              return s;
            }),
          };
        }
        return ex;
      })
    );
  };

  const deleteSetFromExercise = (exerciseId: string, setId: string) => {
    setExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.filter(s => s.id !== setId),
          };
        }
        return ex;
      })
    );
  };

  // TODO: Considerar si se necesita una función para reordenar series/ejercicios más adelante.

  const addSetToExercise = (exerciseId: string) => {
    const newSet: ExerciseSet = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7), // more unique id
      reps: undefined,
      weight: undefined,
      rpe: 5, // Default RPE, puede ajustarse
      rest: undefined,
      notes: "",
    };
    setExercises(prevExercises =>
      prevExercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, newSet] }
          : ex
      )
    );
  };


  return (
    <div className={`min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-neutral-100 p-4 sm:p-6 lg:p-8 font-sans ${(isLoading || isSaving) ? 'opacity-70 pointer-events-none' : ''}`}>
      {(isLoading || isSaving) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-violet"></div>
          <p className="ml-4 text-xl text-brand-violet/80">{isSaving ? "Guardando datos..." : "Cargando datos..."}</p>
        </div>
      )}
      <Toaster richColors position="top-right" />
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 text-neutral-400 hover:text-brand-violet">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-violet tracking-tight">
            Registrar Sesión de Entrenamiento
          </h1>
        </div>
      </header>

      <main className="space-y-6">

        {/* Dashboard Section - Añadida aquí */}
        <Card className="bg-neutral-800/70 border-neutral-700 shadow-xl">
          <CardHeader className="border-b border-neutral-700/50 pb-4">
            <CardTitle className="text-xl font-semibold text-sky-400 flex items-center">
              <BarChartIcon className="mr-3 h-6 w-6 text-sky-500" /> {/* Usar el icono renombrado */}
              Análisis de Entrenamiento
            </CardTitle>
            <CardDescription className="text-neutral-400 text-sm">
              Visualiza tu progreso y tendencias recientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Volumen Semanal */}
            <div className="bg-neutral-850/50 p-4 rounded-lg shadow-md ring-1 ring-neutral-700/30">
              <h3 className="text-md font-medium text-neutral-200 mb-4">Volumen Total Semanal (kg) - Últimas 4 Semanas</h3>
              {isLoadingTrainingDashboardData ? (
                <div className="flex justify-center items-center h-60 sm:h-72">
                  <p className="text-neutral-500 text-sm">Cargando datos de volumen...</p>
                </div>
              ) : weeklyVolumeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={weeklyVolumeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#525252" />
                    <XAxis dataKey="week" stroke="#a3a3a3" fontSize={10} />
                    <YAxis stroke="#a3a3a3" fontSize={10} tickFormatter={(value) => `${value/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '0.375rem' }}
                      labelStyle={{ color: '#e5e5e5', fontSize: '0.875rem' }}
                      itemStyle={{ color: '#fafafa', fontSize: '0.875rem' }}
                    />
                    {/* <Legend wrapperStyle={{ color: "#e5e5e5", fontSize: '0.75rem' }} /> Eliminar leyenda si es redundante con el título */}
                    <Bar dataKey="volume" fill="#0ea5e9" name="Volumen (kg)" radius={[3, 3, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-60 sm:h-72">
                  <p className="text-neutral-500 text-sm">No hay datos de volumen para mostrar.</p>
                </div>
              )}
            </div>

            {/* Gráfico de Frecuencia de Grupos Musculares */}
            <div className="bg-neutral-850/50 p-4 rounded-lg shadow-md ring-1 ring-neutral-700/30">
              <h3 className="text-md font-medium text-neutral-200 mb-4">Frecuencia de Grupos Musculares - Últimos 30 Días</h3>
              {isLoadingTrainingDashboardData ? (
                <div className="flex justify-center items-center h-60 sm:h-72">
                  <p className="text-neutral-500 text-sm">Cargando datos de frecuencia...</p>
                </div>
              ) : muscleGroupFrequencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={muscleGroupFrequencyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={85}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent, value }) => `${name} (${value})`}
                      fontSize={11}
                    >
                      {muscleGroupFrequencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="#171717" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '0.375rem' }}
                      labelStyle={{ color: '#e5e5e5', fontSize: '0.875rem' }}
                      itemStyle={{ color: '#fafafa', fontSize: '0.875rem' }}
                    />
                    <Legend wrapperStyle={{ color: "#e5e5e5", fontSize: '0.75rem', paddingTop: '15px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-60 sm:h-72">
                  <p className="text-neutral-500 text-sm">No hay datos de frecuencia para mostrar.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Fin Dashboard Section */}


        {/* Detalles de la Sesión */}
        <DashboardCard title="Detalles de la Sesión">
          <div className="space-y-4">
            <div>
              <Label htmlFor="sessionDate" className="text-sm font-medium text-neutral-300">Fecha de la Sesión</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal mt-1 border-neutral-600 hover:bg-neutral-700 hover:text-neutral-100 focus:ring-brand-violet"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-neutral-400" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span className="text-neutral-500">Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700 shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="text-neutral-200"
                    classNames={{
                      day_selected: "bg-brand-violet text-white hover:bg-brand-violet/90 focus:bg-brand-violet",
                      day_today: "text-brand-violet",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="sessionName" className="text-sm font-medium text-neutral-300">Nombre de la Sesión (Opcional)</Label>
              <Input 
                id="sessionName" 
                placeholder="Ej: Día de Empuje Fuerte, Cardio Intenso" 
                className="mt-1 bg-neutral-700/50 border-neutral-600 focus:border-brand-violet focus:ring-brand-violet text-neutral-100 placeholder:text-neutral-500"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sessionDuration" className="text-sm font-medium text-neutral-300">Duración Estimada (minutos)</Label>
              <Input 
                id="sessionDuration" 
                type="number" 
                placeholder="Ej: 60" 
                className="mt-1 bg-neutral-700/50 border-neutral-600 focus:border-indigo-500 focus:ring-indigo-500 text-neutral-100 placeholder:text-neutral-500"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="overallFeeling" className="text-sm font-medium text-neutral-300">Sensación General de la Sesión</Label>
              <Input 
                id="overallFeeling" 
                placeholder="Ej: Fuerte, Con energía, Algo cansado..." 
                className="mt-1 bg-neutral-700/50 border-neutral-600 focus:border-indigo-500 focus:ring-indigo-500 text-neutral-100 placeholder:text-neutral-500"
                value={overallFeeling}
                onChange={(e) => setOverallFeeling(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rpeSession" className="text-sm font-medium text-neutral-300">RPE de la Sesión ({rpeSession.toFixed(1)})</Label>
              <Slider 
                id="rpeSession" 
                value={[rpeSession]} 
                min={0} 
                max={10} 
                step={0.5} 
                className="mt-2 [&>span:first-child]:h-2 [&>span:first-child>span]:bg-brand-violet"
                onValueChange={(value) => setRpeSession(value[0])}
              />
            </div>
          </div>
        </DashboardCard>

        {/* Ejercicios */}
        <DashboardCard title="Ejercicios">
          <div className="space-y-6">
            {exercises.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-4">No hay ejercicios añadidos todavía. ¡Empieza por añadir uno!</p>
            )}
            {exercises.map((exercise, index) => (
              <div key={exercise.id} className="p-4 border border-neutral-700/70 rounded-lg space-y-4 bg-neutral-800/30">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-brand-violet">Ejercicio {index + 1}</h3>
                  <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-red-500" onClick={() => deleteExercise(exercise.id)}>
                    <Trash2 size={18} />
                  </Button>
                </div>

                <div>
                  <Label htmlFor={`exerciseName-${exercise.id}`} className="text-sm font-medium text-neutral-300">Nombre del Ejercicio</Label>
                  <Input 
                    id={`exerciseName-${exercise.id}`}
                    placeholder="Ej: Press de Banca, Sentadillas" 
                    className="mt-1 bg-neutral-700/50 border-neutral-600 focus:border-brand-violet focus:ring-brand-violet text-neutral-100 placeholder:text-neutral-500"
                    value={exercise.name}
                    onChange={(e) => handleExerciseInputChange(exercise.id, 'name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`muscleGroup-${exercise.id}`} className="text-sm font-medium text-neutral-300">Grupo Muscular (Opcional)</Label>
                  <Select 
                    value={exercise.muscleGroup}
                    onValueChange={(value) => handleExerciseInputChange(exercise.id, 'muscleGroup', value)}
                  >
                    <SelectTrigger id={`muscleGroup-${exercise.id}`} className="w-full mt-1 bg-neutral-700/50 border-neutral-600 focus:border-brand-violet focus:ring-brand-violet text-neutral-100 placeholder:text-neutral-500">
                      <SelectValue placeholder="Seleccionar grupo muscular" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100">
                      <SelectItem value="pecho">Pecho</SelectItem>
                      <SelectItem value="espalda">Espalda</SelectItem>
                      <SelectItem value="piernas">Piernas</SelectItem>
                      <SelectItem value="hombros">Hombros</SelectItem>
                      <SelectItem value="biceps">Bíceps</SelectItem>
                      <SelectItem value="triceps">Tríceps</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator className="bg-neutral-700/50 my-3"/>

                <div>
                  <h4 className="text-md font-medium text-neutral-200 mb-3">Series</h4>
                  {exercise.sets.length === 0 && (
                    <p className="text-xs text-neutral-500 text-center py-2">No hay series añadidas para este ejercicio.</p>
                  )}
                  {exercise.sets.map((set, setIndex) => (
                    <div key={set.id} className="space-y-3 p-3 mb-3 border border-neutral-700/40 rounded-md bg-neutral-800/10 hover:border-neutral-600/80 transition-colors duration-150">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-brand-violet/80">Serie {setIndex + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-neutral-500 hover:text-red-600 h-7 w-7"
                          onClick={() => deleteSetFromExercise(exercise.id, set.id)} // Conectar aquí
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-3 gap-y-4 items-end">
                        <div>
                          <Label htmlFor={`reps-${exercise.id}-${set.id}`} className="text-xs font-medium text-neutral-400 block mb-0.5">Reps</Label>
                          <Input 
                            id={`reps-${exercise.id}-${set.id}`} 
                            type="number" 
                            placeholder="Reps" 
                            className="h-9 bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet"
                            value={set.reps === undefined ? '' : set.reps}
                            onChange={(e) => updateSetField(exercise.id, set.id, 'reps', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`weight-${exercise.id}-${set.id}`} className="text-xs font-medium text-neutral-400 block mb-0.5">Peso (kg)</Label>
                          <Input 
                            id={`weight-${exercise.id}-${set.id}`} 
                            type="number" 
                            placeholder="Peso" 
                            className="h-9 bg-neutral-700/80 border-neutral-600/80 focus:border-sky-600 focus:ring-sky-600"
                            value={set.weight === undefined ? '' : set.weight}
                            onChange={(e) => updateSetField(exercise.id, set.id, 'weight', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1 md:col-span-1">
                          <Label htmlFor={`rpe-${exercise.id}-${set.id}`} className="text-xs font-medium text-neutral-400 block mb-0.5">RPE ({set.rpe !== undefined ? set.rpe.toFixed(1) : '-'})</Label>
                          <div className="flex items-center space-x-2 h-9">
                            <Slider 
                              id={`rpe-${exercise.id}-${set.id}`} 
                              value={set.rpe !== undefined ? [set.rpe] : [5]} // Usar value en lugar de defaultValue
                              min={0} // RPE puede ser 0 (descanso activo) o empezar en 1, a definir
                              max={10} 
                              step={0.5} 
                              className="[&>span:first-child]:h-1.5 [&>span:first-child>span]:bg-brand-violet flex-grow"
                              onValueChange={(sliderValue) => updateSetField(exercise.id, set.id, 'rpe', sliderValue[0])}
                            />
                            {/* <span className="text-sm text-sky-300 w-8 text-right">{set.rpe !== undefined ? set.rpe.toFixed(1) : "-"}</span> */}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`rest-${exercise.id}-${set.id}`} className="text-xs font-medium text-neutral-400 block mb-0.5">Desc. (s)</Label>
                          <Input 
                            id={`rest-${exercise.id}-${set.id}`} 
                            type="number" 
                            placeholder="Desc." 
                            className="h-9 bg-neutral-700/80 border-neutral-600/80 focus:border-sky-600 focus:ring-sky-600"
                            value={set.rest === undefined ? '' : set.rest}
                            onChange={(e) => updateSetField(exercise.id, set.id, 'rest', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-3 md:col-span-5">
                          <Label htmlFor={`notes-${exercise.id}-${set.id}`} className="text-xs font-medium text-neutral-400 block mb-0.5">Notas de Serie</Label>
                          <Input 
                            id={`notes-${exercise.id}-${set.id}`} 
                            placeholder="Notas de la serie..." 
                            className="h-9 bg-neutral-700/80 border-neutral-600/80 focus:border-sky-600 focus:ring-sky-600"
                            value={set.notes || ''}
                            onChange={(e) => updateSetField(exercise.id, set.id, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Fin de una Serie Estática */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 border-brand-violet/70 text-brand-violet hover:bg-brand-violet/10 hover:text-brand-violet/90"
                    onClick={() => addSetToExercise(exercise.id)} // Conectar la función aquí
                  >
                      <PlusCircle size={16} className="mr-2" />
                      Añadir Serie
                  </Button>
                </div>
              </div>
            ))}
            {/* Fin Bloque de un Ejercicio Estático */}

            <Button variant="outline" className="mt-6 w-full sm:w-auto border-brand-violet/70 text-brand-violet hover:bg-brand-violet/10 hover:text-brand-violet/90" onClick={addExercise}>
              <PlusCircle size={18} className="mr-2" />
              Añadir Otro Ejercicio
            </Button>
          </div>
        </DashboardCard>

        {/* Notas Generales de la Sesión */}
        <DashboardCard title="Notas Generales de la Sesión (Opcional)">
          <Textarea
            id="generalNotes"
            placeholder="Añade cualquier nota relevante sobre la sesión en general..."
            className="min-h-[100px] bg-neutral-700/50 border-neutral-600 focus:border-brand-violet focus:ring-brand-violet text-neutral-100 placeholder:text-neutral-500"
            value={generalNotes} // Conectar value
            onChange={(e) => setGeneralNotes(e.target.value)} // Conectar onChange
          />
        </DashboardCard>

        {/* Acciones Principales */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            className="w-full sm:w-auto border-neutral-600 hover:bg-neutral-700/80 hover:text-neutral-200 text-neutral-300">
            <XCircle size={18} className="mr-2" />
            Cancelar
          </Button>
          <Button 
            className="w-full sm:w-auto bg-brand-violet hover:bg-brand-violet/90 text-white"
            onClick={() => {
              // console.log("Guardando Sesión:", {
              //   date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : null,
              //   sessionName,
              //   sessionDuration,
              //   exercises,
              //   generalNotes,
              // });
              handleSaveSession();
              // TODO: Mostrar Toast de Sonner al guardar con éxito/error
            }}
          >
            <Save size={18} className="mr-2" />
            Guardar Sesión
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TrainingLogPage;
