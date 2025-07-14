
import { createClient } from '@supabase/supabase-js';
import { log } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// INTERFACES FOR WELLNESS DASHBOARD
export interface WellnessData {
  date: string;
  avg_mood: number | null;
  avg_stress: number | null;
  total_meditation_minutes: number | null;
}

// INTERFACES FOR TRAINING DASHBOARD
export interface WeeklyVolume {
  weekLabel: string; // e.g., "Semana 1 (10/05 - 16/05)"
  totalVolume: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface MuscleGroupFrequency {
  name: string; // Muscle group name
  value: number; // Count of sessions
  // color?: string; // Optional: for pie chart slices
}

export interface TrainingDashboardData {
  weeklyVolumeData: WeeklyVolume[];
  muscleGroupFrequencyData: MuscleGroupFrequency[];
}

// Helper to format date as YYYY-MM-DD
const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper to get the start of the week (Monday)
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

export const fetchWellnessDataForDashboard = async (userId: string): Promise<WellnessData[]> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('registros_bienestar')
    .select('fecha_registro, estado_animo, nivel_estres, tipo_actividad, duracion_minutos')
    .eq('user_id', userId)
    .gte('fecha_registro', sevenDaysAgoISO)
    .order('fecha_registro', { ascending: true });

  if (error) {
    console.error('Error fetching wellness data:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Process data to group by date and calculate metrics
  const processedData: { [key: string]: { moodSum: number, moodCount: number, stressSum: number, stressCount: number, meditationMinutes: number } } = {};

  data.forEach(record => {
    const date = record.fecha_registro.split('T')[0]; // Group by date part only
    if (!processedData[date]) {
      processedData[date] = { moodSum: 0, moodCount: 0, stressSum: 0, stressCount: 0, meditationMinutes: 0 };
    }
    if (record.estado_animo !== null) {
      processedData[date].moodSum += record.estado_animo;
      processedData[date].moodCount++;
    }
    if (record.nivel_estres !== null) {
      processedData[date].stressSum += record.nivel_estres;
      processedData[date].stressCount++;
    }
    if ((record.tipo_actividad === 'Meditación' || record.tipo_actividad === 'Mindfulness') && record.duracion_minutos !== null) {
      processedData[date].meditationMinutes += record.duracion_minutos;
    }
  });

  const result: WellnessData[] = Object.keys(processedData).map(date => ({
    date,
    avg_mood: processedData[date].moodCount > 0 ? processedData[date].moodSum / processedData[date].moodCount : null,
    avg_stress: processedData[date].stressCount > 0 ? processedData[date].stressSum / processedData[date].stressCount : null,
    total_meditation_minutes: processedData[date].meditationMinutes,
  }));

  // Ensure all last 7 days are present, even if no data
  const finalResult: WellnessData[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = result.find(r => r.date === dateStr);
    if (found) {
      finalResult.push(found);
    } else {
      finalResult.push({ date: dateStr, avg_mood: null, avg_stress: null, total_meditation_minutes: null });
    }
  }
  
  return finalResult.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending
};


export const fetchTrainingDataForDashboard = async (userId: string, referenceDate: Date): Promise<TrainingDashboardData> => {
  log(`Fetching training dashboard data for user ${userId} with reference date ${referenceDate.toISOString()}`);
  const today = new Date(referenceDate); // Use referenceDate for all calculations
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  // 1. Calculate Weekly Total Volume (Last 4 Weeks)
  const weeklyVolumeData: WeeklyVolume[] = [];
  for (let i = 3; i >= 0; i--) { // Iterate for the last 4 weeks (current week is i=0)
    const weekStartDate = getStartOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (i * 7)));
    weekStartDate.setHours(0,0,0,0);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23,59,59,999);

    const weekLabel = `Sem. ${formatDateToYYYYMMDD(weekStartDate).substring(5)} - ${formatDateToYYYYMMDD(weekEndDate).substring(5)}`;
    log(`Processing week: ${weekLabel}, Start: ${weekStartDate.toISOString()}, End: ${weekEndDate.toISOString()}`);

