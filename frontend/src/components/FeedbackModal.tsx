import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient"; // Adjust path as needed
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star } from "lucide-react";
import { toast } from "sonner"; // Will be used later for notifications

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null; // To associate feedback with a user
  contextIdentifier?: string; // Optional: e.g., page name, content ID
}

const feedbackTypes = [
  { value: "AI_COACH", label: "NGX AI Coach" },
  { value: "GENERAL_APP", label: "General App Experience" },
  { value: "CONTENT_ITEM", label: "Specific Content/Resource" }, 
  { value: "UX_UI", label: "Design & Usability (UX/UI)" },
  { value: "BUG_REPORT", label: "Bug Report" },
];

const FeedbackModal: React.FC<Props> = ({ isOpen, onOpenChange, userId, contextIdentifier }) => {
  const [feedbackType, setFeedbackType] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Error: User not identified. Please ensure you are logged in.");
      console.error("User not logged in for feedback submission");
      return;
    }
    if (!feedbackType) {
      toast.error("Please select a feedback type.");
      return;
    }
    if (rating === 0 && !comment.trim()) {
        toast.error("Please provide a rating or a comment to submit feedback.");
        return;
    }

    setIsSubmitting(true);
    
    const feedbackData = {
      user_id: userId,
      feedback_type: feedbackType,
      rating: rating > 0 ? rating : null, // Store null if no rating given
      comment: comment.trim() || null, // Store null if comment is empty
      context_identifier: contextIdentifier || null,
      // 'status' will default to 'OPEN' in Supabase as per table definition
    };

    try {
      const { error } = await supabase.from("user_feedback").insert([feedbackData]);

      if (error) {
        console.error("Error submitting feedback to Supabase:", error);
        toast.error("Failed to submit feedback. Please try again.", { description: error.message });
      } else {
        toast.success("Thank you! Your feedback has been submitted successfully.");
        // Reset form and close modal
        setFeedbackType("");
        setRating(0);
        setComment("");
        onOpenChange(false);
      }
    } catch (e) {
      console.error("Unexpected error during feedback submission:", e);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-xl text-indigo-400">Provide Your Feedback</DialogTitle>
          <DialogDescription className="text-gray-400">
            Help us improve NGX Pulse. Your insights are valuable.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="feedbackType" className="text-right text-gray-300 col-span-1">
              Feedback Type
            </Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger id="feedbackType" className="col-span-3 bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500">
                <SelectValue placeholder="Select a type..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                {feedbackTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="hover:bg-gray-600 focus:bg-indigo-600">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rating" className="text-right text-gray-300 col-span-1">
              Rating (Optional)
            </Label>
            <div className="col-span-3 flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={28}
                  className={`cursor-pointer transition-colors duration-150 
                    ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500 hover:text-yellow-300"}`}
                  onClick={() => handleStarClick(star)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="comment" className="text-right text-gray-300 col-span-1 pt-2">
              Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience or suggestions..."
              className="col-span-3 min-h-[100px] bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
