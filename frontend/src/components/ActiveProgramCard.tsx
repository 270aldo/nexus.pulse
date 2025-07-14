import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertTriangle,
  Book,
  Users,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { toast } from "sonner";
import { 
  UserProgram, 
  ProgramProgress, 
  ProgramMilestone, 
  ProgramContentSequence,
  getActiveUserProgram,
  getCurrentWeekProgress,
  getUpcomingMilestones,
  getNextAvailableContent,
  updateContentStatus
} from "../utils/supabaseClient";
import { useAppContext } from "./AppProvider";
import { useNavigate } from "react-router-dom";

interface Props {
  onProgramUpdate: () => void;
}

const ActiveProgramCard: React.FC<Props> = ({ onProgramUpdate }) => {
  const { currentUserId } = useAppContext();
  const navigate = useNavigate();
  
  const [activeProgram, setActiveProgram] = useState<UserProgram | null>(null);
  const [currentWeekProgress, setCurrentWeekProgress] = useState<ProgramProgress | null>(null);
  const [upcomingMilestones, setUpcomingMilestones] = useState<ProgramMilestone[]>([]);
  const [nextContent, setNextContent] = useState<(ProgramContentSequence & { content_item: any })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingContent, setIsUpdatingContent] = useState<string | null>(null);

  const loadProgramData = async () => {
    if (!currentUserId) return;
    
    setIsLoading(true);
    try {
      const program = await getActiveUserProgram(currentUserId);
      setActiveProgram(program);
      
      if (program) {
        const [weekProgress, milestones, content] = await Promise.all([
          getCurrentWeekProgress(program.id),
          getUpcomingMilestones(program.id, 3),
          getNextAvailableContent(program.id, 3)
        ]);
        
        setCurrentWeekProgress(weekProgress);
        setUpcomingMilestones(milestones);
        setNextContent(content);
      }
    } catch (error) {
      console.error('Error loading program data:', error);
      toast.error('Error al cargar datos del programa');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProgramData();
  }, [currentUserId]);

  const handleStartContent = async (contentSequence: ProgramContentSequence & { content_item: any }) => {
    if (!activeProgram) return;
    
    setIsUpdatingContent(contentSequence.id);
    try {
      await updateContentStatus(activeProgram.id, contentSequence.content_item_id, 'IN_PROGRESS');
      
      // Navigate to content page
      navigate(`/content-item-page?id=${contentSequence.content_item_id}`);
      
      toast.success('Contenido iniciado');
      loadProgramData(); // Reload data
    } catch (error) {
      console.error('Error starting content:', error);
      toast.error('Error al iniciar contenido');
    } finally {
      setIsUpdatingContent(null);
    }
  };

  const calculateWeekNumber = (startDate: string): number => {
    const start = new Date(startDate);
    const current = new Date();
    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(diffDays / 7));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getProgramTypeColor = (type: string): string => {
    switch (type) {
      case 'PRIME': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'LONGEVITY': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'CUSTOM': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'HYBRID': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-neutral-800/60 border-neutral-700 animate-pulse">
        <CardHeader>
          <div className="h-6 w-3/4 bg-neutral-700 rounded"></div>
          <div className="h-4 w-1/2 bg-neutral-700 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-neutral-700 rounded"></div>
            <div className="h-20 bg-neutral-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeProgram) {
    return null; // No active program, don't show the card
  }

  const currentWeek = calculateWeekNumber(activeProgram.start_date);
  const progressPercentage = activeProgram.completion_percentage || 0;
  const adherenceScore = currentWeekProgress?.adherence_score || 0;

  return (
    <Card className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/60 border-neutral-700 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-white mb-2 flex items-center">
              <Sparkles className="w-5 h-5 text-brand-violet mr-2" />
              {activeProgram.program_name}
            </CardTitle>
            <CardDescription className="text-neutral-400 mb-3">
              {activeProgram.program_description}
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              <Badge className={`border ${getProgramTypeColor(activeProgram.program_type)}`}>
                {activeProgram.program_type}
              </Badge>
              <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                <Calendar className="w-3 h-3 mr-1" />
                Semana {currentWeek}
              </Badge>
              {activeProgram.estimated_duration_weeks && (
                <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                  <Clock className="w-3 h-3 mr-1" />
                  {activeProgram.estimated_duration_weeks} sem total
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-white flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-brand-violet" />
              Progreso General
            </h4>
            <span className="text-sm text-neutral-400">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          {currentWeekProgress && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-neutral-800/50 rounded-lg">
                <div className="text-sm text-neutral-400">Adherencia Semanal</div>
                <div className="text-lg font-semibold text-white">{Math.round(adherenceScore)}%</div>
              </div>
              <div className="text-center p-3 bg-neutral-800/50 rounded-lg">
                <div className="text-sm text-neutral-400">Entrenamientos</div>
                <div className="text-lg font-semibold text-white">
                  {currentWeekProgress.training_sessions_completed || 0}/{currentWeekProgress.training_sessions_planned || 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Content Section */}
        {nextContent.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-white flex items-center">
              <Book className="w-4 h-4 mr-2 text-green-400" />
              Próximo Contenido
            </h4>
            <div className="space-y-2">
              {nextContent.slice(0, 2).map((content) => (
                <div 
                  key={content.id}
                  className="flex items-center justify-between p-3 bg-neutral-800/40 rounded-lg border border-neutral-700/50"
                >
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-white mb-1">
                      {content.content_item.title}
                    </h5>
                    <div className="flex items-center text-xs text-neutral-400">
                      <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400 mr-2">
                        {content.content_item.content_type}
                      </Badge>
                      {content.estimated_completion_time_minutes && (
                        <span>{content.estimated_completion_time_minutes} min</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartContent(content)}
                    disabled={isUpdatingContent === content.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isUpdatingContent === content.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            {nextContent.length > 2 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/resource-library-page')}
              >
                Ver todos los contenidos ({nextContent.length})
              </Button>
            )}
          </div>
        )}

        {/* Upcoming Milestones */}
        {upcomingMilestones.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-white flex items-center">
              <Target className="w-4 h-4 mr-2 text-yellow-400" />
              Próximos Hitos
            </h4>
            <div className="space-y-2">
              {upcomingMilestones.slice(0, 3).map((milestone) => (
                <div 
                  key={milestone.id}
                  className="flex items-center p-3 bg-neutral-800/40 rounded-lg border border-neutral-700/50"
                >
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-white mb-1">
                      {milestone.milestone_name}
                    </h5>
                    <div className="flex items-center text-xs text-neutral-400">
                      {milestone.target_date && (
                        <span className="mr-3">
                          📅 {formatDate(milestone.target_date)}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                        {milestone.milestone_type}
                      </Badge>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-neutral-700">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-brand-violet hover:bg-brand-violet/80 text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver Dashboard
          </Button>
          <Button 
            onClick={() => navigate('/chat-page')}
            variant="outline"
            className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
          >
            <Users className="w-4 h-4 mr-2" />
            AI Coach
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveProgramCard;