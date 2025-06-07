import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

const StyledContentBox: React.FC<Props> = ({ title, children, className = "", titleClassName = "" }) => {
  return (
    <div
      className={`
        bg-neutral-800/70 backdrop-blur-sm 
        border border-neutral-700/30 
        rounded-xl 
        shadow-lg shadow-black/20 
        p-4 sm:p-5 
        flex flex-col 
        transition-all duration-300 ease-in-out 
        h-full // Added to ensure it takes full height if parent is a grid item
        ${className}
      `}
    >
      <h3 
        className={`
          text-base font-semibold text-neutral-100 
          mb-3 sm:mb-4 
          pb-2 border-b border-neutral-700/70
          ${titleClassName}
        `}
      >
        {title}
      </h3>
      <div className="flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default StyledContentBox;
