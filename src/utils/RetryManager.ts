import { ErrorHandler, ErrorType } from "./ErrorHandler";

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
}

export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      ...config
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoffDelay(error: Error, attempt: number): number {
    // Use ErrorHandler to get intelligent delay based on error type
    const delay = ErrorHandler.getRetryDelay(error, attempt, this.config.baseDelay);
    return Math.min(delay, this.config.maxDelay);
  }

  private shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) {
      return false;
    }

    return ErrorHandler.shouldRetry(error);
  }

  private getRetryReason(error: Error): string {
    const errorInfo = ErrorHandler.classifyError(error);
    return errorInfo.message;
  }

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: string
  ): Promise<T> {
    let lastError: Error;
    let totalDelay = 0;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (!this.shouldRetry(lastError, attempt)) {
          break;
        }

        const delayMs = this.calculateBackoffDelay(lastError, attempt);
        totalDelay += delayMs;
        const contextInfo = context ? ` (${context})` : '';
        const retryReason = this.getRetryReason(lastError);

        console.warn(
          `⚠️ ${operationName} failed${contextInfo}, attempt ${attempt + 1}/${this.config.maxRetries + 1}. ` +
          `Reason: ${retryReason}. Retrying in ${delayMs}ms...`
        );

        const errorInfo = ErrorHandler.classifyError(lastError);
        if (errorInfo.type === ErrorType.RATE_LIMIT) {
          console.info(`🔄 Rate limit detected. Waiting ${delayMs}ms before retry...`);
        }

        await this.delay(delayMs);
      }
    }

    // If we get here, all retries failed
    const contextInfo = context ? ` (${context})` : '';
    ErrorHandler.logError(lastError!, operationName + contextInfo);
    throw new Error(ErrorHandler.createUserFriendlyMessage(lastError!));
  }

  // Utility method to create a retry manager with specific configuration
  static create(config: Partial<RetryConfig> = {}): RetryManager {
    return new RetryManager(config);
  }

  // Utility method for aggressive retry (more retries, longer delays)
  static createAggressive(): RetryManager {
    return new RetryManager({
      maxRetries: 10,
      baseDelay: 2000,
      maxDelay: 60000,
      backoffMultiplier: 2.5
    });
  }

  // Utility method for conservative retry (fewer retries, shorter delays)
  static createConservative(): RetryManager {
    return new RetryManager({
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 10000,
      backoffMultiplier: 1.5
    });
  }

  // Utility method for rate-limited operations
  static createRateLimitAware(): RetryManager {
    return new RetryManager({
      maxRetries: 8,
      baseDelay: 2000,
      maxDelay: 120000, // 2 minutes max delay for rate limiting
      backoffMultiplier: 3
    });
  }
} 