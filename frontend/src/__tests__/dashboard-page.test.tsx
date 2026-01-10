import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import DashboardPage from "../pages/DashboardPage";

vi.mock("../components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/AppProvider", () => ({
  useAppContext: () => ({
    session: { user: { id: "test-user" } },
    isLoadingSession: false,
    currentUserId: "test-user",
  }),
}));

vi.mock("../utils/apiClient", () => ({
  apiClient: {
    get: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  },
}));

vi.mock("../utils/supabaseClient", async () => {
  const { createSupabaseMock } = await import("../test/testHelpers");
  return {
    supabase: createSupabaseMock(),
    fetchAllSparklineData: vi.fn(() =>
      Promise.resolve({
        sleep: [],
        steps: [],
        hrv: [],
        weight: [],
        mood: [],
        stress: [],
      })
    ),
  };
});

test("renders the dashboard header", () => {
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
});