    const { data: sessionsInWeek, error: sessionsError } = await supabase
      .from('registros_sesion_entrenamiento')
      .select('id, fecha_entrenamiento')
      .eq('user_id', userId)
      .gte('fecha_entrenamiento', formatDateToYYYYMMDD(weekStartDate))
      .lte('fecha_entrenamiento', formatDateToYYYYMMDD(weekEndDate));

    if (sessionsError) {
      console.error(`Error fetching sessions for week ${weekLabel}:`, sessionsError);
      weeklyVolumeData.push({ weekLabel, totalVolume: 0, startDate: formatDateToYYYYMMDD(weekStartDate), endDate: formatDateToYYYYMMDD(weekEndDate) });
      continue;
    }

    let totalVolumeForWeek = 0;
    if (sessionsInWeek && sessionsInWeek.length > 0) {
      for (const sessionItem of sessionsInWeek) {
        const { data: exercisesInSession, error: exercisesError } = await supabase
          .from('ejercicios_sesion')
          .select('series') // This should contain reps_peso_json based on TrainingLogPage
          .eq('sesion_id', sessionItem.id);

        if (exercisesError) {
          console.error(`Error fetching exercises for session ${sessionItem.id}:`, exercisesError);
          continue;
        }

        if (exercisesInSession) {
          exercisesInSession.forEach(exercise => {
            // The 'series' field in 'ejercicios_sesion' is expected to be an array of objects,
            // where each object has 'reps_peso_json' which is a JSON string array of {reps: number, peso_levantado: number}
            // This matches the structure implied by the existing TrainingLogPage.tsx code.
            if (exercise.series && Array.isArray(exercise.series)) {
              exercise.series.forEach((set: any) => { // set is an object from the series array
                if (set.reps_peso_json && typeof set.reps_peso_json === 'string') {
                  try {
                    const repsPesoArray = JSON.parse(set.reps_peso_json);
                    if (Array.isArray(repsPesoArray)) {
                      repsPesoArray.forEach((rp: any) => {
                        const reps = typeof rp.reps === 'number' ? rp.reps : (typeof rp.reps === 'string' ? parseInt(rp.reps, 10) : 0);
                        const weight = typeof rp.peso_levantado === 'number' ? rp.peso_levantado : (typeof rp.peso_levantado === 'string' ? parseFloat(rp.peso_levantado) : 0);
                        if (!isNaN(reps) && !isNaN(weight) && reps > 0 && weight > 0) {
                          totalVolumeForWeek += reps * weight;
                        }
                      });
                    }
                  } catch (e) {
                    console.error('Error parsing reps_peso_json:', e, set.reps_peso_json);
                  }
                }
              });
            }
          });
        }
      }
    }
    weeklyVolumeData.push({ weekLabel, totalVolume: Math.round(totalVolumeForWeek), startDate: formatDateToYYYYMMDD(weekStartDate), endDate: formatDateToYYYYMMDD(weekEndDate) });
  }
  log("Weekly Volume Data:", weeklyVolumeData);

  // 2. Calculate Training Frequency by Muscle Group (Last 30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29); // -29 to include today, making it 30 days total
  thirtyDaysAgo.setHours(0,0,0,0);

  log(`Fetching muscle group frequency from ${thirtyDaysAgo.toISOString()} to ${today.toISOString()}`);

  const { data: sessionsForFrequency, error: freqSessionsError } = await supabase
    .from('registros_sesion_entrenamiento')
    .select('id')
    .eq('user_id', userId)
    .gte('fecha_entrenamiento', formatDateToYYYYMMDD(thirtyDaysAgo))
    .lte('fecha_entrenamiento', formatDateToYYYYMMDD(today));

  const muscleGroupCounts: Record<string, number> = {};
  if (freqSessionsError) {
    console.error("Error fetching sessions for frequency chart:", freqSessionsError);
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
        const distinctMuscleGroupsInSession = new Set<string>();
        exercisesInSessionFreq.forEach(exercise => {
          const group = exercise.grupo_muscular as string | undefined;
          if (group && group.trim() !== '') {
            distinctMuscleGroupsInSession.add(group.trim());
          }
        });
        distinctMuscleGroupsInSession.forEach(group => {
          muscleGroupCounts[group] = (muscleGroupCounts[group] || 0) + 1;
        });
      }
    }
  }

  const muscleGroupFrequencyData: MuscleGroupFrequency[] = Object.entries(muscleGroupCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Sort by count descending
  
  log("Muscle Group Frequency Data:", muscleGroupFrequencyData);

  return {
    weeklyVolumeData,
    muscleGroupFrequencyData,
  };
};

