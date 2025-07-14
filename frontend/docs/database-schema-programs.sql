-- ==================================================
-- NGX PULSE - PROGRAMA PERSONALIZADO SYSTEM SCHEMA
-- Sistema de programas inteligentes con IA proactiva
-- ==================================================

-- 1. TABLA: user_programs (Programas activos del usuario)
CREATE TABLE user_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Información del programa
    program_name VARCHAR(255) NOT NULL,
    program_type VARCHAR(50) NOT NULL, -- 'PRIME', 'LONGEVITY', 'NUTRITION', 'CUSTOM', 'HYBRID'
    program_description TEXT,
    
    -- Duración y fecha
    start_date DATE NOT NULL,
    target_end_date DATE,
    estimated_duration_weeks INTEGER,
    
    -- Estado del programa
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'
    completion_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
    
    -- Configuración del programa
    goals JSONB, -- Objetivos específicos del usuario
    preferences JSONB, -- Preferencias de entrenamiento, nutrición, etc.
    restrictions JSONB, -- Limitaciones físicas, alergias, etc.
    
    -- IA y personalización
    ai_configuration JSONB, -- Configuración específica del AI Coach para este programa
    auto_adjustment_enabled BOOLEAN DEFAULT true,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_ai BOOLEAN DEFAULT false -- Si el programa fue creado por IA o por el usuario
);

-- 2. TABLA: program_progress (Seguimiento detallado del progreso)
CREATE TABLE program_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_program_id UUID NOT NULL REFERENCES user_programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Progreso temporal
    week_number INTEGER NOT NULL,
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Métricas de progreso
    weekly_completion_rate DECIMAL(5,2), -- Porcentaje de completitud semanal
    adherence_score DECIMAL(5,2), -- Puntaje de adherencia (0-100)
    
    -- Métricas específicas
    training_sessions_completed INTEGER DEFAULT 0,
    training_sessions_planned INTEGER DEFAULT 0,
    nutrition_compliance_score DECIMAL(5,2),
    wellness_check_ins_completed INTEGER DEFAULT 0,
    
    -- Evaluación de la IA
    ai_assessment JSONB, -- Evaluación automática de la IA sobre el progreso
    ai_recommendations JSONB, -- Recomendaciones específicas de la IA
    
    -- Feedback del usuario
    user_feedback TEXT,
    user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating BETWEEN 1 AND 5),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_program_id, week_number)
);

-- 3. TABLA: program_milestones (Hitos y logros del programa)
CREATE TABLE program_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_program_id UUID NOT NULL REFERENCES user_programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Información del hito
    milestone_name VARCHAR(255) NOT NULL,
    milestone_type VARCHAR(50) NOT NULL, -- 'WEEKLY', 'MONTHLY', 'CUSTOM', 'AI_GENERATED'
    description TEXT,
    
    -- Programación
    target_date DATE,
    week_number INTEGER, -- Semana objetivo del programa
    
    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACHIEVED', 'MISSED', 'RESCHEDULED'
    achieved_date DATE,
    
    -- Métricas de logro
    target_metric_type VARCHAR(50), -- 'WEIGHT_LOSS', 'STRENGTH_GAIN', 'ENDURANCE', 'HABIT_FORMATION'
    target_value DECIMAL(10,2),
    achieved_value DECIMAL(10,2),
    unit VARCHAR(20),
    
    -- Recompensas y celebración
    reward_type VARCHAR(50), -- 'BADGE', 'DISCOUNT', 'CONTENT_UNLOCK', 'AI_PRAISE'
    reward_data JSONB,
    celebration_message TEXT,
    
    -- IA insights
    ai_generated BOOLEAN DEFAULT false,
    ai_difficulty_rating DECIMAL(3,1), -- 1.0 to 10.0
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA: program_content_sequences (Secuenciación inteligente de contenido)
CREATE TABLE program_content_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_program_id UUID NOT NULL REFERENCES user_programs(id) ON DELETE CASCADE,
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    
    -- Secuenciación
    sequence_order INTEGER NOT NULL,
    week_number INTEGER,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
    
    -- Condiciones de entrega
    prerequisite_content_ids UUID[], -- Array de IDs de contenido que deben completarse primero
    unlock_conditions JSONB, -- Condiciones específicas para desbloquear este contenido
    
    -- Personalización
    is_mandatory BOOLEAN DEFAULT true,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_completion_time_minutes INTEGER,
    
    -- Estado de entrega
    status VARCHAR(20) DEFAULT 'LOCKED', -- 'LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'
    unlocked_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- IA adaptativa
    ai_recommended BOOLEAN DEFAULT false,
    ai_adaptation_reason TEXT,
    user_engagement_score DECIMAL(5,2), -- Basado en tiempo de engagement, interacciones, etc.
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_program_id, content_item_id)
);

-- 5. TABLA: program_ai_interactions (Interacciones inteligentes de la IA)
CREATE TABLE program_ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_program_id UUID NOT NULL REFERENCES user_programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo de interacción
    interaction_type VARCHAR(50) NOT NULL, -- 'PROACTIVE_RECOMMENDATION', 'MILESTONE_CELEBRATION', 'COURSE_CORRECTION', 'MOTIVATION_BOOST'
    trigger_event VARCHAR(100), -- Lo que disparó esta interacción
    
    -- Contenido de la interacción
    ai_message TEXT NOT NULL,
    action_recommendations JSONB, -- Acciones específicas recomendadas
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5) DEFAULT 3,
    
    -- Contexto
    program_context JSONB, -- Estado del programa cuando se generó la interacción
    user_data_snapshot JSONB, -- Snapshot de datos relevantes del usuario
    
    -- Respuesta del usuario
    user_response TEXT,
    user_action_taken BOOLEAN DEFAULT false,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- 6. TABLA: user_program_preferences (Preferencias avanzadas del usuario por programa)
