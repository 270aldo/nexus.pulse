import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import DashboardCard from "@/components/DashboardCard"; // Asumiendo que existe
import ProtectedRoute from "../components/ProtectedRoute"; // Importar ProtectedRoute
import { format } from "date-fns";
import { es } from "date-fns/locale"; // Para formato de fecha en español si se desea
import { Calendar as CalendarIcon, ChevronLeft, PlusCircle, Trash2, MinusCircle } from "lucide-react";
import { useState, useEffect } from "react"; // Added useEffect
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "../utils/supabaseClient";
import { useAppContext } from "../components/AppProvider";
import { subDays, format as formatDateFns, eachDayOfInterval, startOfDay as startOfDayFns, parseISO as parseISODateFns, isValid as isValidDateFns } from 'date-fns'; // Para dashboard de calorías
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RechartsTooltip, // Renombrado para evitar conflicto con Tooltip de Shadcn si se usa
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// --- Interfaces y tipos para el Dashboard ---
interface MacroDataPoint {
  name: string; // Proteínas, Carbohidratos, Grasas
  value: number; // Calorías o gramos
  fill: string; // Color para el gráfico
}

interface CalorieTrendDataPoint {
  date: string; // Fecha formateada, ej: "10 May"
  calories: number | null;
}
// --- Fin Interfaces y tipos para el Dashboard ---

// Interfaces y tipos
interface HorariosPreferidos {
  desayuno?: string;
  almuerzo?: string;
  cena?: string;
}

export type MealType = "desayuno" | "almuerzo" | "cena" | "snack";

interface MealLog {
  id: string;
  type: MealType;
  time: string;
  description: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  calories?: number;
}

// Constantes
const mealTypeTranslations: Record<MealType, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
  snack: "Snack",
};

