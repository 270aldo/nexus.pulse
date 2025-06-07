export type HandleHealthzData = any;

export interface AICoachMessageResponse {
  id: string;
  user_id: string;
  title?: string | null;
  body: string;
  message_type: string;
  urgency: string;
  deep_link?: string | null;
  created_at: string;
  read_at?: string | null;
}