// Fetch all content categories
export const fetchContentCategories = async () => {
  const { data, error } = await supabase
    .from('content_categories')
    .select('id, name, description');
  if (error) {
    console.error("Error fetching content categories:", error);
    throw error;
  }
  return data;
};

// Fetch all content tags
export const fetchContentTags = async () => {
  const { data, error } = await supabase
    .from('content_tags')
    .select('id, name');
  if (error) {
    console.error("Error fetching content tags:", error);
    throw error;
  }
  return data;
};


// Fetch a single content item by ID with its category and tags
export const fetchContentItemById = async (itemId: string) => {
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      id,
      title,
      content_type,
      summary,
      content_body,
      external_url,
      thumbnail_url,
      published_at,
      estimated_read_time_minutes,
      duration_minutes,
      category_id,
      tags:content_item_tags!inner(tag:content_tags!inner(id, name))
    `)
    .eq('id', itemId)
    .maybeSingle(); // Expect a single item or null

  if (error) {
    console.error(`Error fetching content item with ID ${itemId}:`, error);
    if (error.message.includes("PGRST200")) {
        console.error("Supabase JOIN error details:", error.details);
    }
    throw error;
  }

  if (!data) {
    return null; // Or throw a "not found" error if preferred
  }

  // Process tags similar to fetchContentItems
  return {
    ...data,
    tag_names: data.tags ? data.tags.map((t: any) => t.tag?.name).filter(Boolean) : []
  };
};

// Fetch all content items with their category and tags

export const fetchContentItems = async () => {
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      id,
      title,
      content_type,
      summary,
      thumbnail_url,
      category_id,
      published_at,
      estimated_read_time_minutes,
      duration_minutes,
      tags:content_item_tags!inner(tag:content_tags!inner(id, name))
    `)
    .order('published_at', { ascending: false });

  if (error) {
    console.error("Error fetching content items:", error);
    // Log the specific Supabase error if available
    if (error.message.includes("PGRST200")) {
        console.error("Supabase JOIN error details:", error.details);
    }
    throw error;
  }

  // Tags are nested, map them. Category name will be added in the component.
  return data.map(item => ({
    ...item,
    // category_name: item.category?.name || 'Uncategorized', // Will be handled in component
    tag_names: item.tags ? item.tags.map((t: any) => t.tag?.name).filter(Boolean) : []
  }));
};

// Fetch related content items based on category, excluding the current item
export const fetchRelatedContentItems = async (
  categoryId: string | null,
  excludeId: string,
  limit = 3
) => {
  if (!categoryId) {
    return [];
  }

  const { data, error } = await supabase
    .from('content_items')
    .select(`
      id,
      title,
      content_type,
      summary,
      thumbnail_url,
      category_id,
      estimated_read_time_minutes,
      duration_minutes,
      tags:content_item_tags!inner(tag:content_tags!inner(id, name))
    `)
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching related content items:', error);
    return [];
  }

  return (
    data?.map(item => ({
      ...item,
      tag_names: item.tags ? item.tags.map((t: any) => t.tag?.name).filter(Boolean) : []
    })) || []
  );
};

