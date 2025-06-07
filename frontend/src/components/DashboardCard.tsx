import React from 'react';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Allow custom styling or grid span
  titleClassName?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className = '', titleClassName = '' }) => {
  return (
    <div
      className={`
        bg-neutral-800/50 backdrop-blur-sm 
        border border-neutral-700/60 
        rounded-2xl 
        shadow-xl shadow-black/30 
        p-4 sm:p-6 
        flex flex-col 
        transition-all duration-300 ease-in-out 
        hover:border-neutral-600/80 hover:shadow-black/40
        ${className}
      `}
    >
      <h2 
        className={`
          text-lg font-semibold text-brand-violet 
          mb-3 sm:mb-4 
          pb-2 border-b border-neutral-700/80
          ${titleClassName}
        `}
      >
        {title}
      </h2>
      <div className="flex-grow h-full">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;
