import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Wand2, 
  Target, 
  Clock, 
  User, 
  Brain, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  TrendingUp,
  Heart,
  Dumbbell,
  Apple,
  LucideIcon
} from 'lucide-react';
import { toast } from "sonner";
import { createUserProgram, type CreateProgramRequest, type UserProgram } from "../utils/supabaseClient";
import { useAppContext } from "./AppProvider";
import { apiClient } from "../utils/apiClient";

interface ProgramGoal {
  id: string;
  label: string;
  description: string;
  category: 'fitness' | 'nutrition' | 'wellness' | 'longevity';
  icon: LucideIcon;
}

interface ProgramPreference {
  id: string;
  label: string;
  category: 'workout_type' | 'diet_style' | 'schedule' | 'intensity' | 'calories' | 'cooking' | 'budget';
  options: string[];
}

interface AIGeneratedProgram {
  program_name: string;
  program_type: 'PRIME' | 'LONGEVITY' | 'NUTRITION' | 'CUSTOM' | 'HYBRID';
  program_description: string;
  estimated_duration_weeks: number;
  goals: any;
  preferences: any;
  weekly_structure: {
    week: number;
    focus: string;
    milestones: string[];
    content_recommendations: string[];
  }[];
  success_metrics: string[];
  ai_rationale: string;
}

const FITNESS_GOALS: ProgramGoal[] = [
  { id: 'weight_loss', label: 'Pérdida de Peso', description: 'Reducir grasa corporal de forma saludable', category: 'fitness', icon: TrendingUp },
  { id: 'muscle_gain', label: 'Ganancia Muscular', description: 'Aumentar masa muscular magra', category: 'fitness', icon: Dumbbell },
  { id: 'endurance', label: 'Resistencia', description: 'Mejorar capacidad cardiovascular', category: 'fitness', icon: Heart },
  { id: 'strength', label: 'Fuerza', description: 'Incrementar fuerza física general', category: 'fitness', icon: Dumbbell },
  { id: 'energy_boost', label: 'Más Energía', description: 'Aumentar niveles de energía diaria', category: 'wellness', icon: Sparkles },
  { id: 'stress_management', label: 'Manejo del Estrés', description: 'Reducir estrés y ansiedad', category: 'wellness', icon: Brain },
  { id: 'longevity', label: 'Longevidad', description: 'Optimizar salud a largo plazo', category: 'longevity', icon: Heart },
];

const NUTRITION_GOALS: ProgramGoal[] = [
  { id: 'fat_loss_nutrition', label: 'Pérdida de Grasa', description: 'Plan nutricional para déficit calórico saludable', category: 'nutrition', icon: TrendingUp },
  { id: 'muscle_nutrition', label: 'Ganancia Muscular', description: 'Nutrición optimizada para hipertrofia', category: 'nutrition', icon: Dumbbell },
  { id: 'energy_nutrition', label: 'Optimizar Energía', description: 'Mejorar niveles de energía a través de la alimentación', category: 'nutrition', icon: Sparkles },
  { id: 'digestive_health', label: 'Salud Digestiva', description: 'Mejorar digestión y salud intestinal', category: 'nutrition', icon: Apple },
  { id: 'blood_sugar', label: 'Control Glucémico', description: 'Estabilizar niveles de azúcar en sangre', category: 'nutrition', icon: Heart },
  { id: 'inflammation', label: 'Reducir Inflamación', description: 'Dieta antiinflamatoria para bienestar general', category: 'nutrition', icon: Apple },
  { id: 'sports_nutrition', label: 'Nutrición Deportiva', description: 'Alimentación para rendimiento atlético', category: 'nutrition', icon: Dumbbell },
  { id: 'hormonal_balance', label: 'Balance Hormonal', description: 'Nutrición para equilibrio hormonal', category: 'nutrition', icon: Heart },
];

const FITNESS_PREFERENCES: ProgramPreference[] = [
  {
    id: 'workout_intensity',
    label: 'Intensidad de Entrenamiento',
    category: 'intensity',
    options: ['Principiante', 'Intermedio', 'Avanzado', 'Élite']
  },
  {
    id: 'workout_frequency',
    label: 'Frecuencia Semanal',
    category: 'schedule',
    options: ['2-3 días', '4-5 días', '6-7 días', 'Adaptativo']
  },
  {
    id: 'workout_type',
    label: 'Tipo de Entrenamiento',
    category: 'workout_type',
    options: ['Pesas', 'Cardio', 'HIIT', 'Funcional', 'Yoga', 'Mixto']
  },
  {
    id: 'workout_duration',
    label: 'Duración por Sesión',
    category: 'schedule',
    options: ['30 minutos', '45 minutos', '60 minutos', '90 minutos', 'Flexible']
  }
];

const NUTRITION_PREFERENCES: ProgramPreference[] = [
  {
    id: 'diet_approach',
    label: 'Enfoque Nutricional',
    category: 'diet_style',
    options: ['Mediterránea', 'Cetogénica', 'Paleo', 'Vegetariana', 'Vegana', 'Flexitariana', 'Ayuno Intermitente']
  },
  {
    id: 'caloric_goal',
    label: 'Objetivo Calórico',
    category: 'calories',
    options: ['Déficit (Perder peso)', 'Mantenimiento', 'Superávit (Ganar peso)', 'Adaptativo']
  },
  {
    id: 'meal_frequency',
    label: 'Frecuencia de Comidas',
    category: 'schedule',
    options: ['3 comidas principales', '5-6 comidas pequeñas', 'Ayuno intermitente 16:8', 'Ayuno intermitente 18:6', 'Flexible']
  },
  {
    id: 'cooking_time',
    label: 'Tiempo de Preparación',
    category: 'cooking',
    options: ['Menos de 15 min', '15-30 min', '30-60 min', 'Sin restricción', 'Meal prep semanal']
  },
  {
    id: 'food_budget',
    label: 'Presupuesto Alimentario',
    category: 'budget',
    options: ['Económico', 'Moderado', 'Premium', 'Sin restricción']
  }
];

interface Props {
  onProgramCreated: (program: UserProgram) => void;
  triggerButton?: React.ReactNode;
  programType?: 'fitness' | 'nutrition';
}

