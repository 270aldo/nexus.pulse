// Mock AI Service for Program Generation
// This simulates the AI program generation until the real backend is implemented

interface ProgramGoal {
  id: string;
  label: string;
  category: string;
}

interface GenerateProgramRequest {
  program_type: 'fitness' | 'nutrition';
  goals: ProgramGoal[];
  preferences: Record<string, string>;
  user_profile: {
    experience_level: string;
    health_conditions: string;
    time_availability: string;
    equipment_access: string;
    motivation_factors: string;
  };
  user_id: string;
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

// Program name generators
const FITNESS_PROGRAM_NAMES = [
  "Transformación Elite",
  "Fuerza y Resistencia Pro",
  "Definición Muscular Avanzada",
  "Acondicionamiento Total",
  "Potencia y Agilidad",
  "Fortaleza Funcional"
];

const WELLNESS_PROGRAM_NAMES = [
  "Equilibrio Vital",
  "Bienestar Integral",
  "Mente y Cuerpo Armonía",
  "Energía Renovada",
  "Vida Plena 360",
  "Optimización Personal"
];

const LONGEVITY_PROGRAM_NAMES = [
  "Longevidad Activa",
  "Salud Preventiva Plus",
  "Vitalidad Sostenible",
  "Envejecimiento Saludable",
  "Regeneración Celular",
  "Vida Longeva"
];

const NUTRITION_PROGRAM_NAMES = [
  "Nutrición Inteligente",
  "Alimentación Funcional",
  "Metabolismo Optimizado",
  "Equilibrio Nutricional",
  "Fuel Performance",
  "Bienestar Alimentario",
  "Macro Perfect",
  "Nutrición Consciente",
  "Alimentación Sostenible",
  "Vitality Nutrition"
];

// Mock content recommendations
const FITNESS_CONTENT_RECOMMENDATIONS = [
  "Fundamentos de Entrenamiento Funcional",
  "Técnicas de Recuperación Avanzada",
  "Planificación de Entrenamientos",
  "Biomecánica del Movimiento",
  "Periodización del Entrenamiento",
  "Entrenamiento de Fuerza",
  "Cardio Inteligente",
  "Flexibilidad y Movilidad"
];

const NUTRITION_CONTENT_RECOMMENDATIONS = [
  "Macronutrientes Esenciales",
  "Timing Nutricional",
  "Hidratación Inteligente",
  "Suplementación Estratégica",
  "Recetas Saludables",
  "Meal Prep Eficiente",
  "Micronutrientes Clave",
  "Digestión Optimizada",
  "Balance Hormonal Nutricional",
  "Nutrición Antiinflamatoria"
];

const generateProgramName = (goals: ProgramGoal[], programType: 'fitness' | 'nutrition'): string => {
  if (programType === 'nutrition') {
    return NUTRITION_PROGRAM_NAMES[Math.floor(Math.random() * NUTRITION_PROGRAM_NAMES.length)];
  }

  const fitnessGoals = goals.filter(g => g.category === 'fitness');
  const wellnessGoals = goals.filter(g => g.category === 'wellness');
  const longevityGoals = goals.filter(g => g.category === 'longevity');

  if (longevityGoals.length > 0) {
    return LONGEVITY_PROGRAM_NAMES[Math.floor(Math.random() * LONGEVITY_PROGRAM_NAMES.length)];
  } else if (wellnessGoals.length > fitnessGoals.length) {
    return WELLNESS_PROGRAM_NAMES[Math.floor(Math.random() * WELLNESS_PROGRAM_NAMES.length)];
  } else {
    return FITNESS_PROGRAM_NAMES[Math.floor(Math.random() * FITNESS_PROGRAM_NAMES.length)];
  }
};

const determineProgramType = (goals: ProgramGoal[], programType: 'fitness' | 'nutrition'): 'PRIME' | 'LONGEVITY' | 'NUTRITION' | 'CUSTOM' | 'HYBRID' => {
  if (programType === 'nutrition') {
    return 'NUTRITION';
  }

  const fitnessGoals = goals.filter(g => g.category === 'fitness');
  const wellnessGoals = goals.filter(g => g.category === 'wellness');
  const longevityGoals = goals.filter(g => g.category === 'longevity');
  const nutritionGoals = goals.filter(g => g.category === 'nutrition');

  if (longevityGoals.length > 0 && (fitnessGoals.length > 0 || nutritionGoals.length > 0)) {
    return 'HYBRID';
  } else if (longevityGoals.length > 0) {
    return 'LONGEVITY';
  } else if (fitnessGoals.length > 0 && (wellnessGoals.length > 0 || nutritionGoals.length > 0)) {
    return 'PRIME';
  } else {
    return 'CUSTOM';
  }
};

const generateWeeklyStructure = (
  weeks: number, 
  goals: ProgramGoal[], 
  preferences: Record<string, string>,
  programType: 'fitness' | 'nutrition'
) => {
  const structure = [];
  const primaryGoal = goals[0]?.label || 'Mejora general';
  const contentRecommendations = programType === 'nutrition' ? NUTRITION_CONTENT_RECOMMENDATIONS : FITNESS_CONTENT_RECOMMENDATIONS;
  
  for (let week = 1; week <= Math.min(weeks, 8); week++) {
    let focus = '';
    let milestones = [];
    
    if (programType === 'nutrition') {
      if (week <= 2) {
        focus = 'Fundamentos nutricionales y hábitos';
        milestones = ['Establecer rutina alimentaria', 'Aprender sobre macronutrientes', 'Evaluar hábitos actuales'];
      } else if (week <= 4) {
        focus = 'Optimización de macros y timing';
        milestones = ['Ajustar distribución de macros', 'Mejorar timing nutricional', 'Consolidar meal prep'];
      } else if (week <= 6) {
        focus = 'Personalización y ajustes finos';
        milestones = ['Alcanzar objetivos nutricionales', 'Refinar estrategias alimentarias', 'Evaluar biomarcadores'];
      } else {
        focus = 'Mantenimiento y lifestyle';
        milestones = ['Lograr estilo alimentario sostenible', 'Planificar nutrición a largo plazo', 'Celebrar transformación'];
      }
    } else {
      if (week <= 2) {
        focus = 'Adaptación y fundamentos';
        milestones = ['Establecer rutina de entrenamiento', 'Aprender técnicas básicas', 'Evaluar condición física inicial'];
      } else if (week <= 4) {
        focus = 'Desarrollo e intensificación';
        milestones = ['Aumentar intensidad', 'Mejorar técnica', 'Consolidar hábitos de entrenamiento'];
      } else if (week <= 6) {
        focus = 'Optimización y progreso';
        milestones = ['Alcanzar objetivos intermedios', 'Refinar rutinas', 'Evaluar progreso físico'];
      } else {
        focus = 'Consolidación y mantenimiento';
        milestones = ['Lograr objetivos principales', 'Planificar entrenamiento a largo plazo', 'Celebrar logros físicos'];
      }
    }

    structure.push({
      week,
      focus,
      milestones,
      content_recommendations: contentRecommendations
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
    });
  }
  
  return structure;
};

const generateSuccessMetrics = (goals: ProgramGoal[], preferences: Record<string, string>, programType: 'fitness' | 'nutrition'): string[] => {
  const metrics = [];
  
  goals.forEach(goal => {
    switch (goal.id) {
      // Fitness goals
      case 'weight_loss':
        metrics.push('Reducción de 2-4kg de peso corporal');
        metrics.push('Disminución del porcentaje de grasa corporal');
        break;
      case 'muscle_gain':
        metrics.push('Aumento de 1-2kg de masa muscular');
        metrics.push('Incremento de fuerza en ejercicios principales');
        break;
      case 'endurance':
        metrics.push('Mejora de VO2 máximo en 10-15%');
        metrics.push('Aumento de resistencia cardiovascular');
        break;
      case 'strength':
        metrics.push('Incremento de 20-30% en levantamientos principales');
        metrics.push('Mejora de fuerza funcional');
        break;
      case 'energy_boost':
        metrics.push('Aumento de niveles de energía diaria');
        metrics.push('Mejora de calidad del sueño');
        break;
      case 'stress_management':
        metrics.push('Reducción de niveles de estrés percibido');
        metrics.push('Mejora de técnicas de manejo del estrés');
        break;
      
      // Nutrition goals
      case 'fat_loss_nutrition':
        metrics.push('Reducción de grasa corporal a través de nutrición');
        metrics.push('Mejora en composición corporal');
        break;
      case 'muscle_nutrition':
        metrics.push('Optimización de proteína para hipertrofia');
        metrics.push('Mejora en recuperación muscular');
        break;
      case 'energy_nutrition':
        metrics.push('Estabilización de energía durante el día');
        metrics.push('Reducción de fatiga post-comida');
        break;
      case 'digestive_health':
        metrics.push('Mejora en digestión y reguliaridad');
        metrics.push('Reducción de inflamación intestinal');
        break;
      case 'blood_sugar':
        metrics.push('Estabilización de glucosa en sangre');
        metrics.push('Mejora en sensibilidad a la insulina');
        break;
      case 'inflammation':
        metrics.push('Reducción de marcadores inflamatorios');
        metrics.push('Mejora en bienestar general');
        break;
      case 'sports_nutrition':
        metrics.push('Optimización de rendimiento deportivo');
        metrics.push('Mejora en recuperación post-entrenamiento');
        break;
      case 'hormonal_balance':
        metrics.push('Estabilización de hormonas clave');
        metrics.push('Mejora en ciclos naturales del cuerpo');
        break;
    }
  });

  // Add program-specific general metrics
  if (programType === 'nutrition') {
    metrics.push('Adherencia nutricional >85%');
    metrics.push('Mejora en biomarcadores nutricionales');
    metrics.push('Establecimiento de hábitos alimentarios sostenibles');
  } else {
    metrics.push('Adherencia al programa >80%');
    metrics.push('Mejora en biomarcadores de salud');
    metrics.push('Satisfacción personal con el progreso');
  }
  
  return metrics.slice(0, 5); // Return top 5 metrics
};

const generateAIRationale = (
  goals: ProgramGoal[], 
  preferences: Record<string, string>, 
  userProfile: any,
  programType: 'fitness' | 'nutrition'
): string => {
  const primaryGoals = goals.slice(0, 2).map(g => g.label).join(' y ');
  const experience = userProfile.experience_level;
  
  if (programType === 'nutrition') {
    const dietApproach = preferences.diet_approach || 'flexible';
    const caloricGoal = preferences.caloric_goal || 'adaptativo';
    const mealFreq = preferences.meal_frequency || 'flexible';
    
    return `He diseñado este programa nutricional considerando tus objetivos principales de ${primaryGoals}. ` +
      `Basándome en tu nivel de experiencia ${experience} y preferencia por ${dietApproach}, ` +
      `he estructurado un plan alimentario ${caloricGoal.toLowerCase()} con ${mealFreq.toLowerCase()}. ` +
      `El programa incorpora evidencia científica actual y se adapta a tus restricciones específicas ` +
      `para maximizar adherencia nutricional y resultados metabólicos sostenibles.`;
  } else {
    const timeAvailable = preferences.workout_frequency || 'variable';
    const workoutType = preferences.workout_type || 'mixto';
    
    return `He diseñado este programa de entrenamiento considerando tus objetivos principales de ${primaryGoals}. ` +
      `Basándome en tu nivel ${experience} y disponibilidad de ${timeAvailable}, ` +
      `he estructurado un plan progresivo con enfoque en ${workoutType.toLowerCase()} que equilibra desafío y recuperación. ` +
      `El programa incorpora periodización inteligente y se adapta a tus preferencias específicas ` +
      `para maximizar adherencia y resultados a largo plazo.`;
  }
};

export const generateProgramWithAI = async (request: GenerateProgramRequest): Promise<AIGeneratedProgram> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