// ==================================================
// FUNCIONES PARA SPARKLINES (7 DÍAS DE DATOS)
// ==================================================

interface SparklineDataPoint {
  date: string;
  value: number | null;
}

// Helper para generar fechas de los últimos 7 días
const getLast7Days = (): string[] => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Obtener datos de sueño de los últimos 7 días
export const fetchSleep7DayData = async (userId: string): Promise<SparklineDataPoint[]> => {
  const last7Days = getLast7Days();
  const sevenDaysAgo = last7Days[0];
  
  const { data, error } = await supabase
    .from('biometric_entries')
    .select('value_numeric, entry_date')
    .eq('user_id', userId)
    .eq('metric_type', 'sleep_hours')
    .gte('entry_date', sevenDaysAgo)
    .order('entry_date', { ascending: true });

  if (error) {
    console.error('Error fetching sleep 7-day data:', error);
    return last7Days.map(date => ({ date, value: null }));
  }

  // Mapear datos existentes y rellenar días faltantes
  const dataMap = new Map(data?.map(item => [item.entry_date, parseFloat(item.value_numeric)]) || []);
  
  return last7Days.map(date => ({
    date,
    value: dataMap.get(date) || null
  }));
};

// Obtener datos de pasos de los últimos 7 días
export const fetchSteps7DayData = async (userId: string): Promise<SparklineDataPoint[]> => {
  const last7Days = getLast7Days();
  const sevenDaysAgo = last7Days[0];
  
  const { data, error } = await supabase
    .from('biometric_entries')
    .select('value_numeric, entry_date')
    .eq('user_id', userId)
    .eq('metric_type', 'steps')
    .gte('entry_date', sevenDaysAgo)
    .order('entry_date', { ascending: true });

  if (error) {
    console.error('Error fetching steps 7-day data:', error);
    return last7Days.map(date => ({ date, value: null }));
  }

  const dataMap = new Map(data?.map(item => [item.entry_date, parseInt(item.value_numeric)]) || []);
  
  return last7Days.map(date => ({
    date,
    value: dataMap.get(date) || null
  }));
};

// Obtener datos de HRV de los últimos 7 días
export const fetchHRV7DayData = async (userId: string): Promise<SparklineDataPoint[]> => {
  const last7Days = getLast7Days();
  const sevenDaysAgo = last7Days[0];
  
  const { data, error } = await supabase
    .from('biometric_entries')
    .select('value_numeric, entry_date')
    .eq('user_id', userId)
    .eq('metric_type', 'hrv')
    .gte('entry_date', sevenDaysAgo)
    .order('entry_date', { ascending: true });

  if (error) {
    console.error('Error fetching HRV 7-day data:', error);
    return last7Days.map(date => ({ date, value: null }));
  }

  const dataMap = new Map(data?.map(item => [item.entry_date, parseFloat(item.value_numeric)]) || []);
  
  return last7Days.map(date => ({
    date,
    value: dataMap.get(date) || null
  }));
};

// Obtener datos de peso de los últimos 7 días
export const fetchWeight7DayData = async (userId: string): Promise<SparklineDataPoint[]> => {
  const last7Days = getLast7Days();
  const sevenDaysAgo = last7Days[0];
  
  const { data, error } = await supabase
    .from('biometric_entries')
    .select('value_numeric, entry_date')
    .eq('user_id', userId)
    .eq('metric_type', 'weight')
    .gte('entry_date', sevenDaysAgo)
    .order('entry_date', { ascending: true });

  if (error) {
    console.error('Error fetching weight 7-day data:', error);
    return last7Days.map(date => ({ date, value: null }));
  }

  const dataMap = new Map(data?.map(item => [item.entry_date, parseFloat(item.value_numeric)]) || []);
  
  return last7Days.map(date => ({
    date,
    value: dataMap.get(date) || null
  }));
};

