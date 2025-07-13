import { type ReactNode, Suspense } from "react";

export const SuspenseWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center p-8">
          <span className="animate-pulse text-sm text-neutral-400">Cargando…</span>
        </div>
      }
    >
      {children}
    </Suspense>
  );
};