CREATE TABLE user_program_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_program_id UUID NOT NULL REFERENCES user_programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Preferencias de comunicación
    ai_communication_frequency VARCHAR(20) DEFAULT 'NORMAL', -- 'MINIMAL', 'NORMAL', 'FREQUENT'
    preferred_notification_times TIME[],
    communication_style VARCHAR(20) DEFAULT 'ENCOURAGING', -- 'DIRECT', 'ENCOURAGING', 'SCIENTIFIC'
    
    -- Preferencias de contenido
    preferred_content_types VARCHAR(50)[], -- ['article', 'video', 'podcast', 'exercise']
    content_difficulty_preference VARCHAR(20) DEFAULT 'ADAPTIVE', -- 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ADAPTIVE'
    
    -- Preferencias de seguimiento
    tracking_frequency VARCHAR(20) DEFAULT 'DAILY', -- 'DAILY', 'WEEKLY', 'CUSTOM'
    reminder_preferences JSONB,
    
    -- Preferencias de adaptación
    auto_difficulty_adjustment BOOLEAN DEFAULT true,
    pause_program_on_missed_days INTEGER DEFAULT 3, -- Días consecutivos perdidos antes de pausar
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para un solo registro por programa
    UNIQUE(user_program_id)
);

-- ==================================================
-- ÍNDICES PARA PERFORMANCE
-- ==================================================

-- Índices para user_programs
CREATE INDEX idx_user_programs_user_id ON user_programs(user_id);
CREATE INDEX idx_user_programs_status ON user_programs(status);
CREATE INDEX idx_user_programs_program_type ON user_programs(program_type);

-- Índices para program_progress
CREATE INDEX idx_program_progress_user_program_id ON program_progress(user_program_id);
CREATE INDEX idx_program_progress_date ON program_progress(date_recorded);
CREATE INDEX idx_program_progress_week ON program_progress(week_number);

-- Índices para program_milestones
CREATE INDEX idx_program_milestones_user_program_id ON program_milestones(user_program_id);
CREATE INDEX idx_program_milestones_status ON program_milestones(status);
CREATE INDEX idx_program_milestones_target_date ON program_milestones(target_date);

-- Índices para program_content_sequences
CREATE INDEX idx_program_content_sequences_user_program_id ON program_content_sequences(user_program_id);
CREATE INDEX idx_program_content_sequences_content_id ON program_content_sequences(content_item_id);
CREATE INDEX idx_program_content_sequences_order ON program_content_sequences(sequence_order);
CREATE INDEX idx_program_content_sequences_status ON program_content_sequences(status);

-- Índices para program_ai_interactions
CREATE INDEX idx_program_ai_interactions_user_program_id ON program_ai_interactions(user_program_id);
CREATE INDEX idx_program_ai_interactions_type ON program_ai_interactions(interaction_type);
CREATE INDEX idx_program_ai_interactions_created_at ON program_ai_interactions(created_at);

-- ==================================================
-- ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_content_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_program_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_programs
CREATE POLICY "Users can view their own programs" ON user_programs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own programs" ON user_programs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs" ON user_programs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs" ON user_programs
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para program_progress
CREATE POLICY "Users can view their own program progress" ON program_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own program progress" ON program_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own program progress" ON program_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para program_milestones
CREATE POLICY "Users can view their own program milestones" ON program_milestones
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own program milestones" ON program_milestones
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own program milestones" ON program_milestones
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para program_content_sequences
CREATE POLICY "Users can view their own program content sequences" ON program_content_sequences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_programs 
            WHERE user_programs.id = program_content_sequences.user_program_id 
            AND user_programs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own program content sequences" ON program_content_sequences
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_programs 
            WHERE user_programs.id = program_content_sequences.user_program_id 
            AND user_programs.user_id = auth.uid()
        )
    );

-- Políticas RLS para program_ai_interactions
CREATE POLICY "Users can view their own program AI interactions" ON program_ai_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own program AI interactions" ON program_ai_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para user_program_preferences
CREATE POLICY "Users can view their own program preferences" ON user_program_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own program preferences" ON user_program_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own program preferences" ON user_program_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- ==================================================
-- TRIGGERS PARA ACTUALIZACIONES AUTOMÁTICAS
-- ==================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a las tablas que necesitan updated_at
CREATE TRIGGER update_user_programs_updated_at BEFORE UPDATE ON user_programs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_progress_updated_at BEFORE UPDATE ON program_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_content_sequences_updated_at BEFORE UPDATE ON program_content_sequences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_program_preferences_updated_at BEFORE UPDATE ON user_program_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- COMENTARIOS EN LAS TABLAS
-- ==================================================

COMMENT ON TABLE user_programs IS 'Almacena los programas personalizados activos de cada usuario';
COMMENT ON TABLE program_progress IS 'Seguimiento semanal detallado del progreso en los programas';
COMMENT ON TABLE program_milestones IS 'Hitos y logros específicos dentro de cada programa';
COMMENT ON TABLE program_content_sequences IS 'Secuenciación inteligente y personalizada del contenido';
COMMENT ON TABLE program_ai_interactions IS 'Registro de todas las interacciones proactivas de la IA';
COMMENT ON TABLE user_program_preferences IS 'Preferencias específicas del usuario para cada programa';