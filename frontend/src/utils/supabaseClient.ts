
import { createClient } from '@supabase/supabase-js';

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
  console.log(`Fetching training dashboard data for user ${userId} with reference date ${referenceDate.toISOString()}`);
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
    console.log(`Processing week: ${weekLabel}, Start: ${weekStartDate.toISOString()}, End: ${weekEndDate.toISOString()}`);

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
  console.log("Weekly Volume Data:", weeklyVolumeData);

  // 2. Calculate Training Frequency by Muscle Group (Last 30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29); // -29 to include today, making it 30 days total
  thirtyDaysAgo.setHours(0,0,0,0);

  console.log(`Fetching muscle group frequency from ${thirtyDaysAgo.toISOString()} to ${today.toISOString()}`);

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
  
  console.log("Muscle Group Frequency Data:", muscleGroupFrequencyData);

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

