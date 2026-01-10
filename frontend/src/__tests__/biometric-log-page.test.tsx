import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import BiometricLogPage from "../pages/BiometricLogPage";

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

test("renders biometric log header", () => {
  render(
    <MemoryRouter>
      <BiometricLogPage />
    </MemoryRouter>
  );

  expect(
    screen.getByRole("heading", { name: /registro biométrico/i })
  ).toBeInTheDocument();
});