// Obtener datos de estado de ánimo de los últimos 7 días
export const fetchMood7DayData = async (userId: string): Promise<SparklineDataPoint[]> => {
  const last7Days = getLast7Days();
  const sevenDaysAgo = last7Days[0];
  
  const { data, error } = await supabase
    .from('registros_bienestar')
    .select('estado_animo, fecha_registro')
    .eq('user_id', userId)
    .gte('fecha_registro', sevenDaysAgo)
    .not('estado_animo', 'is', null)
    .order('fecha_registro', { ascending: true });

  if (error) {
    console.error('Error fetching mood 7-day data:', error);
    return last7Days.map(date => ({ date, value: null }));
  }

  // Agrupar por fecha y calcular promedio si hay múltiples registros por día
  const dataByDate = new Map<string, number[]>();
  data?.forEach(item => {
    const date = item.fecha_registro.split('T')[0];
    if (!dataByDate.has(date)) {
      dataByDate.set(date, []);
    }
    dataByDate.get(date)!.push(item.estado_animo);
  });

  return last7Days.map(date => {
    const dayData = dataByDate.get(date);
    if (dayData && dayData.length > 0) {
      const average = dayData.reduce((sum, val) => sum + val, 0) / dayData.length;
      return { date, value: average };
    }
    return { date, value: null };
  });
};

// Obtener datos de estrés de los últimos 7 días
export const fetchStress7DayData = async (userId: string): Promise<SparklineDataPoint[]> => {
  const last7Days = getLast7Days();
  const sevenDaysAgo = last7Days[0];
  
  const { data, error } = await supabase
    .from('registros_bienestar')
    .select('nivel_estres, fecha_registro')
    .eq('user_id', userId)
    .gte('fecha_registro', sevenDaysAgo)
    .not('nivel_estres', 'is', null)
    .order('fecha_registro', { ascending: true });

  if (error) {
    console.error('Error fetching stress 7-day data:', error);
    return last7Days.map(date => ({ date, value: null }));
  }

  const dataByDate = new Map<string, number[]>();
  data?.forEach(item => {
    const date = item.fecha_registro.split('T')[0];
    if (!dataByDate.has(date)) {
      dataByDate.set(date, []);
    }
    dataByDate.get(date)!.push(item.nivel_estres);
  });

  return last7Days.map(date => {
    const dayData = dataByDate.get(date);
    if (dayData && dayData.length > 0) {
      const average = dayData.reduce((sum, val) => sum + val, 0) / dayData.length;
      return { date, value: average };
    }
    return { date, value: null };
  });
};

// Función consolidada para obtener todos los datos de sparklines
export const fetchAllSparklineData = async (userId: string) => {
  if (!userId) {
    const emptyData = getLast7Days().map(date => ({ date, value: null }));
    return {
      sleep: emptyData,
      steps: emptyData,
      hrv: emptyData,
      weight: emptyData,
      mood: emptyData,
      stress: emptyData
    };
  }

  try {
    const [sleepData, stepsData, hrvData, weightData, moodData, stressData] = await Promise.all([
      fetchSleep7DayData(userId).catch(() => getLast7Days().map(date => ({ date, value: null }))),
      fetchSteps7DayData(userId).catch(() => getLast7Days().map(date => ({ date, value: null }))),
      fetchHRV7DayData(userId).catch(() => getLast7Days().map(date => ({ date, value: null }))),
      fetchWeight7DayData(userId).catch(() => getLast7Days().map(date => ({ date, value: null }))),
      fetchMood7DayData(userId).catch(() => getLast7Days().map(date => ({ date, value: null }))),
      fetchStress7DayData(userId).catch(() => getLast7Days().map(date => ({ date, value: null })))
    ]);

    return {
      sleep: sleepData,
      steps: stepsData,
      hrv: hrvData,
      weight: weightData,
      mood: moodData,
      stress: stressData
    };
  } catch (error) {
    console.error('Error fetching sparkline data:', error);
    const emptyData = getLast7Days().map(date => ({ date, value: null }));
    return {
      sleep: emptyData,
      steps: emptyData,
      hrv: emptyData,
      weight: emptyData,
      mood: emptyData,
      stress: emptyData
    };
  }
};