  const { program_type, goals, preferences, user_profile } = request;
  
  const programName = generateProgramName(goals, program_type);
  const determinedProgramType = determineProgramType(goals, program_type);
  
  // Determine duration based on goals, experience, and program type
  let estimatedWeeks = 8; // Default
  if (program_type === 'nutrition') {
    estimatedWeeks = 12; // Nutrition programs typically need more time for habit formation
  } else if (user_profile.experience_level === 'beginner') {
    estimatedWeeks = 12;
  } else if (goals.length > 2) {
    estimatedWeeks = 16;
  }
  
  const weeklyStructure = generateWeeklyStructure(estimatedWeeks, goals, preferences, program_type);
  const successMetrics = generateSuccessMetrics(goals, preferences, program_type);
  const aiRationale = generateAIRationale(goals, preferences, user_profile, program_type);

  // Generate program description
  const primaryGoal = goals[0]?.label || 'mejora general';
  const programTypeLabel = program_type === 'nutrition' ? 'nutricional' : 'de entrenamiento';
  const programDescription = `Programa ${programTypeLabel} personalizado diseñado específicamente para ${primaryGoal.toLowerCase()} ` +
    `adaptado a tu nivel ${user_profile.experience_level} y preferencias individuales. ` +
    `Incluye progresión estructurada, contenido curado y seguimiento inteligente.`;

  return {
    program_name: programName,
    program_type: determinedProgramType,
    program_description: programDescription,
    estimated_duration_weeks: estimatedWeeks,
    goals: {
      primary_goals: goals,
      success_factors: goals.map(g => g.label)
    },
    preferences: {
      ...preferences,
      user_profile
    },
    weekly_structure: weeklyStructure,
    success_metrics: successMetrics,
    ai_rationale: aiRationale
  };
};

// API endpoint simulation
export const mockAIAPICall = async (endpoint: string, data: any): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    if (endpoint === '/api/ai/generate-program') {
      const result = await generateProgramWithAI(data);
      return { success: true, data: result };
    }
    
    throw new Error('Unknown endpoint');
  } catch (error) {
    console.error('Mock AI API Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};