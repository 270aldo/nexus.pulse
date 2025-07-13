import React, { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, ChevronLeft, PlusCircle } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { toast, Toaster } from "sonner";
import DashboardCard from "@/components/DashboardCard";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BiometricMetric {
  value: string; 
  label: string;
  inputType: "number" | "text" | "select";
  unit?: string;
  selectOptions?: { value: string; label: string }[];
}

const biometricMetrics: BiometricMetric[] = [
  { value: "sleep_hours", label: "Horas de Sueño", inputType: "number", unit: "horas" },
  { 
    value: "sleep_quality", 
    label: "Calidad del Sueño", 
    inputType: "select", 
    unit: "categoría",
    selectOptions: [
      { value: "Excelente", label: "Excelente (5/5)" },
      { value: "Buena", label: "Buena (4/5)" },
      { value: "Regular", label: "Regular (3/5)" },
      { value: "Mala", label: "Mala (2/5)" },
      { value: "Muy Mala", label: "Muy Mala (1/5)" },
    ]
  },
  { value: "steps", label: "Pasos Diarios", inputType: "number", unit: "pasos" },
  { value: "rhr", label: "Frecuencia Cardíaca en Reposo (RHR)", inputType: "number", unit: "bpm" },
  { value: "hrv", label: "Variabilidad de la Frecuencia Cardíaca (HRV)", inputType: "number", unit: "ms" },
  { value: "weight", label: "Peso Corporal", inputType: "number", unit: "kg" },
  { 
    value: "energy_level", 
    label: "Nivel de Energía (Subjetivo)", 
    inputType: "select", 
    unit: "categoría",
    selectOptions: [
      { value: "Muy Alto", label: "Muy Alto (5/5)" },
      { value: "Alto", label: "Alto (4/5)" },
      { value: "Medio", label: "Medio (3/5)" },
      { value: "Bajo", label: "Bajo (2/5)" },
      { value: "Muy Bajo", label: "Muy Bajo (1/5)" },
    ]
  },
  { 
    value: "stress_level", 
    label: "Nivel de Estrés (Subjetivo)", 
    inputType: "select", 
    unit: "categoría",
    selectOptions: [
      { value: "Muy Bajo", label: "Muy Bajo (1/5)" },
      { value: "Bajo", label: "Bajo (2/5)" },
      { value: "Medio", label: "Medio (3/5)" },
      { value: "Alto", label: "Alto (4/5)" },
      { value: "Muy Alto", label: "Muy Alto (5/5)" },
    ]
  },
];