// ==================================================
// SISTEMA DE PROGRAMAS PERSONALIZADOS
// ==================================================

// INTERFACES FOR PROGRAM SYSTEM
export interface UserProgram {
  id: string;
  user_id: string;
  program_name: string;
  program_type: 'PRIME' | 'LONGEVITY' | 'NUTRITION' | 'CUSTOM' | 'HYBRID';
  program_description?: string;
  start_date: string;
  target_end_date?: string;
  estimated_duration_weeks?: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  completion_percentage: number;
  goals?: any;
  preferences?: any;
  restrictions?: any;
  ai_configuration?: any;
  auto_adjustment_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by_ai: boolean;
}

export interface ProgramProgress {
  id: string;
  user_program_id: string;
  user_id: string;
  week_number: number;
  date_recorded: string;
  weekly_completion_rate?: number;
  adherence_score?: number;
  training_sessions_completed: number;
  training_sessions_planned: number;
  nutrition_compliance_score?: number;
  wellness_check_ins_completed: number;
  ai_assessment?: any;
  ai_recommendations?: any;
  user_feedback?: string;
  user_satisfaction_rating?: number;
  energy_level?: number;
  motivation_level?: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramMilestone {
  id: string;
  user_program_id: string;
  user_id: string;
  milestone_name: string;
  milestone_type: 'WEEKLY' | 'MONTHLY' | 'CUSTOM' | 'AI_GENERATED';
  description?: string;
  target_date?: string;
  week_number?: number;
  status: 'PENDING' | 'ACHIEVED' | 'MISSED' | 'RESCHEDULED';
  achieved_date?: string;
  target_metric_type?: string;
  target_value?: number;
  achieved_value?: number;
  unit?: string;
  reward_type?: string;
  reward_data?: any;
  celebration_message?: string;
  ai_generated: boolean;
  ai_difficulty_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramContentSequence {
  id: string;
  user_program_id: string;
  content_item_id: string;
  sequence_order: number;
  week_number?: number;
  day_of_week?: number;
  prerequisite_content_ids?: string[];
  unlock_conditions?: any;
  is_mandatory: boolean;
  difficulty_level?: number;
  estimated_completion_time_minutes?: number;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  unlocked_at?: string;
  started_at?: string;
  completed_at?: string;
  ai_recommended: boolean;
  ai_adaptation_reason?: string;
  user_engagement_score?: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramAIInteraction {
  id: string;
  user_program_id: string;
  user_id: string;
  interaction_type: 'PROACTIVE_RECOMMENDATION' | 'MILESTONE_CELEBRATION' | 'COURSE_CORRECTION' | 'MOTIVATION_BOOST';
  trigger_event?: string;
  ai_message: string;
  action_recommendations?: any;
  priority_level: number;
  program_context?: any;
  user_data_snapshot?: any;
  user_response?: string;
  user_action_taken: boolean;
  effectiveness_rating?: number;
  created_at: string;
  responded_at?: string;
}

export interface CreateProgramRequest {
  program_name: string;
  program_type: UserProgram['program_type'];
  program_description?: string;
  estimated_duration_weeks?: number;
  goals?: any;
  preferences?: any;
  restrictions?: any;
}

export interface ProgramDashboardData {
  activeProgram: UserProgram | null;
  currentWeekProgress: ProgramProgress | null;
  upcomingMilestones: ProgramMilestone[];
  recentAIInteractions: ProgramAIInteraction[];
  nextContentItems: (ProgramContentSequence & { content_item: any })[];
  overallStats: {
    totalPrograms: number;
    completedPrograms: number;
    currentStreak: number;
    totalMilestonesAchieved: number;
  };
}

// FUNCIONES PARA USER PROGRAMS
export const createUserProgram = async (userId: string, programData: CreateProgramRequest): Promise<UserProgram> => {
  const { data, error } = await supabase
    .from('user_programs')
    .insert([{
      user_id: userId,
      ...programData,
      start_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE' as const,
      completion_percentage: 0,
      auto_adjustment_enabled: true,
      created_by_ai: false
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating user program:', error);
    throw error;
  }

  return data;
};

export const getUserPrograms = async (userId: string): Promise<UserProgram[]> => {
  const { data, error } = await supabase
    .from('user_programs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user programs:', error);
    throw error;
  }

  return data || [];
};

export const getActiveUserProgram = async (userId: string): Promise<UserProgram | null> => {
  const { data, error } = await supabase
    .from('user_programs')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active user program:', error);
    throw error;
  }

  return data;
};

export const updateProgramProgress = async (
  userProgramId: string, 
  weekNumber: number, 
  progressData: Partial<ProgramProgress>
): Promise<ProgramProgress> => {
  const { data, error } = await supabase
    .from('program_progress')
    .upsert([{
      user_program_id: userProgramId,
      week_number: weekNumber,
      date_recorded: new Date().toISOString().split('T')[0],
      ...progressData
    }])
    .select()
    .single();

  if (error) {
    console.error('Error updating program progress:', error);
    throw error;
  }

  return data;
};

export const getProgramProgress = async (userProgramId: string): Promise<ProgramProgress[]> => {
  const { data, error } = await supabase
    .from('program_progress')
    .select('*')
    .eq('user_program_id', userProgramId)
    .order('week_number', { ascending: true });

  if (error) {
    console.error('Error fetching program progress:', error);
    throw error;
  }

  return data || [];
};

export const getCurrentWeekProgress = async (userProgramId: string): Promise<ProgramProgress | null> => {
  // Calculate current week number based on program start date
  const program = await supabase
    .from('user_programs')
    .select('start_date')
    .eq('id', userProgramId)
    .single();

  if (program.error || !program.data) {
    console.error('Error fetching program for week calculation:', program.error);
    return null;
  }

  const startDate = new Date(program.data.start_date);
  const currentDate = new Date();
  const weeksDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  const { data, error } = await supabase
    .from('program_progress')
    .select('*')
    .eq('user_program_id', userProgramId)
    .eq('week_number', weeksDiff)
    .maybeSingle();

  if (error) {
    console.error('Error fetching current week progress:', error);
    return null;
  }

  return data;
};

// FUNCIONES PARA MILESTONES
export const createProgramMilestone = async (milestoneData: Omit<ProgramMilestone, 'id' | 'created_at' | 'updated_at'>): Promise<ProgramMilestone> => {
  const { data, error } = await supabase
    .from('program_milestones')
    .insert([milestoneData])
    .select()
    .single();

  if (error) {
    console.error('Error creating program milestone:', error);
    throw error;
  }

  return data;
};

export const getUpcomingMilestones = async (userProgramId: string, limit = 5): Promise<ProgramMilestone[]> => {
  const { data, error } = await supabase
    .from('program_milestones')
    .select('*')
    .eq('user_program_id', userProgramId)
    .in('status', ['PENDING'])
    .order('target_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming milestones:', error);
    throw error;
  }

  return data || [];
};

export const achieveMilestone = async (milestoneId: string, achievedValue?: number): Promise<ProgramMilestone> => {
  const { data, error } = await supabase
    .from('program_milestones')
    .update({
      status: 'ACHIEVED',
      achieved_date: new Date().toISOString().split('T')[0],
      achieved_value: achievedValue
    })
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) {
    console.error('Error achieving milestone:', error);
    throw error;
  }

  return data;
};

// FUNCIONES PARA CONTENT SEQUENCES
export const getProgramContentSequence = async (userProgramId: string): Promise<(ProgramContentSequence & { content_item: any })[]> => {
  const { data, error } = await supabase
    .from('program_content_sequences')
    .select(`
      *,
      content_item:content_items(
        id,
        title,
        content_type,
        summary,
        thumbnail_url,
        estimated_read_time_minutes,
        duration_minutes
      )
    `)
    .eq('user_program_id', userProgramId)
    .order('sequence_order', { ascending: true });

  if (error) {
    console.error('Error fetching program content sequence:', error);
    throw error;
  }

  return data || [];
};

export const getNextAvailableContent = async (userProgramId: string, limit = 3): Promise<(ProgramContentSequence & { content_item: any })[]> => {
  const { data, error } = await supabase
    .from('program_content_sequences')
    .select(`
      *,
      content_item:content_items(
        id,
        title,
        content_type,
        summary,
        thumbnail_url,
        estimated_read_time_minutes,
        duration_minutes
      )
    `)
    .eq('user_program_id', userProgramId)
    .in('status', ['AVAILABLE', 'IN_PROGRESS'])
    .order('sequence_order', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching next available content:', error);
    throw error;
  }

  return data || [];
};

export const updateContentStatus = async (
  userProgramId: string, 
  contentItemId: string, 
  status: ProgramContentSequence['status']
): Promise<ProgramContentSequence> => {
  const updateData: any = { status };
  
  if (status === 'IN_PROGRESS') {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'COMPLETED') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('program_content_sequences')
    .update(updateData)
    .eq('user_program_id', userProgramId)
    .eq('content_item_id', contentItemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating content status:', error);
    throw error;
  }

  return data;
};

// FUNCIONES PARA AI INTERACTIONS
export const createAIInteraction = async (interactionData: Omit<ProgramAIInteraction, 'id' | 'created_at'>): Promise<ProgramAIInteraction> => {
  const { data, error } = await supabase
    .from('program_ai_interactions')
    .insert([interactionData])
    .select()
    .single();

  if (error) {
    console.error('Error creating AI interaction:', error);
    throw error;
  }

  return data;
};

export const getRecentAIInteractions = async (userProgramId: string, limit = 10): Promise<ProgramAIInteraction[]> => {
  const { data, error } = await supabase
    .from('program_ai_interactions')
    .select('*')
    .eq('user_program_id', userProgramId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent AI interactions:', error);
    throw error;
  }

  return data || [];
};

// FUNCIÓN CONSOLIDADA PARA DASHBOARD
export const getProgramDashboardData = async (userId: string): Promise<ProgramDashboardData> => {
  try {
    // Get active program
    const activeProgram = await getActiveUserProgram(userId);
    
    if (!activeProgram) {
      return {
        activeProgram: null,
        currentWeekProgress: null,
        upcomingMilestones: [],
        recentAIInteractions: [],
        nextContentItems: [],
        overallStats: {
          totalPrograms: 0,
          completedPrograms: 0,
          currentStreak: 0,
          totalMilestonesAchieved: 0
        }
      };
    }

    // Get current week progress
    const currentWeekProgress = await getCurrentWeekProgress(activeProgram.id);
    
    // Get upcoming milestones
    const upcomingMilestones = await getUpcomingMilestones(activeProgram.id);
    
    // Get recent AI interactions
    const recentAIInteractions = await getRecentAIInteractions(activeProgram.id);
    
    // Get next content items
    const nextContentItems = await getNextAvailableContent(activeProgram.id);
    
    // Get overall stats
    const allPrograms = await getUserPrograms(userId);
    const completedPrograms = allPrograms.filter(p => p.status === 'COMPLETED');
    
    const { data: totalMilestones } = await supabase
      .from('program_milestones')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'ACHIEVED');

    return {
      activeProgram,
      currentWeekProgress,
      upcomingMilestones,
      recentAIInteractions,
      nextContentItems,
      overallStats: {
        totalPrograms: allPrograms.length,
        completedPrograms: completedPrograms.length,
        currentStreak: 0, // TODO: Calculate based on daily check-ins
        totalMilestonesAchieved: totalMilestones?.length || 0
      }
    };
  } catch (error) {
    console.error('Error fetching program dashboard data:', error);
    throw error;
  }
};

