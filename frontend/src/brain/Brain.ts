import { HandleHealthzData, AICoachMessageResponse } from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @name handle_healthz
   * @summary Handle Healthz
   * @request GET:/_healthz
   */
  handle_healthz = (params: RequestParams = {}) =>
    this.request<HandleHealthzData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * Returns AI coach messages for the authenticated user
   *
   * @name get_ai_coach_messages
   * @summary Get AI coach messages
   * @request GET:/routes/ai-coach-messages/
   */
  get_ai_coach_messages = (params: RequestParams = {}) =>
    this.request<AICoachMessageResponse[], any>({
      path: `/routes/ai-coach-messages/`,
      method: "GET",
      ...params,
    });
}
