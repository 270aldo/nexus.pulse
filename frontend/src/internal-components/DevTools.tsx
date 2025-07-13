import { useEffect, ErrorInfo, Component } from "react";

// Simple Error Boundary Component
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">Please refresh the page or try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

interface Props {
  children: React.ReactNode;
  shouldRender: boolean;
}

function logReason(event: PromiseRejectionEvent) {
  console.error(event?.reason);
}

/**
 * Render extra dev tools around the app when in dev mode,
 * but only render the app itself in prod mode
 */
export const DevTools = ({ children, shouldRender }: Props) => {
  useEffect(() => {
    if (shouldRender) {
      window.addEventListener("unhandledrejection", logReason);

      return () => {
        window.removeEventListener("unhandledrejection", logReason);
      };
    }
  }, [shouldRender]);

  if (shouldRender) {
    return (
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    );
  }

  return <>{children}</>;
};