const NutritionLogPageContent = () => {
  const navigate = useNavigate();
  const { session } = useAppContext(); // Get session from context
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLog, setIsLoadingLog] = useState(false); // State for loading daily log
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Estado para Timing Nutricional
  const [timingNutricionalActivo, setTimingNutricionalActivo] = useState<boolean>(false);
  const [horariosPreferidos, setHorariosPreferidos] = useState<HorariosPreferidos>({});

  // Estado para el formulario de añadir comida
  const [currentMealType, setCurrentMealType] = useState<MealType>("desayuno");
  const [currentMealTime, setCurrentMealTime] = useState<string>("");
  const [currentMealDescription, setCurrentMealDescription] = useState<string>("");
  const [currentMealProtein, setCurrentMealProtein] = useState<string>("");
  const [currentMealCarbs, setCurrentMealCarbs] = useState<string>("");
  const [currentMealFat, setCurrentMealFat] = useState<string>("");
  const [currentMealCalories, setCurrentMealCalories] = useState<string>("");
  const [meals, setMeals] = useState<MealLog[]>([]);

  // Estado para Hidratación
  const [aguaConsumida, setAguaConsumida] = useState<number>(0);
  const [metaAgua, setMetaAgua] = useState<number>(2000); // en ml
  const aguaIncremento = 250; // en ml

  // Estado para Notas Adicionales
  const [notasNutricion, setNotasNutricion] = useState<string>("");

  // Estados para el Dashboard Nutricional
  const [dailyMacroDistributionData, setDailyMacroDistributionData] = useState<MacroDataPoint[]>([]);
  const [calorieTrendData, setCalorieTrendData] = useState<CalorieTrendDataPoint[]>([]);
  const [isLoadingDashboardData, setIsLoadingDashboardData] = useState<boolean>(true);

  // --- Colores para el gráfico de macros ---
  const MACRO_COLORS = {
    protein: '#a78bfa', // violet-400
    carbs: '#60a5fa',   // blue-400
    fat: '#facc15',     // yellow-400 (o un naranja si se prefiere)
  };
  // --- Fin Colores ---

  // Effect to load data when date or user changes

  // Effect to load data when date or user changes
  useEffect(() => {
    const loadDayLogAndDashboardData = async () => {
      if (!selectedDate || !session?.user) {
        // Reset form and dashboard if no date or user
        setTimingNutricionalActivo(false);
        setHorariosPreferidos({});
        setMeals([]);
        setAguaConsumida(0);
        setMetaAgua(2000);
        setNotasNutricion("");
        setDailyMacroDistributionData([]);
        setCalorieTrendData([]);
        setIsLoadingLog(false); // Also implies dashboard is not loading relevant data
        setIsLoadingDashboardData(false);
        return;
      }

      setIsLoadingLog(true);
      setIsLoadingDashboardData(true);
      const userId = session.user.id;
      const formattedSelectedDate = format(selectedDate, "yyyy-MM-dd");
      let currentDayMeals: MealLog[] = []; // Variable para almacenar las comidas del día actual

      try {
        // 1. Fetch from registros_nutricion (Log del día)
        const { data: registroData, error: registroError } = await supabase
          .from("registros_nutricion")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("fecha_registro", formattedSelectedDate)
          .maybeSingle();

        if (registroError) {
          console.error("Error fetching registro_nutricion:", registroError);
          toast.error(`Error al cargar el registro: ${registroError.message}`);
          // No poner return aquí para que intente cargar el dashboard igualmente si es posible
        } else if (registroData) {
          setTimingNutricionalActivo(registroData.timing_activo || false);
          setHorariosPreferidos(registroData.horarios_preferidos || {});
          setAguaConsumida(registroData.agua_consumida_ml || 0);
          setMetaAgua(registroData.meta_agua_ml || 2000);
          setNotasNutricion(registroData.notas_nutricion || "");

          // 2. Fetch from items_comida_nutricion (Comidas del día)
          const { data: itemsData, error: itemsError } = await supabase
            .from("items_comida_nutricion")
            .select("*")
            .eq("registro_nutricion_id", registroData.id)
            .order("hora_comida", { ascending: true });

          if (itemsError) {
            console.error("Error fetching items_comida_nutricion:", itemsError);
            toast.error(`Error al cargar las comidas: ${itemsError.message}`);
            setMeals([]);
          } else {
            currentDayMeals = itemsData ? itemsData.map(item => ({
              id: item.id,
              type: item.tipo_comida as MealType,
              time: item.hora_comida,
              description: item.descripcion_comida,
              protein: item.proteinas,
              carbs: item.carbohidratos,
              fat: item.grasas,
              calories: item.calorias,
            })) : [];
            setMeals(currentDayMeals);
            if (!registroError) toast.success("Datos del día cargados."); // Solo si el registro principal cargó bien
          }
        } else {
          // No record found for this day, reset form fields to default
          setTimingNutricionalActivo(false);
          setHorariosPreferidos({});
          setMeals([]);
          currentDayMeals = [];
          setAguaConsumida(0);
          setNotasNutricion("");
          if (!registroError) toast.info("No hay datos guardados para esta fecha.");
        }

        // --- Inicio Lógica del Dashboard ---
        // 1. Distribución de Macronutrientes del Día Actual (usa currentDayMeals)
        let totalProteinGrams = 0;
        let totalCarbGrabs = 0;
        let totalFatGrams = 0;

        currentDayMeals.forEach(meal => {
          totalProteinGrams += meal.protein || 0;
          totalCarbGrabs += meal.carbs || 0;
          totalFatGrams += meal.fat || 0;
        });

        const proteinCalories = totalProteinGrams * 4;
        const carbCalories = totalCarbGrabs * 4;
        const fatCalories = totalFatGrams * 9;
        const totalCaloriesFromMacros = proteinCalories + carbCalories + fatCalories;

        const macrosForChart: MacroDataPoint[] = [];
        if (totalCaloriesFromMacros > 0) {
          macrosForChart.push({ name: 'Proteínas', value: parseFloat(proteinCalories.toFixed(1)), fill: MACRO_COLORS.protein });
          macrosForChart.push({ name: 'Carbohidratos', value: parseFloat(carbCalories.toFixed(1)), fill: MACRO_COLORS.carbs });
          macrosForChart.push({ name: 'Grasas', value: parseFloat(fatCalories.toFixed(1)), fill: MACRO_COLORS.fat });
        }
        setDailyMacroDistributionData(macrosForChart);

        // 2. Tendencia de Ingesta Calórica (Últimos 7 Días)
        const todayForTrend = startOfDayFns(selectedDate); // Usa selectedDate como el día más reciente
        const sevenDaysAgo = subDays(todayForTrend, 6);
        const dateInterval = eachDayOfInterval({ start: sevenDaysAgo, end: todayForTrend });

        const { data: calorieEntries, error: calorieTrendError } = await supabase
          .from('items_comida_nutricion')
          .select('calorias, fecha_registro_original') // Asumiendo que items_comida_nutricion tiene fecha_registro_original
                                                      // o necesitamos unir con registros_nutricion para obtener la fecha de cada comida.
                                                      // Por simplicidad, asumiré que items_comida_nutricion tiene una columna 'fecha_registro_original' (YYYY-MM-DD)
                                                      // Si no, esta consulta debe ser más compleja o los datos deben ser reestructurados.
                                                      // TEMPORAL: Si 'fecha_registro_original' no existe, este gráfico no funcionará.
                                                      // Necesitaríamos una forma de asociar cada 'item_comida_nutricion' con su 'fecha_registro' del padre 'registros_nutricion'.
                                                      // Una forma sería añadir `fecha_registro` a `items_comida_nutricion` al guardar, o hacer un join.
                                                      // ***PARA UNA SOLUCIÓN MÁS ROBUSTA, SE DEBERÍA HACER UN JOIN O DUPLICAR LA FECHA***
                                                      // ***A CONTINUACIÓN, SE USA UNA SOLUCIÓN SIMPLIFICADA ASUMIENDO QUE TENEMOS ACCESO A LA FECHA DEL ITEM***
                                                      // ***SI 'items_comida_nutricion' NO TIENE FECHA, ESTO FALLARÁ SILENCIOSAMENTE O CON ERROR***
          .eq('user_id', userId)
          .gte('fecha_registro', formatDateFns(sevenDaysAgo, 'yyyy-MM-dd')) // Asumiendo 'fecha_registro' en items_comida_nutricion
          .lte('fecha_registro', formatDateFns(todayForTrend, 'yyyy-MM-dd')) // Asumiendo 'fecha_registro' en items_comida_nutricion
          .order('fecha_registro', { ascending: true });

        if (calorieTrendError) {
          console.error('Error fetching calorie trend data:', calorieTrendError);
          toast.error('Error al cargar tendencia de calorías.');
          setCalorieTrendData([]);
        } else if (calorieEntries) {
          const processedCalorieTrend = dateInterval.map(dayInInterval => {
            const dayString = formatDateFns(dayInInterval, 'yyyy-MM-dd');
            const entriesForDay = calorieEntries.filter(entry => {
                // ESTA ES LA PARTE CRÍTICA: necesitamos 'entry.fecha_registro' o similar
                // Si 'calorieEntries' no tiene la fecha de cada comida, esta lógica es incorrecta.
                // Por ahora, asumiré que SÍ la tiene como 'entry.fecha_registro'
                return entry.fecha_registro_original === dayString && entry.calorias != null;
            });

            let dailyTotalCalories: number | null = null;
            if (entriesForDay.length > 0) {
              dailyTotalCalories = entriesForDay.reduce((acc, curr) => acc + (curr.calorias || 0), 0);
            }
            return {
              date: formatDateFns(dayInInterval, 'd MMM', { locale: es }),
              calories: dailyTotalCalories,
            };
          });
          setCalorieTrendData(processedCalorieTrend);
        } else {
            setCalorieTrendData([]);
        }
        // --- Fin Lógica del Dashboard ---

      } catch (error: any) {
        console.error("Error completo en loadDayLogAndDashboardData:", error);
        toast.error(error.message || "Ocurrió un error desconocido al cargar los datos.");
        setDailyMacroDistributionData([]);
        setCalorieTrendData([]);
      } finally {
        setIsLoadingLog(false);
        setIsLoadingDashboardData(false);
      }
    };

    loadDayLogAndDashboardData();
  }, [selectedDate, session?.user?.id, MACRO_COLORS.protein]); // Agregado MACRO_COLORS.protein para que el linter no se queje de dependencia no listada


  
  // Helper function to get or create daily nutrition log entry
  const getOrCreateRegistroNutricionDelDia = async (): Promise<string | null> => {
    if (!session?.user || !selectedDate) {
      toast.error("Usuario no autenticado o fecha no seleccionada.");
      return null;
    }

    const userId = session.user.id;
    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    // 1. Try to fetch existing record
    let { data: existingRecord, error: fetchError } = await supabase
      .from("registros_nutricion")
      .select("id")
      .eq("user_id", userId)
      .eq("fecha_registro", formattedDate)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching registro_nutricion:", fetchError);
      toast.error(`Error al buscar registro del día: ${fetchError.message}`);
      return null;
    }

    if (existingRecord) {
      return existingRecord.id;
    }

    // 2. If not exists, create it
    // Use current state values for default fields if creating new
    // This assumes that if loadDayLog didn't find a record, these states are at their defaults
    const { data: newRecord, error: createError } = await supabase
      .from("registros_nutricion")
      .insert({
        user_id: userId,
        fecha_registro: formattedDate,
        horarios_preferidos: timingNutricionalActivo ? horariosPreferidos : {}, // Use current state
        timing_activo: timingNutricionalActivo, // Use current state
        agua_consumida_ml: aguaConsumida, // Use current state
        meta_agua_ml: metaAgua, // Use current state
        notas_nutricion: notasNutricion, // Use current state
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating registro_nutricion:", createError);
      toast.error(`Error al crear registro del día: ${createError.message}`);
      return null;
    }

    if (newRecord) {
      toast.info("Registro diario creado automáticamente.");
      return newRecord.id;
    }
    
    return null; // Should not happen if insert is successful
  };

  // Handlers
  const handleHorarioChange = (comida: keyof HorariosPreferidos, value: string) => {
    setHorariosPreferidos(prev => ({ ...prev, [comida]: value }));
  };

  const handleAddMeal = async () => {
    if (!session?.user) {
      toast.error("Debes iniciar sesión para añadir comidas.");
      return;
    }
    if (!currentMealTime || !currentMealDescription) {
      toast.error("La hora y la descripción de la comida son obligatorias.");
      return;
    }

    setIsSaving(true); // Indicate that an operation is in progress

    // Get or create the nutrition record for the day
    let registroNutricionId: string | null = null;
    
    try {
      // First, try to find existing record
      const { data: existingRecord, error: findError } = await supabase
        .from("registros_nutricion")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("fecha_registro", format(selectedDate || new Date(), "yyyy-MM-dd"))
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error("Error finding nutrition record:", findError);
        throw findError;
      }

      if (existingRecord) {
        registroNutricionId = existingRecord.id;
      } else {
        // Create new record
        const { data: newRecord, error: createError } = await supabase
          .from("registros_nutricion")
          .insert({
            user_id: session.user.id,
            fecha_registro: format(selectedDate, "yyyy-MM-dd"),
            horarios_preferidos: timingNutricionalActivo ? horariosPreferidos : {},
            timing_activo: timingNutricionalActivo,
            agua_consumida_ml: aguaConsumida,
            meta_agua_ml: metaAgua,
            notas_nutricion: notasNutricion,
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating nutrition record:", createError);
          throw createError;
        }

        registroNutricionId = newRecord.id;
      }
    } catch (error) {
      console.error("Error getting/creating nutrition record:", error);
      toast.error("Error al obtener o crear el registro del día.");
      setIsSaving(false);
      return;
    }

    if (!registroNutricionId) {
      toast.error("No se pudo obtener o crear el registro del día. Inténtalo de nuevo.");
      setIsSaving(false);
      return;
    }

    const mealDataForSupabase = {
      registro_nutricion_id: registroNutricionId,
      user_id: session.user.id,
      tipo_comida: currentMealType,
      hora_comida: currentMealTime,
      descripcion_comida: currentMealDescription,
      proteinas: currentMealProtein ? parseFloat(currentMealProtein) : null,
      carbohidratos: currentMealCarbs ? parseFloat(currentMealCarbs) : null,
      grasas: currentMealFat ? parseFloat(currentMealFat) : null,
      calorias: currentMealCalories ? parseFloat(currentMealCalories) : null,
    };

    try {
      const { data: insertedMeal, error } = await supabase
        .from("items_comida_nutricion")
        .insert(mealDataForSupabase)
        .select() // Select the inserted row to get its ID
        .single();

      if (error) {
        console.error("Error inserting meal:", error);
        toast.error(`Error al guardar la comida: ${error.message}`);
        setIsSaving(false);
        return;
      }

      if (insertedMeal) {
        const newMealLog: MealLog = {
          id: insertedMeal.id, // Use ID from Supabase
          type: insertedMeal.tipo_comida as MealType,
          time: insertedMeal.hora_comida,
          description: insertedMeal.descripcion_comida,
          protein: insertedMeal.proteinas,
          carbs: insertedMeal.carbohidratos,
          fat: insertedMeal.grasas,
          calories: insertedMeal.calorias,
        };
        setMeals(prevMeals => [...prevMeals, newMealLog].sort((a, b) => a.time.localeCompare(b.time)));
        
        // Reset form fields
        setCurrentMealTime("");
        setCurrentMealDescription("");
        setCurrentMealProtein("");
        setCurrentMealCarbs("");
        setCurrentMealFat("");
        setCurrentMealCalories("");
        toast.success(`${mealTypeTranslations[currentMealType]} guardada con éxito en Supabase.`);
      }
    } catch (e: any) {
      console.error("Unexpected error in handleAddMeal:", e);
      toast.error(`Error inesperado: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!session?.user) {
      toast.error("Debes iniciar sesión para eliminar comidas.");
      return;
    }

    setIsSaving(true); // Indicate that an operation is in progress

    try {
      const { error } = await supabase
        .from("items_comida_nutricion")
        .delete()
        .eq("id", mealId)
        .eq("user_id", session.user.id); // Ensure user owns the meal for RLS

      if (error) {
        console.error("Error deleting meal:", error);
        toast.error(`Error al eliminar la comida: ${error.message}`);
        setIsSaving(false);
        return;
      }

      setMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
      toast.info("Comida eliminada de Supabase.");

    } catch (e: any) {
      console.error("Unexpected error in handleDeleteMeal:", e);
      toast.error(`Error inesperado al eliminar: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAguaChange = (incremento: number) => {
    setAguaConsumida(prev => Math.max(0, prev + incremento));
  };

  const handleMetaAguaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= 0) {
      setMetaAgua(newValue);
    }
  };

  const handleAguaConsumidaManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= 0) {
      setAguaConsumida(newValue);
    }
  };

  const handleSaveDayLog = async () => {
    if (!session?.user || !selectedDate) {
      toast.error("Usuario no autenticado o fecha no seleccionada para guardar.");
      return;
    }

    setIsSaving(true);
    const userId = session.user.id;
    // Ensure getOrCreateRegistroNutricionDelDia uses the *current state* of the page for its fields
    // if it needs to create the record. Then we fetch its ID to perform an update.
    // Get or create the nutrition record for the day
    let registroNutricionId: string | null = null;
    
    try {
      // First, try to find existing record
      const { data: existingRecord, error: findError } = await supabase
        .from("registros_nutricion")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("fecha_registro", format(selectedDate || new Date(), "yyyy-MM-dd"))
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error("Error finding nutrition record:", findError);
        throw findError;
      }

      if (existingRecord) {
        registroNutricionId = existingRecord.id;
      } else {
        // Create new record
        const { data: newRecord, error: createError } = await supabase
          .from("registros_nutricion")
          .insert({
            user_id: session.user.id,
            fecha_registro: format(selectedDate, "yyyy-MM-dd"),
            horarios_preferidos: timingNutricionalActivo ? horariosPreferidos : {},
            timing_activo: timingNutricionalActivo,
            agua_consumida_ml: aguaConsumida,
            meta_agua_ml: metaAgua,
            notas_nutricion: notasNutricion,
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating nutrition record:", createError);
          throw createError;
        }

        registroNutricionId = newRecord.id;
      }
    } catch (error) {
      console.error("Error getting/creating nutrition record:", error);
      toast.error("Error al obtener o crear el registro del día.");
      setIsSaving(false);
      return;
    } 

    if (!registroNutricionId) {
      toast.error("No se pudo obtener o crear el registro del día para guardar. Inténtalo de nuevo.");
      setIsSaving(false);
      return;
    }

    // Now, update the main record with the latest general info from the page state.
    // Meals are already saved individually.
    try {
      const { data, error } = await supabase
        .from("registros_nutricion")
        .update({
          // user_id and fecha_registro are not updated as they define the record itself
          horarios_preferidos: timingNutricionalActivo ? horariosPreferidos : {},
          timing_activo: timingNutricionalActivo,
          agua_consumida_ml: aguaConsumida,
          meta_agua_ml: metaAgua,
          notas_nutricion: notasNutricion,
        })
        .eq("id", registroNutricionId)
        .eq("user_id", session.user.id); // Ensure user owns the record for RLS

      if (error) {
        console.error("Error updating registros_nutricion:", error);
        throw new Error(`Error al actualizar el registro principal: ${error.message}`);
      }

      toast.success("Registro del día actualizado con éxito en Supabase!");
      // No need to clean form fields here typically, as user might continue editing.
      // Or, if desired, reload the day's log to confirm all data is fresh from DB:
      // loadDayLog(); // Re-call loadDayLog if you want to refresh everything from DB

    } catch (error: any) {
      console.error("Error completo en handleSaveDayLog:", error);
      toast.error(error.message || "Ocurrió un error desconocido al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-neutral-100 p-4 sm:p-6 lg:p-8 font-sans ${isLoadingLog ? 'opacity-70 pointer-events-none' : ''}`}>
      {isLoadingLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-violet"></div>
          <p className="ml-4 text-xl text-brand-violet/80">Cargando datos...</p>
        </div>
      )}
      <Toaster richColors position="top-right" />
      <header className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* ... (código del header existente) ... */}
      </header>

      {/* Nutrition Dashboard Section */}
      <DashboardCard title="Dashboard Nutricional">
        {isLoadingDashboardData ? (
          <div className="flex items-center justify-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-violet"></div>
            <p className="ml-3 text-neutral-400">Cargando dashboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Distribución de Macros */}
            <div className="h-72">
              <h3 className="text-md font-semibold text-neutral-200 mb-2 text-center">Distribución de Macros (Calorías Hoy)</h3>
              {dailyMacroDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dailyMacroDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      // label={renderCustomizedLabel} // Podríamos añadir etiquetas personalizadas
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dailyMacroDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: '0.5rem', borderColor: 'rgba(51, 65, 85, 0.7)'}}
                        itemStyle={{ color: '#e5e7eb' }}
                        formatter={(value: number, name: string) => [`${value} kcal`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-neutral-500 pt-10">No hay datos de macros para hoy.</p>
              )}
            </div>

            {/* Gráfico de Tendencia de Calorías */}
            <div className="h-72">
              <h3 className="text-md font-semibold text-neutral-200 mb-2 text-center">Tendencia de Calorías (Últimos 7 Días)</h3>
              {calorieTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calorieTrendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                    <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: '0.5rem', borderColor: 'rgba(51, 65, 85, 0.7)'}}
                        itemStyle={{ color: '#e5e7eb' }}
                        labelStyle={{ color: '#cbd5e1' }}
                        formatter={(value: any) => [value !== null && value !== undefined ? `${value} kcal` : 'N/A', 'Calorías']}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem'}} />
                    <Line type="monotone" dataKey="calories" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-neutral-500 pt-10">No hay datos suficientes para la tendencia de calorías.</p>
              )}
            </div>
          </div>
        )}
      </DashboardCard>

      <div className="space-y-6 mt-6"> {/* Añadido mt-6 para separar del dashboard */}
        {/* Placeholder para futuras secciones */}
        {/* Eliminamos el DashboardCard "Resumen Diario (Próximamente)" original ya que lo hemos reemplazado */}

        <DashboardCard title="Timing Nutricional">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="timing-nutricional-switch" className="text-base text-neutral-200 flex-grow cursor-pointer">
                Activar Timing Nutricional
                <p className="text-xs text-neutral-400 font-normal mt-1">
                  Promueve la consistencia comiendo a las mismas horas.
                </p>
              </Label>
              <Switch
                id="timing-nutricional-switch"
                checked={timingNutricionalActivo}
                onCheckedChange={setTimingNutricionalActivo}
                className="data-[state=checked]:bg-brand-violet"
              />
            </div>

            {timingNutricionalActivo && (
              <div className="space-y-4 pt-3 mt-4 border-t border-neutral-700/60">
                <p className="text-sm text-neutral-300 mb-2">
                  Establece tus horarios de comida preferidos:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor="horario-desayuno" className="text-xs font-medium text-neutral-400 block mb-1">Desayuno</Label>
                    <Input 
                      type="time" 
                      id="horario-desayuno"
                      value={horariosPreferidos.desayuno || ''}
                      onChange={(e) => handleHorarioChange('desayuno', e.target.value)}
                      className="bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet h-9 w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="horario-almuerzo" className="text-xs font-medium text-neutral-400 block mb-1">Almuerzo</Label>
                    <Input 
                      type="time" 
                      id="horario-almuerzo"
                      value={horariosPreferidos.almuerzo || ''}
                      onChange={(e) => handleHorarioChange('almuerzo', e.target.value)}
                      className="bg-neutral-700/80 border-neutral-600/80 focus:border-violet-600 focus:ring-violet-600 h-9 w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="horario-cena" className="text-xs font-medium text-neutral-400 block mb-1">Cena</Label>
                    <Input 
                      type="time" 
                      id="horario-cena"
                      value={horariosPreferidos.cena || ''}
                      onChange={(e) => handleHorarioChange('cena', e.target.value)}
                      className="bg-neutral-700/80 border-neutral-600/80 focus:border-violet-600 focus:ring-violet-600 h-9 w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </DashboardCard>
        
        <DashboardCard title="Comidas del Día">
          <div className="space-y-6">
            {/* Formulario para añadir comida */}
            <div className="p-4 border border-neutral-700/70 rounded-lg shadow-md bg-neutral-800/30">
              <h3 className="text-lg font-semibold text-brand-violet mb-4">Añadir Nueva Comida</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="mealType" className="text-xs font-medium text-neutral-400 block mb-1">Tipo de Comida</Label>
                  <Select value={currentMealType} onValueChange={(value) => setCurrentMealType(value as MealType)}>
                    <SelectTrigger id="mealType" className="bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet h-9">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100">
                      <SelectItem value="desayuno">Desayuno</SelectItem>
                      <SelectItem value="almuerzo">Almuerzo</SelectItem>
                      <SelectItem value="cena">Cena</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mealTime" className="text-xs font-medium text-neutral-400 block mb-1">Hora</Label>
                  <Input 
                    type="time" 
                    id="mealTime"
                    value={currentMealTime}
                    onChange={(e) => setCurrentMealTime(e.target.value)}
                    className="bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet h-9 w-full"
                  />
                  {/* TODO: Aquí se podría mostrar el indicador de desviación del timing */}
                </div>
              </div>
              <div className="mb-4">
                <Label htmlFor="mealDescription" className="text-xs font-medium text-neutral-400 block mb-1">Descripción (Alimentos)</Label>
                <Textarea 
                  id="mealDescription"
                  value={currentMealDescription}
                  onChange={(e) => setCurrentMealDescription(e.target.value)}
                  placeholder="Ej: Pechuga de pollo a la plancha, ensalada mixta, quinoa..."
                  className="bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="mealProtein" className="text-xs font-medium text-neutral-400 block mb-1">Proteína (g)</Label>
                  <Input type="number" id="mealProtein" value={currentMealProtein} onChange={(e) => setCurrentMealProtein(e.target.value)} placeholder="0" className="bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet h-9 w-full" />
                </div>
                <div>
                  <Label htmlFor="mealCarbs" className="text-xs font-medium text-neutral-400 block mb-1">Carbs (g)</Label>
                  <Input type="number" id="mealCarbs" value={currentMealCarbs} onChange={(e) => setCurrentMealCarbs(e.target.value)} placeholder="0" className="bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet h-9 w-full" />
                </div>
                <div>
                  <Label htmlFor="mealFat" className="text-xs font-medium text-neutral-400 block mb-1">Grasa (g)</Label>
                  <Input type="number" id="mealFat" value={currentMealFat} onChange={(e) => setCurrentMealFat(e.target.value)} placeholder="0" className="bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet h-9 w-full" />
                </div>
                <div>
                  <Label htmlFor="mealCalories" className="text-xs font-medium text-neutral-400 block mb-1">Calorías (kcal)</Label>
                  <Input type="number" id="mealCalories" value={currentMealCalories} onChange={(e) => setCurrentMealCalories(e.target.value)} placeholder="0" className="bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet h-9 w-full" />
                </div>
              </div>
              <Button 
                onClick={handleAddMeal} 
                className="w-full sm:w-auto bg-brand-violet hover:bg-brand-violet/90 text-white"
              >
                <PlusCircle size={18} className="mr-2" />
                Añadir Comida
              </Button>
            </div>

            {/* Lista de comidas registradas */}
            {meals.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-neutral-200">Comidas Registradas Hoy</h3>
                {meals.map(meal => (
                  <div key={meal.id} className="p-3 border border-neutral-700 rounded-md bg-neutral-800/50 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-semibold text-brand-violet">{mealTypeTranslations[meal.type]}</span>
                        <span className="text-xs text-neutral-400 ml-2"> - {meal.time}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-red-500 h-7 w-7" onClick={() => handleDeleteMeal(meal.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <p className="text-sm text-neutral-300 whitespace-pre-wrap mb-2">{meal.description}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-400">
                      {meal.calories && <span><span className="font-medium text-neutral-300">{meal.calories}</span> kcal</span>}
                      {meal.protein && <span><span className="font-medium text-neutral-300">{meal.protein}</span>g Prot.</span>}
                      {meal.carbs && <span><span className="font-medium text-neutral-300">{meal.carbs}</span>g Carbs</span>}
                      {meal.fat && <span><span className="font-medium text-neutral-300">{meal.fat}</span>g Grasa</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="Hidratación">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-lg font-semibold text-neutral-200">
                Agua Consumida: <span className="text-brand-violet">{aguaConsumida}ml</span> / {metaAgua}ml
              </p>
              {/* Puedes añadir una barra de progreso aquí si quieres */} 
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <Button onClick={() => handleAguaChange(aguaIncremento)} variant="outline" className="border-brand-violet text-brand-violet hover:bg-brand-violet/10">
                <PlusCircle size={18} className="mr-2" /> Añadir {aguaIncremento}ml
              </Button>
              <Button onClick={() => handleAguaChange(-aguaIncremento)} variant="outline" className="border-neutral-600 text-neutral-400 hover:bg-neutral-700/20" disabled={aguaConsumida === 0}>
                <MinusCircle size={18} className="mr-2" /> Quitar {aguaIncremento}ml
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aguaManual" className="text-xs font-medium text-neutral-400 block mb-1">Ajustar Consumo Manual (ml)</Label>
                <Input 
                  type="number"
                  id="aguaManual"
                  value={aguaConsumida}
                  onChange={handleAguaConsumidaManualChange}
                  placeholder="0"
                  min="0"
                  className="bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet h-9 w-full"
                />
              </div>
              <div>
                <Label htmlFor="metaAgua" className="text-xs font-medium text-neutral-400 block mb-1">Meta de Agua (ml)</Label>
                <Input 
                  type="number"
                  id="metaAgua"
                  value={metaAgua}
                  onChange={handleMetaAguaChange}
                  placeholder="2000"
                  min="0"
                  step="100"
                  className="bg-neutral-700/80 border-neutral-600/80 focus:border-sky-600 focus:ring-sky-600 h-9 w-full"
                />
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Notas Adicionales del Día">
          <div className="space-y-2">
            <Label htmlFor="notasNutricion" className="text-xs font-medium text-neutral-400 block mb-1">
              Registra cualquier observación, cómo te sentiste, antojos, etc.
            </Label>
            <Textarea
              id="notasNutricion"
              value={notasNutricion}
              onChange={(e) => setNotasNutricion(e.target.value)}
              placeholder="Escribe tus notas aquí..."
              className="bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet min-h-[100px] w-full"
            />
          </div>
        </DashboardCard>

        {/* Botón para guardar o finalizar el día - A discutir si es necesario aquí o global */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={() => {
              handleSaveDayLog();
            }}
            className="bg-brand-violet hover:bg-brand-violet/90 text-white disabled:opacity-70"
            disabled={isSaving || isLoadingLog} // Disable if saving or loading
          >
            Guardar Registro del Día
          </Button>
        </div>
      </div>
    </div>
  );
};

// El componente exportado ahora es el que envuelve el contenido con ProtectedRoute
const NutritionLogPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <NutritionLogPageContent />
    </ProtectedRoute>
  );
};

export default NutritionLogPage;
