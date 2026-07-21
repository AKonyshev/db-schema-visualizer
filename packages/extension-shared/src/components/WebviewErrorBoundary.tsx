import {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from "react";

interface WebviewErrorBoundaryState {
  error: Error | null;
}

class WebviewErrorBoundary extends Component<
  PropsWithChildren,
  WebviewErrorBoundaryState
> {
  public state: WebviewErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(
    error: Error,
  ): WebviewErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[dbml-erd-visualizer]", error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <div className="flex h-screen w-screen items-center justify-center p-6 text-red-600">
          <div>
            <p className="font-semibold">Diagram failed to render</p>
            <p className="mt-2 text-sm">{this.state.error.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WebviewErrorBoundary;
