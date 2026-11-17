import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorPage } from './ErrorPage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.'
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[UI ERROR BOUNDARY]:', error, errorInfo);
  }

  private handleReturnHome = () => {
    try {
      window.history.replaceState({}, document.title, '/');
    } catch {
      // ignore history errors
    }
    this.setState({ hasError: false, errorMessage: '' });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const savedTheme =
        (typeof window !== 'undefined' &&
          (localStorage.getItem('tidy_theme') as 'light' | 'dark')) ||
        'dark';

      return (
        <ErrorPage
          statusCode={500}
          path={typeof window !== 'undefined' ? window.location.pathname : '/'}
          errorDetails={this.state.errorMessage}
          theme={savedTheme}
          onReturnHome={this.handleReturnHome}
          onResetError={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}
