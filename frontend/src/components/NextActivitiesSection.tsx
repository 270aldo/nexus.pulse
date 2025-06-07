import React from 'react';
import StyledContentBox from "./StyledContentBox";
import { CalendarDays, Brain as BrainIconLucide, Dumbbell, Link as LinkIcon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'training' | 'cognitive' | 'other';
  title: string;
  time?: string;
  description?: string;
  link?: string;
  rawDateTime?: Date; // For sorting
}

interface Props {
  nextActivities: Activity[];
  isLoadingNextActivities: boolean;
  title?: string;
}

const iconMap: { [key in Activity['type']]: React.ElementType } = {
  training: Dumbbell,
  cognitive: BrainIconLucide,
  other: CalendarDays,
};

const NextActivitiesSection: React.FC<Props> = ({ nextActivities, isLoadingNextActivities, title = "Próximas Actividades" }) => {
  const navigate = useNavigate();

  const handleActivityClick = (activity: Activity) => {
    if (activity.link) {
      navigate(activity.link);
    } else {
      // Default navigation or action if no specific link
      // For example, navigate to a generic activity details page
      // navigate(`/activity/${activity.id}`);
      console.log("Clicked activity:", activity.title);
    }
  };

  return (
    <StyledContentBox title={title}>
      {isLoadingNextActivities ? (
        <div className="flex items-center justify-center h-full min-h-[150px]">
          <p className="text-neutral-400 text-sm">Cargando próximas actividades...</p>
        </div>
      ) : nextActivities.length > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800/50 scrollbar-thumb-rounded-full">
          {nextActivities.map((activity, index) => {
            const IconComponent = iconMap[activity.type] || CalendarDays;
            return (
              <div 
                key={activity.id || index} 
                onClick={() => handleActivityClick(activity)}
                className={`
                  flex items-start p-2.5 rounded-lg 
                  bg-neutral-700/30 hover:bg-neutral-700/60 
                  border border-transparent hover:border-neutral-600/80
                  transition-all duration-200 ease-in-out group
                  ${activity.link ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                <IconComponent size={18} className="mr-3 mt-0.5 text-brand-teal flex-shrink-0" />
                <div className="flex-grow">
                  <p className="text-sm font-medium text-neutral-100 group-hover:text-white">{activity.title}</p>
                  {activity.time && <p className="text-xs text-neutral-400 group-hover:text-neutral-300">{activity.time}</p>}
                  {activity.description && <p className="text-xs text-neutral-500 mt-0.5 group-hover:text-neutral-400">{activity.description}</p>}
                </div>
                {activity.link && (
                  <ChevronRight size={18} className="text-neutral-500 group-hover:text-brand-teal/80 transition-colors ml-2 self-center" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full min-h-[150px]">
          <p className="text-neutral-400 text-sm">No hay actividades programadas próximamente.</p>
        </div>
      )}
    </StyledContentBox>
  );
};

export default NextActivitiesSection;
