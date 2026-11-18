import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught render error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-card p-8 rounded-xl border border-border shadow-lg space-y-4">
            <h2 className="text-2xl font-serif text-destructive">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred while loading this page."}
            </p>
            {this.state.errorInfo && (
              <pre className="text-xs text-left bg-muted p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap font-mono text-muted-foreground">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="default"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
              >
                Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/auth";
                }}
              >
                Go to Sign In
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
