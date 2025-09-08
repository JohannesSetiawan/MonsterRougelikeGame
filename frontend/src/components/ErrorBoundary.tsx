import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error', error, 'ErrorBoundary');
    ErrorHandler.handle(error, 'ErrorBoundary');
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <Card className="w-full max-w-lg border-red-500/50 bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-200 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-red-300/80">
                <p className="mb-2">
                  An unexpected error occurred. This has been logged and we'll look into it.
                </p>
                <p className="text-sm text-red-400/60">
                  Error: {this.state.error?.message || 'Unknown error'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={this.handleReset}
                  variant="outline" 
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>

              {/* Development mode details */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 p-3 bg-red-950/40 rounded border border-red-500/30">
                  <summary className="text-red-300 text-sm cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs text-red-200/70 mt-2 overflow-auto max-h-32">
                    {this.state.error?.stack}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error: any, context?: string) => {
    return ErrorHandler.handle(error, context);
  };

  const getDisplayMessage = (error: any, fallback?: string) => {
    return ErrorHandler.getDisplayMessage(error, fallback);
  };

  const isNetworkError = (error: any) => {
    return ErrorHandler.isNetworkError(error);
  };

  const getRetryableMessage = (error: any) => {
    return ErrorHandler.getRetryableMessage(error);
  };

  return {
    handleError,
    getDisplayMessage,
    isNetworkError,
    getRetryableMessage
  };
};
