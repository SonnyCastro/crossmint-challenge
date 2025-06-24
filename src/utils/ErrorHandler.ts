import { AxiosError } from "axios";

export enum ErrorType {
  NETWORK = "NETWORK",
  RATE_LIMIT = "RATE_LIMIT",
  VALIDATION = "VALIDATION",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN"
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  recoveryStrategy?: string;
}

export class ErrorHandler {
  static classifyError(error: Error): ErrorInfo {
    if (error instanceof AxiosError) {
      return this.classifyAxiosError(error);
    }

    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      retryable: true
    };
  }

  private static classifyAxiosError(error: AxiosError): ErrorInfo {
    const status = error.response?.status;

    // Rate limiting
    if (status === 429) {
      return {
        type: ErrorType.RATE_LIMIT,
        message: "Rate limit exceeded",
        statusCode: status,
        retryable: true,
        recoveryStrategy: "Wait and retry with exponential backoff"
      };
    }

    // Client errors (4xx)
    if (status && status >= 400 && status < 500) {
      return {
        type: ErrorType.VALIDATION,
        message: `Client error: ${error.response?.data || error.message}`,
        statusCode: status,
        retryable: false,
        recoveryStrategy: "Fix request parameters and try again"
      };
    }

    // Server errors (5xx)
    if (status && status >= 500) {
      return {
        type: ErrorType.SERVER,
        message: `Server error: ${error.response?.data || error.message}`,
        statusCode: status,
        retryable: true,
        recoveryStrategy: "Retry with exponential backoff"
      };
    }

    // Network errors
    if (!error.response) {
      return {
        type: ErrorType.NETWORK,
        message: `Network error: ${error.message}`,
        retryable: true,
        recoveryStrategy: "Check network connection and retry"
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      statusCode: status,
      retryable: true
    };
  }

  static logError(error: Error, context?: string): void {
    const errorInfo = this.classifyError(error);
    const contextInfo = context ? ` [${context}]` : '';

    const logLevel = errorInfo.retryable ? 'warn' : 'error';
    const emoji = this.getErrorEmoji(errorInfo.type);

    const message = `${emoji} ${errorInfo.type}${contextInfo}: ${errorInfo.message}`;

    if (logLevel === 'warn') {
      console.warn(message);
    } else {
      console.error(message);
    }

    if (errorInfo.recoveryStrategy) {
      console.info(`💡 Recovery strategy: ${errorInfo.recoveryStrategy}`);
    }
  }

  private static getErrorEmoji(type: ErrorType): string {
    switch (type) {
      case ErrorType.RATE_LIMIT:
        return "🔄";
      case ErrorType.NETWORK:
        return "🌐";
      case ErrorType.VALIDATION:
        return "⚠️";
      case ErrorType.SERVER:
        return "🔧";
      case ErrorType.UNKNOWN:
        return "❓";
      default:
        return "❌";
    }
  }

  static shouldRetry(error: Error): boolean {
    const errorInfo = this.classifyError(error);
    return errorInfo.retryable;
  }

  static getRetryDelay(error: Error, attempt: number, baseDelay: number = 1000): number {
    const errorInfo = this.classifyError(error);

    // For rate limiting, use longer delays
    if (errorInfo.type === ErrorType.RATE_LIMIT) {
      return baseDelay * Math.pow(2, attempt) * 2; // Double the exponential backoff
    }

    // For server errors, use standard exponential backoff
    if (errorInfo.type === ErrorType.SERVER) {
      return baseDelay * Math.pow(2, attempt);
    }

    // For network errors, use shorter delays
    if (errorInfo.type === ErrorType.NETWORK) {
      return baseDelay * Math.pow(1.5, attempt);
    }

    // Default exponential backoff
    return baseDelay * Math.pow(2, attempt);
  }

  static createUserFriendlyMessage(error: Error): string {
    const errorInfo = this.classifyError(error);

    switch (errorInfo.type) {
      case ErrorType.RATE_LIMIT:
        return "The service is currently busy. Please wait a moment and try again.";
      case ErrorType.NETWORK:
        return "Unable to connect to the service. Please check your internet connection.";
      case ErrorType.VALIDATION:
        return "Invalid request. Please check your input and try again.";
      case ErrorType.SERVER:
        return "The service is experiencing technical difficulties. Please try again later.";
      case ErrorType.UNKNOWN:
        return "An unexpected error occurred. Please try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
} 