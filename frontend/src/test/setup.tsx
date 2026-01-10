import React from "react";
import "@testing-library/jest-dom";
import { vi } from "vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

vi.mock("recharts", () => {
  const Mock = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );

  return {
    ResponsiveContainer: Mock,
    LineChart: Mock,
    Line: Mock,
    AreaChart: Mock,
    Area: Mock,
    XAxis: Mock,
    YAxis: Mock,
    CartesianGrid: Mock,
    Tooltip: Mock,
    Legend: Mock,
    PieChart: Mock,
    Pie: Mock,
    Cell: Mock,
    BarChart: Mock,
    Bar: Mock,
  };
});