const ProgramWizard: React.FC<Props> = ({ onProgramCreated, triggerButton, programType = 'fitness' }) => {
  const { currentUserId } = useAppContext();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);
  
  // Form data
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState({
    experience_level: '',
    health_conditions: '',
    time_availability: '',
    equipment_access: '',
    motivation_factors: ''
  });
  
  // AI Generated program
  const [aiGeneratedProgram, setAiGeneratedProgram] = useState<AIGeneratedProgram | null>(null);

  // Dynamic content based on program type
  const currentGoals = programType === 'nutrition' ? NUTRITION_GOALS : FITNESS_GOALS;
  const currentPreferences = programType === 'nutrition' ? NUTRITION_PREFERENCES : FITNESS_PREFERENCES;
  const programTypeLabel = programType === 'nutrition' ? 'Nutrición' : 'Fitness';
  const programIcon = programType === 'nutrition' ? Apple : Dumbbell;

  const totalSteps = 4;
  const isStepValid = () => {
    switch (currentStep) {
      case 1: return selectedGoals.length > 0;
      case 2: return Object.keys(selectedPreferences).length >= 2;
      case 3: return customInputs.experience_level !== '' && customInputs.time_availability !== '';
      case 4: return aiGeneratedProgram !== null;
      default: return false;
    }
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handlePreferenceChange = (preferenceId: string, value: string) => {
    setSelectedPreferences(prev => ({
      ...prev,
      [preferenceId]: value
    }));
  };

  const handleCustomInputChange = (field: string, value: string) => {
    setCustomInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAIProgram = async () => {
    if (!currentUserId) {
      toast.error("Error: Usuario no autenticado");
      return;
    }

    setIsGeneratingProgram(true);
    
    try {
      // Prepare data for AI
      const selectedGoalObjects = currentGoals.filter(goal => selectedGoals.includes(goal.id));
      
      const promptData = {
        program_type: programType,
        goals: selectedGoalObjects.map(g => ({ id: g.id, label: g.label, category: g.category })),
        preferences: selectedPreferences,
        user_profile: customInputs,
        user_id: currentUserId
      };

      const response = await apiClient.post('/api/ai/generate-program', promptData);
      
      if (response.success && response.data) {
        setAiGeneratedProgram(response.data);
        setCurrentStep(4);
        toast.success("¡Programa personalizado generado!");
      } else {
        throw new Error(response.error || 'Error generating program');
      }
    } catch (error) {
      console.error('Error generating AI program:', error);
      toast.error('Error al generar el programa. Inténtalo de nuevo.');
    } finally {
      setIsGeneratingProgram(false);
    }
  };

  const createProgram = async () => {
    if (!currentUserId || !aiGeneratedProgram) {
      toast.error("Error: Datos incompletos");
      return;
    }

    setIsCreatingProgram(true);

    try {
      const programData: CreateProgramRequest = {
        program_name: aiGeneratedProgram.program_name,
        program_type: aiGeneratedProgram.program_type,
        program_description: aiGeneratedProgram.program_description,
        estimated_duration_weeks: aiGeneratedProgram.estimated_duration_weeks,
        goals: {
          selected_goals: selectedGoals,
          goal_details: aiGeneratedProgram.goals,
          success_metrics: aiGeneratedProgram.success_metrics
        },
        preferences: {
          user_preferences: selectedPreferences,
          custom_inputs: customInputs,
          weekly_structure: aiGeneratedProgram.weekly_structure
        }
      };

      const createdProgram = await createUserProgram(currentUserId, programData);
      
      toast.success("¡Programa creado exitosamente!");
      onProgramCreated(createdProgram);
      setIsOpen(false);
      resetWizard();
      
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error('Error al crear el programa. Inténtalo de nuevo.');
    } finally {
      setIsCreatingProgram(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedGoals([]);
    setSelectedPreferences({});
    setCustomInputs({
      experience_level: '',
      health_conditions: '',
      time_availability: '',
      equipment_access: '',
      motivation_factors: ''
    });
    setAiGeneratedProgram(null);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        {React.createElement(programIcon, { className: "w-12 h-12 text-brand-violet mx-auto mb-4" })}
        <h3 className="text-xl font-semibold text-white mb-2">Objetivos de {programTypeLabel}</h3>
        <p className="text-neutral-400">
          Selecciona los objetivos específicos que quieres lograr con tu programa de {programTypeLabel.toLowerCase()}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentGoals.map((goal) => (
          <Card 
            key={goal.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedGoals.includes(goal.id)
                ? 'bg-brand-violet/20 border-brand-violet shadow-lg'
                : 'bg-neutral-800/60 border-neutral-700 hover:border-neutral-600'
            }`}
            onClick={() => handleGoalToggle(goal.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <goal.icon 
                  size={24} 
                  className={selectedGoals.includes(goal.id) ? 'text-brand-violet' : 'text-neutral-400'} 
                />
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{goal.label}</h4>
                  <p className="text-sm text-neutral-400">{goal.description}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {goal.category}
                  </Badge>
                </div>
                {selectedGoals.includes(goal.id) && (
                  <CheckCircle2 size={20} className="text-brand-violet" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 text-brand-violet mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Preferencias de {programTypeLabel}</h3>
        <p className="text-neutral-400">
          Personaliza tu programa de {programTypeLabel.toLowerCase()} según tus preferencias específicas
        </p>
      </div>
      
      <div className="space-y-4">
        {currentPreferences.map((preference) => (
          <div key={preference.id} className="space-y-2">
            <label className="text-sm font-medium text-white">{preference.label}</label>
            <Select 
              value={selectedPreferences[preference.id] || ''} 
              onValueChange={(value) => handlePreferenceChange(preference.id, value)}
            >
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue placeholder={`Selecciona ${preference.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {preference.options.map((option) => (
                  <SelectItem 
                    key={option} 
                    value={option}
                    className="text-white hover:bg-neutral-700"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="w-12 h-12 text-brand-violet mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Información Personal</h3>
        <p className="text-neutral-400">
          Ayúdanos a personalizar tu programa de {programTypeLabel.toLowerCase()} con información específica
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            Nivel de Experiencia *
          </label>
          <Select 
            value={customInputs.experience_level} 
            onValueChange={(value) => handleCustomInputChange('experience_level', value)}
          >
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Selecciona tu nivel" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="beginner" className="text-white hover:bg-neutral-700">
                Principiante (0-6 meses)
              </SelectItem>
              <SelectItem value="intermediate" className="text-white hover:bg-neutral-700">
                Intermedio (6 meses - 2 años)
              </SelectItem>
              <SelectItem value="advanced" className="text-white hover:bg-neutral-700">
                Avanzado (2+ años)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            Disponibilidad de Tiempo *
          </label>
          <Select 
            value={customInputs.time_availability} 
            onValueChange={(value) => handleCustomInputChange('time_availability', value)}
          >
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="¿Cuánto tiempo tienes disponible?" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="30min" className="text-white hover:bg-neutral-700">
                30 minutos al día
              </SelectItem>
              <SelectItem value="45min" className="text-white hover:bg-neutral-700">
                45 minutos al día
              </SelectItem>
              <SelectItem value="1hour" className="text-white hover:bg-neutral-700">
                1 hora al día
              </SelectItem>
              <SelectItem value="1.5hours" className="text-white hover:bg-neutral-700">
                1.5 horas al día
              </SelectItem>
              <SelectItem value="flexible" className="text-white hover:bg-neutral-700">
                Horario flexible
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            {programType === 'nutrition' ? 'Restricciones Alimentarias y Condiciones de Salud' : 'Condiciones de Salud o Limitaciones'}
          </label>
          <Textarea
            value={customInputs.health_conditions}
            onChange={(e) => handleCustomInputChange('health_conditions', e.target.value)}
            placeholder={
              programType === 'nutrition' 
                ? "Describe alergias, intolerancias, condiciones médicas, medicamentos que puedan afectar tu nutrición..."
                : "Describe cualquier condición médica, lesión o limitación física que debamos considerar..."
            }
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            {programType === 'nutrition' ? 'Preferencias y Contexto Alimentario' : 'Equipamiento Disponible'}
          </label>
          <Textarea
            value={customInputs.equipment_access}
            onChange={(e) => handleCustomInputChange('equipment_access', e.target.value)}
            placeholder={
              programType === 'nutrition'
                ? "Describe tus preferencias alimentarias, horarios de comida, acceso a alimentos, habilidades culinarias..."
                : "Describe el equipamiento que tienes disponible (gimnasio, pesas en casa, etc.)..."
            }
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            rows={2}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            ¿Qué te motiva?
          </label>
          <Textarea
            value={customInputs.motivation_factors}
            onChange={(e) => handleCustomInputChange('motivation_factors', e.target.value)}
            placeholder="Cuéntanos qué te motiva a entrenar y mantener un estilo de vida saludable..."
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    if (isGeneratingProgram) {
      return (
        <div className="space-y-6 text-center">
          <Brain className="w-16 h-16 text-brand-violet mx-auto animate-pulse" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Generando tu Programa Personalizado</h3>
            <p className="text-neutral-400 mb-6">La IA está analizando tus objetivos y preferencias...</p>
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4 mx-auto bg-neutral-700" />
              <Skeleton className="h-4 w-1/2 mx-auto bg-neutral-700" />
              <Skeleton className="h-4 w-2/3 mx-auto bg-neutral-700" />
            </div>
          </div>
        </div>
      );
    }

    if (!aiGeneratedProgram) {
      return (
        <div className="space-y-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Error al Generar Programa</h3>
            <p className="text-neutral-400 mb-6">Hubo un problema al generar tu programa. Inténtalo de nuevo.</p>
            <Button onClick={generateAIProgram} variant="outline">
              Reintentar Generación
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-brand-violet mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">¡Tu Programa Está Listo!</h3>
          <p className="text-neutral-400">Revisa los detalles de tu programa personalizado</p>
        </div>

        <Card className="bg-neutral-800/60 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">{aiGeneratedProgram.program_name}</CardTitle>
            <CardDescription className="text-neutral-400">
              {aiGeneratedProgram.program_description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-brand-violet/20 text-brand-violet">
                {aiGeneratedProgram.program_type}
              </Badge>
              <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                {aiGeneratedProgram.estimated_duration_weeks} semanas
              </Badge>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">Métricas de Éxito:</h4>
              <ul className="list-disc list-inside text-sm text-neutral-400 space-y-1">
                {aiGeneratedProgram.success_metrics.map((metric, index) => (
                  <li key={index}>{metric}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">Justificación de la IA:</h4>
              <p className="text-sm text-neutral-400">{aiGeneratedProgram.ai_rationale}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="bg-brand-violet hover:bg-brand-violet/80 text-white">
            <Wand2 size={16} className="mr-2" />
            Crear Programa con IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Crear Programa de {programTypeLabel} con IA
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Paso {currentStep} de {totalSteps}: Vamos a crear un programa de {programTypeLabel.toLowerCase()} completamente personalizado para ti
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-700 rounded-full h-2 mb-6">
          <div 
            className="bg-brand-violet h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="py-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-neutral-700">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 1) {
                setIsOpen(false);
              } else {
                setCurrentStep(prev => prev - 1);
              }
            }}
            disabled={isGeneratingProgram || isCreatingProgram}
          >
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          <div className="space-x-2">
            {currentStep < 3 && (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!isStepValid()}
                className="bg-brand-violet hover:bg-brand-violet/80"
              >
                Siguiente
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                onClick={generateAIProgram}
                disabled={!isStepValid() || isGeneratingProgram}
                className="bg-brand-violet hover:bg-brand-violet/80"
              >
                {isGeneratingProgram ? (
                  <>
                    <Brain size={16} className="mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} className="mr-2" />
                    Generar con IA
                  </>
                )}
              </Button>
            )}

            {currentStep === 4 && aiGeneratedProgram && (
              <Button
                onClick={createProgram}
                disabled={isCreatingProgram}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isCreatingProgram ? (
                  <>
                    <Plus size={16} className="mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Crear Programa
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramWizard;