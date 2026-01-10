import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import NutritionLogPage from "../pages/NutritionLogPage";

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

vi.mock("../utils/supabaseClient", async () => {
  const { createSupabaseMock } = await import("../test/testHelpers");
  return {
    supabase: createSupabaseMock(),
  };
});

test("renders nutrition dashboard card", () => {
  render(
    <MemoryRouter>
      <NutritionLogPage />
    </MemoryRouter>
  );

  expect(
    screen.getByText(/dashboard nutricional/i)
  ).toBeInTheDocument();
});
