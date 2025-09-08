import { logger } from './logger';

export interface ErrorDetails {
  message: string;
  code?: string;
  context?: string;
  originalError?: any;
}

export class AppError extends Error {
  public readonly code?: string;
  public readonly context?: string;
  public readonly originalError?: any;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'AppError';
    this.code = details.code;
    this.context = details.context;
    this.originalError = details.originalError;
  }
}

export class ErrorHandler {
  static handle(error: any, context?: string): AppError {
    const errorDetails: ErrorDetails = {
      message: 'An unexpected error occurred',
      context,
      originalError: error
    };

    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      errorDetails.message = error.message;
    } else if (typeof error === 'string') {
      errorDetails.message = error;
    } else if (error?.message) {
      errorDetails.message = error.message;
    }

    // Log the error
    logger.error(errorDetails.message, error, context);

    return new AppError(errorDetails);
  }

  static getDisplayMessage(error: any, fallback: string = 'Something went wrong. Please try again.'): string {
    if (error instanceof AppError) {
      return error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return fallback;
  }

  static isNetworkError(error: any): boolean {
    return error?.code === 'NETWORK_ERROR' || 
           error?.message?.includes('fetch') ||
           error?.message?.includes('network') ||
           !navigator.onLine;
  }

  static getRetryableMessage(error: any): string {
    if (this.isNetworkError(error)) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return 'Failed to load data. Please try again.';
  }
}

export const createNetworkError = (message: string, originalError?: any): AppError => {
  return new AppError({
    message,
    code: 'NETWORK_ERROR',
    context: 'API',
    originalError
  });
};

export const createDataError = (message: string, context?: string, originalError?: any): AppError => {
  return new AppError({
    message,
    code: 'DATA_ERROR',
    context,
    originalError
  });
};
