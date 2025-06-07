# Integration Plan for AI Features

This document outlines how AI-driven features integrate with the existing backend.

## Current Status
- The backend exposes `/routes/ai-coach-messages/` returning mock `AICoachMessage` data.
- The frontend expects a method `brain.get_ai_coach_messages()` to consume this endpoint.

## Next Steps
1. **User Tracking**
   - Store user activity events (e.g., page views, workouts) in a new Supabase table `user_tracking`.
   - Add backend endpoints for recording events and retrieving aggregates.
   - Use Supabase row level security tied to the authenticated user.

2. **Recommendations**
   - Implement a service that analyzes health data and user tracking events to generate message records in `ai_coach_messages`.
   - Schedule periodic jobs to compute new recommendations using Python tasks.
   - Expose an endpoint to fetch unread recommendations for the dashboard.

3. **Dashboards**
   - Extend existing dashboard pages to call the new endpoints via the `brain` client.
   - Visualize metrics (sleep, HRV, steps) alongside AI coach messages and recommendations.
   - Provide filters for time range and message types.

## End-to-End Flow
1. Frontend calls `brain.get_ai_coach_messages()`.
2. Backend returns messages for the authenticated user.
3. Future iterations will enrich this flow with real data from Supabase and tracking events.
