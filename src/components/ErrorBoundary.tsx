import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Algo salió mal</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            Ocurrió un error inesperado. Por favor intenta de nuevo.
          </p>
          {this.state.error && (
            <p className="text-sm text-muted-foreground mb-4 p-2 bg-secondary/50 rounded max-w-md overflow-auto">
              {this.state.error.message}
            </p>
          )}
          <Button onClick={this.handleReset} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