const BiometricLogPageContent: React.FC = () => {
  const [entryDate, setEntryDate] = useState<Date | undefined>(new Date());
  const [selectedMetricType, setSelectedMetricType] = useState<string | undefined>(biometricMetrics[0].value);
  const [numericValue, setNumericValue] = useState<string>("");
  const [textValue, setTextValue] = useState<string>(""); // Used for select type as well
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        toast.error("Usuario no autenticado. Redirigiendo al login.");
        navigate("/auth");
      }
    };
    getUser();
  }, [navigate]);

  const currentMetric = biometricMetrics.find(m => m.value === selectedMetricType);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId || !entryDate || !currentMetric) {
      toast.error("Por favor, complete todos los campos requeridos y asegúrese de estar autenticado.");
      return;
    }

    let valueToSaveNumeric: number | null = null;
    let valueToSaveText: string | null = null;

    if (currentMetric.inputType === "number") {
      if (!numericValue || isNaN(parseFloat(numericValue))) {
        toast.error("Por favor, ingrese un valor numérico válido.");
        return;
      }
      valueToSaveNumeric = parseFloat(numericValue);
    } else { // "text" or "select"
      if (!textValue) {
        toast.error("Por favor, ingrese o seleccione un valor.");
        return;
      }
      valueToSaveText = textValue;
    }
    
    setIsLoading(true);

    const { error } = await supabase.from("biometric_entries").insert({
      user_id: userId,
      metric_type: currentMetric.value,
      value_numeric: valueToSaveNumeric,
      value_text: valueToSaveText,
      unit: currentMetric.unit,
      entry_date: format(entryDate, "yyyy-MM-dd"),
      source: "manual",
    });

    setIsLoading(false);

    if (error) {
      console.error("Error saving biometric entry:", error);
      toast.error(`Error al guardar: ${error.message}`);
    } else {
      toast.success(`Métrica '${currentMetric.label}' guardada exitosamente.`);
      setSelectedMetricType(biometricMetrics[0].value);
      setNumericValue("");
      setTextValue("");
    }
  };
  
  const getPlaceholder = () => {
    if (!currentMetric) return "";
    if (currentMetric.unit === "kg") return "Ej: 70.5";
    if (currentMetric.unit === "pasos") return "Ej: 10000";
    if (currentMetric.unit === "bpm") return "Ej: 58";
    if (currentMetric.unit === "ms") return "Ej: 62";
    if (currentMetric.unit === "horas") return "Ej: 7.5";
    return "Ingrese el valor";
  };

  const renderValueInput = () => {
    if (!currentMetric) return null;

    if (currentMetric.inputType === "number") {
      return (
        <div>
          <Label htmlFor="numericValue" className="text-xs font-medium text-neutral-400 block mb-1">Valor ({currentMetric.unit})</Label>
          <Input
            id="numericValue"
            type="number"
            value={numericValue}
            onChange={(e) => setNumericValue(e.target.value)}
            placeholder={getPlaceholder()}
            className="mt-1 bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet text-neutral-100 placeholder:text-neutral-500 h-9"
            required
          />
        </div>
      );
    }

    if (currentMetric.inputType === "select" && currentMetric.selectOptions) {
      return (
        <div>
          <Label htmlFor="textValueSelect" className="text-xs font-medium text-neutral-400 block mb-1">Valor ({currentMetric.unit})</Label>
          <Select
            value={textValue} // textValue is used for select as well
            onValueChange={setTextValue} // Use onValueChange for Select
            required
          >
            <SelectTrigger id="textValueSelect" className="w-full mt-1 bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet text-neutral-100 placeholder:text-neutral-500 h-9">
              <SelectValue placeholder={`Seleccione ${currentMetric.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100">
              {currentMetric.selectOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="hover:bg-neutral-600/80 focus:bg-neutral-600/80 cursor-pointer">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    // Fallback for general "text" input type (not currently used by predefined metrics)
    return (
      <div>
        <Label htmlFor="textValueInput" className="text-xs font-medium text-neutral-400 block mb-1">Valor</Label>
        <Input
          id="textValueInput"
          type="text"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="Ingrese el valor"
          className="mt-1 bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet text-neutral-100 placeholder:text-neutral-500 h-9"
          required
        />
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-neutral-100 p-4 sm:p-6 lg:p-8 font-sans">
      
      <Toaster richColors position="top-right" />
      <header className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 text-neutral-300 hover:bg-neutral-700/50 hover:text-neutral-100"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-3xl font-bold text-brand-violet tracking-tight">
            Registro Biométrico
          </h1>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full sm:w-[280px] justify-start text-left font-normal bg-neutral-800/60 border-neutral-700 hover:bg-neutral-700/80 hover:text-neutral-100 text-neutral-200 disabled:opacity-70"
              disabled={isLoading}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-brand-violet" />
              {entryDate ? format(entryDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700 shadow-xl">
            <Calendar
              mode="single"
              selected={entryDate}
              onSelect={setEntryDate}
              initialFocus
              className="text-neutral-200 [&_button:hover]:bg-neutral-700/70 [&_button[aria-selected=true]]:bg-brand-violet [&_button[aria-selected=true]]:text-white"
              locale={es}
              disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
            />
          </PopoverContent>
        </Popover>
      </header>

      <DashboardCard title="Registrar Nueva Métrica">
        <form onSubmit={handleSubmit} className="space-y-6">
 {/* Date Popover moved to header */}

          <div>
            <Label htmlFor="metricType" className="text-xs font-medium text-neutral-400 block mb-1">Tipo de Métrica</Label>
            <Select
              value={selectedMetricType}
              onValueChange={(value) => {
                setSelectedMetricType(value);
                setNumericValue(""); 
                setTextValue("");
              }}
              required
            >
              <SelectTrigger id="metricType" className="w-full mt-1 bg-neutral-700/80 border-neutral-600/80 focus:border-brand-violet focus:ring-brand-violet text-neutral-100 placeholder:text-neutral-500 h-9">
                <SelectValue placeholder="Seleccione un tipo de métrica" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-700 border-neutral-600 text-neutral-100">
                {biometricMetrics.map(metric => (
                  <SelectItem key={metric.value} value={metric.value} className="hover:bg-neutral-600/80 focus:bg-neutral-600/80 cursor-pointer">
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {renderValueInput()}

          <Button 
            type="submit" 
            className="w-full sm:w-auto bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold py-2.5 px-6"
            disabled={isLoading || !userId}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <PlusCircle size={18} className="mr-2" />
                Guardar Métrica
              </>
            )}
          </Button>
        </form>
      </DashboardCard>
    </div>
  );
};

const BiometricLogPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <BiometricLogPageContent />
    </ProtectedRoute>
  );
};

export default BiometricLogPage;
