import React from "react";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react"; // Changed icon to Brain

interface Props {
  onClick: () => void;
}

const FeedbackWidget: React.FC<Props> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-[#6D00FF] hover:bg-[#5A00D6] text-white rounded-full p-4 shadow-lg z-50 h-16 w-16 flex items-center justify-center"
      aria-label="Provide feedback"
    >
      <Brain size={28} /> {/* Changed icon to Brain */}
    </Button>
  );
};

export default FeedbackWidget;
