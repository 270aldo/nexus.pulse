import { HandleHealthzData, AICoachMessageResponse } from "./data-contracts";

export namespace Brain {
  /**
   * No description
   * @name handle_healthz
   * @summary Handle Healthz
   * @request GET:/_healthz
   */
  export namespace handle_healthz {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HandleHealthzData;
  }

  /**
   * Get AI coach messages for the current user
   * @name get_ai_coach_messages
   * @summary Get AI coach messages
   * @request GET:/routes/ai-coach-messages/
   */
  export namespace get_ai_coach_messages {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AICoachMessageResponse[];
  }
}
