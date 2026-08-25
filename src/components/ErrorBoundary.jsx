import React from "react";
import { Button } from "@/components/ui/button";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App error boundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
          <div className="text-5xl mb-4">🏀</div>
          <h1 className="font-heading text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            An unexpected error occurred. Reloading usually fixes it.
          </p>
          <Button onClick={() => window.location.reload()} className="rounded-full">
            Reload app
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}