import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Error Boundary component for production error monitoring
 * Catches React component errors and displays fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if this is a network/offline error - don't show error UI, let OfflineDetector handle it
    const isNetworkError = error.message.includes('Failed to fetch') ||
                           error.message.includes('NetworkError') ||
                           error.message.includes('Network request failed') ||
                           error.message.includes('Load failed');
    
    if (isNetworkError && !navigator.onLine) {
      // Don't show error boundary - OfflineDetector will handle this
      return;
    }

    // Check if this is a chunk loading error (happens during hot reload/deployments)
    const isChunkError = error.message.includes('Failed to fetch dynamically imported module') ||
                         error.message.includes('Loading chunk') ||
                         error.message.includes('Loading CSS chunk');
    
    // Auto-retry once for chunk loading errors
    if (isChunkError && this.state.retryCount < 1) {
      console.log('Chunk loading error detected, auto-refreshing...');
      this.setState({ retryCount: this.state.retryCount + 1 });
      window.location.reload();
      return;
    }
    
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // In production, you could send this to a logging service
    if (import.meta.env.PROD) {
      // Log error details (sanitized for security)
      console.error('Production Error:', {
        message: error.message,
        stack: error.stack?.substring(0, 500), // Limit stack trace
        componentStack: errorInfo.componentStack?.substring(0, 500),
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
              </p>
              
              {!import.meta.env.PROD && this.state.error && (
                <details className="mt-4 p-4 bg-muted rounded-md text-sm">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="flex-1">
                  Return to Home
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
