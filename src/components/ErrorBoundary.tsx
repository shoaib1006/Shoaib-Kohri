import React, { ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let details = "";

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = "Permission Denied or Firestore Error";
            details = `Operation: ${parsed.operationType} on ${parsed.path}. Error: ${parsed.error}`;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <Card className="max-w-md w-full border-red-200 shadow-lg">
            <CardHeader className="bg-red-50 border-b border-red-100">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="py-8 text-center space-y-6">
              <div className="space-y-2">
                <p className="font-bold text-foreground">{errorMessage}</p>
                {details && <p className="text-xs text-muted-foreground font-mono bg-slate-100 p-2 rounded">{details}</p>}
              </div>
              <p className="text-sm text-muted-foreground">
                This might be due to missing permissions or a temporary connection issue.
              </p>
              <Button onClick={this.handleReset} className="w-full gap-2">
                <RefreshCcw className="w-4 h-4" />
                Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
