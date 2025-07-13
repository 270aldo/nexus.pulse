import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DashboardCard from "@/components/DashboardCard";
import ProtectedRoute from "../components/ProtectedRoute";
import BackButton from "@/components/BackButton"; // Importar BackButton
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, PlusCircle, Trash2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "../utils/supabaseClient";
import { useAppContext } from "../components/AppProvider";

// --- Tipos e Interfaces ---
interface DailyStateEntry {
  id?: string; // ID de Supabase para registros_estado_diario
  fecha_registro: string; // YYYY-MM-DD
  recuperacion_general?: number; // 1-10
  horas_sueno?: number; // 7.5
  calidad_sueno_percibida?: number; // 1-5
  nivel_energia?: number; // 1-10
  nivel_enfoque?: number; // 1-10
}

interface MusclePainItem {
  id?: string; // ID de Supabase para items_dolor_muscular_diario (si se edita uno existente)
  frontend_id: string; // ID temporal para manejo en UI
  zona_corporal: string;
  intensidad_dolor: number; // 1-5
}

const ZONAS_CORPORALES = [
  "Hombro Izquierdo", "Hombro Derecho", "Hombros (Ambos)",
  "Codo Izquierdo", "Codo Derecho", "Codos (Ambos)",
  "Muñeca Izquierda", "Muñeca Derecha", "Muñecas (Ambas)",
  "Cuello", "Espalda Alta", "Espalda Media", "Espalda Baja",
  "Cadera/Glúteo Izquierdo", "Cadera/Glúteo Derecho", "Caderas/Glúteos (Ambos)",
  "Rodilla Izquierda", "Rodilla Derecha", "Rodillas (Ambas)",
  "Tobillo Izquierdo", "Tobillo Derecho", "Tobillos (Ambos)",
  "Pie Izquierdo", "Pie Derecho", "Pies (Ambos)",
  "Pecho", "Abdomen",
  "Bícep Izquierdo", "Bícep Derecho", "Bíceps (Ambos)",
  "Trícep Izquierdo", "Trícep Derecho", "Tríceps (Ambos)",
  "Antebrazo Izquierdo", "Antebrazo Derecho", "Antebrazos (Ambos)",
  "Cuádricep Izquierdo", "Cuádricep Derecho", "Cuádriceps (Ambos)",
  "Isquiotibial Izquierdo", "Isquiotibial Derecho", "Isquiotibiales (Ambos)",
  "Aductor Izquierdo", "Aductor Derecho", "Aductores (Ambos)",
  "Gemelo Izquierdo", "Gemelo Derecho", "Gemelos (Ambos)",
  "Otro (Especificar)"
];

const DailyCheckinPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [dailyStateId, setDailyStateId] = useState<string | undefined>(undefined);
  const [recovery, setRecovery] = useState<number | undefined>(undefined);
  const [sleepHours, setSleepHours] = useState<string>("");
  const [sleepQuality, setSleepQuality] = useState<number | undefined>(undefined);
  const [energyLevel, setEnergyLevel] = useState<number | undefined>(undefined);
  const [focusLevel, setFocusLevel] = useState<number | undefined>(undefined);
  const [musclePainItems, setMusclePainItems] = useState<MusclePainItem[]>([]);

  const resetForm = useCallback(() => {
    setDailyStateId(undefined);
    setRecovery(undefined);
    setSleepHours("");
    setSleepQuality(undefined);
    setEnergyLevel(undefined);
    setFocusLevel(undefined);
    setMusclePainItems([]);
  }, []);

  useEffect(() => {
    const loadDailyCheckinData = async () => {
      if (!selectedDate || !session?.user?.id) {
        resetForm();
        return;
      }

      setIsLoadingData(true);
      resetForm(); // Resetea antes de cargar nuevos datos

      const dateString = format(selectedDate, "yyyy-MM-dd");

      try {
        // Cargar registros_estado_diario
        const { data: dailyStateData, error: dailyStateError } = await supabase
          .from("registros_estado_diario")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("fecha_registro", dateString)
          .single(); // Esperamos un solo registro o ninguno

        if (dailyStateError && dailyStateError.code !== "PGRST116") { // PGRST116: no rows found
          console.error("Error cargando estado diario:", dailyStateError);
          toast.error("Error al cargar los datos del día.");
          setIsLoadingData(false);
          return;
        }

        if (dailyStateData) {
          setDailyStateId(dailyStateData.id);
          setRecovery(dailyStateData.recuperacion_general ?? undefined);
          setSleepHours(dailyStateData.horas_sueno?.toString() ?? "");
          setSleepQuality(dailyStateData.calidad_sueno_percibida ?? undefined);
          setEnergyLevel(dailyStateData.nivel_energia ?? undefined);
          setFocusLevel(dailyStateData.nivel_enfoque ?? undefined);

          // Cargar items_dolor_muscular_diario asociados
          const { data: painItemsData, error: painItemsError } = await supabase
            .from("items_dolor_muscular_diario")
            .select("*")
            .eq("registro_estado_diario_id", dailyStateData.id);

          if (painItemsError) {
            console.error("Error cargando items de dolor:", painItemsError);
            toast.error("Error al cargar los detalles de dolor muscular.");
          } else if (painItemsData) {
            setMusclePainItems(painItemsData.map(item => ({
              ...item,
              frontend_id: uuidv4(), // Asignamos un frontend_id para manejo en UI
              intensidad_dolor: item.intensidad_dolor ?? 1 // Asegurar valor por defecto
            })));
          }
        } else {
          // No hay datos para este día, el formulario estará vacío para nuevo ingreso
          setDailyStateId(undefined); // Asegurar que no hay ID si no hay datos
        }

      } catch (error) {
        console.error("Error inesperado cargando datos:", error);
        toast.error("Ocurrió un error inesperado al cargar los datos.");
      }
      setIsLoadingData(false);
    };

    loadDailyCheckinData();
  }, [selectedDate, session, resetForm]);

  const handleAddMusclePainItem = () => {
    setMusclePainItems([
      ...musclePainItems,
      { frontend_id: uuidv4(), zona_corporal: "", intensidad_dolor: 1 }
    ]);
  };

  const handleRemoveMusclePainItem = (frontend_id: string) => {
    setMusclePainItems(musclePainItems.filter(item => item.frontend_id !== frontend_id));
  };

  const handleMusclePainItemChange = (frontend_id: string, field: keyof MusclePainItem, value: string | number) => {
    setMusclePainItems(musclePainItems.map(item =>
      item.frontend_id === frontend_id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    if (!selectedDate || !session?.user?.id) {
      toast.error("No se ha seleccionado una fecha o no se pudo identificar al usuario.");
      return;
    }

    setIsSaving(true);
    const userId = session.user.id;
    const fechaRegistro = format(selectedDate, "yyyy-MM-dd");

    const dailyStatePayload: Omit<DailyStateEntry, "id"> & { user_id: string } = {
      user_id: userId,
      fecha_registro: fechaRegistro,
      recuperacion_general: recovery || undefined,
      horas_sueno: sleepHours ? parseFloat(sleepHours) : undefined,
      calidad_sueno_percibida: sleepQuality || undefined,
      nivel_energia: energyLevel || undefined,
      nivel_enfoque: focusLevel || undefined,
    };

    try {
      let currentDailyStateId = dailyStateId;

      // 1. Guardar o actualizar registros_estado_diario
      if (currentDailyStateId) {
        // Actualizar
        const { error: updateError } = await supabase
          .from("registros_estado_diario")
          .update(dailyStatePayload)
          .eq("id", currentDailyStateId)
          .eq("user_id", userId);
        if (updateError) throw updateError;
        toast.success("Check-in diario actualizado con éxito.");
      } else {
        // Insertar
        const { data: insertData, error: insertError } = await supabase
          .from("registros_estado_diario")
          .insert(dailyStatePayload)
          .select("id")
          .single();
        if (insertError) throw insertError;
        if (!insertData?.id) throw new Error("No se pudo obtener el ID del nuevo registro diario.");
        currentDailyStateId = insertData.id;
        setDailyStateId(currentDailyStateId); // Actualizar el ID en el estado para futuras ediciones sin recargar
        toast.success("Check-in diario guardado con éxito.");
      }

      // 2. Manejar items_dolor_muscular_diario
      if (currentDailyStateId) {
        // Borrar items existentes para este registro diario
        const { error: deletePainItemsError } = await supabase
          .from("items_dolor_muscular_diario")
          .delete()
          .eq("registro_estado_diario_id", currentDailyStateId);

        if (deletePainItemsError) {
          console.error("Error borrando items de dolor antiguos:", deletePainItemsError);
          // Continuar igualmente para intentar guardar los nuevos
          toast.warning("Hubo un problema limpiando los registros de dolor anteriores, pero se intentará guardar los nuevos.");
        }

        // Insertar nuevos items si hay alguno
        if (musclePainItems.length > 0) {
          const painItemsToInsert = musclePainItems.map(item => ({
            registro_estado_diario_id: currentDailyStateId,
            user_id: userId, // Asegurar que user_id también esté aquí por si RLS lo necesita directamente
            zona_corporal: item.zona_corporal,
            intensidad_dolor: item.intensidad_dolor,
          }));
          
          const { error: insertPainItemsError } = await supabase
            .from("items_dolor_muscular_diario")
            .insert(painItemsToInsert);

          if (insertPainItemsError) {
            console.error("Error insertando nuevos items de dolor:", insertPainItemsError);
            toast.error("El check-in se guardó/actualizó, pero hubo un error al guardar los detalles de dolor muscular.");
          } else {
            // Actualizar IDs de Supabase en los items del estado (opcional, pero bueno para consistencia si se edita sin recargar)
            // Esto es más complejo porque Supabase no devuelve los IDs en batch insert de esta forma fácilmente.
            // Por ahora, se confía en la recarga de datos si el usuario cambia de fecha y vuelve.
          }
        }
      }
    } catch (error: any) {
      console.error("Error guardando check-in diario:", error);
      toast.error(`Error al guardar: ${error.message || "Error desconocido"}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderScaleSelector = (
    label: string,
    value: number | undefined,
    onChange: (value: number | undefined) => void,
    max: number,
    minLabel: string,
    maxLabel: string
  ) => {
    const options = Array.from({ length: max }, (_, i) => i + 1);
    return (
      <div>
        <Label className="text-xs font-medium text-neutral-400 block mb-2">{label}</Label>
        <RadioGroup
          value={value?.toString()}
          onValueChange={(val) => onChange(val ? parseInt(val) : undefined)}
          className="flex flex-wrap gap-x-3 gap-y-2"
        >
          {options.map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <RadioGroupItem value={level.toString()} id={`${label}-${level}`} className="text-brand-violet border-neutral-600 focus:ring-brand-violet" />
              <Label htmlFor={`${label}-${level}`} className="text-sm font-normal text-neutral-300 cursor-pointer">
                {level}
                {level === 1 && <span className="text-xs ml-1 text-neutral-500">({minLabel})</span>}
                {level === max && <span className="text-xs ml-1 text-neutral-500">({maxLabel})</span>}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-neutral-100 p-4 sm:p-6 lg:p-8 font-sans">
      <Toaster richColors position="bottom-right" />
      <header className="mb-8">
        <BackButton className="mb-4 px-0" /> {/* Reemplazar con BackButton */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-violet via-purple-600 to-fuchsia-600">
          Check-in Diario
        </h1>
        <p className="text-neutral-400 mt-2 text-sm sm:text-base">
          Registra tu estado general, sueño, energía, enfoque y cualquier dolor muscular.
        </p>
      </header>

      <DashboardCard title="Registro del Día" titleClassName="text-xl text-brand-violet">
        <div className="space-y-6 p-2">
          <div className="w-full sm:w-auto max-w-xs">
            <Label htmlFor="checkinDate" className="text-xs font-medium text-neutral-400 block mb-1.5">Fecha del Check-in</Label>
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
                  onSelect={(date) => { setSelectedDate(date); resetForm(); }}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderScaleSelector("Nivel de Recuperación General", recovery, setRecovery, 10, "Muy Mala", "Óptima")}
            {renderScaleSelector("Nivel de Energía", energyLevel, setEnergyLevel, 10, "Sin Energía", "Máxima")}
            {renderScaleSelector("Nivel de Enfoque", focusLevel, setFocusLevel, 10, "Disperso", "Máximo")}
          </div>
          
          <h3 className="text-lg font-semibold text-brand-violet/90 pt-2 border-t border-neutral-700/70">Sueño</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="sleepHours" className="text-xs font-medium text-neutral-400 block mb-1.5">Horas Dormidas</Label>
              <Input 
                type="number"
                id="sleepHours"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="Ej: 7.5"
                min="0"
                step="0.1"
                className="bg-neutral-700/70 border-neutral-600 focus:ring-1 focus:ring-brand-violet h-10"
              />
            </div>
            {renderScaleSelector("Calidad Percibida del Sueño", sleepQuality, setSleepQuality, 5, "Muy Mala", "Excelente")}
          </div>

          <h3 className="text-lg font-semibold text-brand-violet/90 pt-4 border-t border-neutral-700/70">Dolores Musculares</h3>
          {musclePainItems.map((item, index) => (
            <div key={item.frontend_id} className="p-4 border border-neutral-700 rounded-lg bg-neutral-800/50 space-y-3 relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-neutral-500 hover:text-red-500 h-7 w-7"
                onClick={() => handleRemoveMusclePainItem(item.frontend_id)}
              >
                <Trash2 size={16}/>
              </Button>
              <p className="text-sm font-medium text-neutral-300">Item de Dolor #{index + 1}</p>
              <div>
                <Label htmlFor={`zona_corporal_${item.frontend_id}`} className="text-xs font-medium text-neutral-400 block mb-1.5">Zona Corporal</Label>
                <Select 
                  value={item.zona_corporal} 
                  onValueChange={(value) => handleMusclePainItemChange(item.frontend_id, 'zona_corporal', value)}
                >
                  <SelectTrigger id={`zona_corporal_${item.frontend_id}`} className="bg-neutral-700/70 border-neutral-600 focus:ring-1 focus:ring-brand-violet h-10">
                    <SelectValue placeholder="Selecciona una zona" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100 max-h-60">
                    <SelectGroup>
                      <SelectLabel className="text-neutral-400">Zonas Comunes</SelectLabel>
                      {ZONAS_CORPORALES.map(zona => (
                        <SelectItem key={zona} value={zona} className="hover:bg-neutral-700 focus:bg-neutral-700">{zona}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {renderScaleSelector(
                "Intensidad del Dolor", 
                item.intensidad_dolor, 
                (value) => handleMusclePainItemChange(item.frontend_id, 'intensidad_dolor', value ?? 1), 
                5, 
                "Leve", 
                "Severo"
              )}
            </div>
          ))}
          <Button 
            variant="outline" 
            onClick={handleAddMusclePainItem}
            className="w-full sm:w-auto border-dashed border-neutral-600 text-neutral-400 hover:text-brand-violet hover:border-brand-violet/80"
          >
            <PlusCircle size={16} className="mr-2"/>
            Añadir Zona de Dolor
          </Button>
          
          <div className="pt-6 border-t border-neutral-700/70">
            <Button 
              onClick={handleSubmit} 
              className="w-full sm:w-auto bg-brand-violet hover:bg-brand-violet/90 text-white disabled:opacity-70"
              disabled={isSaving || isLoadingData}
            >
              <Save size={18} className="mr-2" />
              {isSaving ? "Guardando..." : (dailyStateId ? "Actualizar Check-in" : "Guardar Check-in")}
            </Button>
          </div>

        </div>
      </DashboardCard>
    </div>
  );
};

const DailyCheckinPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DailyCheckinPageContent />
    </ProtectedRoute>
  );
};

export default DailyCheckinPage;
