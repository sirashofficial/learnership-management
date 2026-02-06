// Structured logging utility

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In production, you would send to a logging service (e.g., Sentry, LogRocket)
    if (this.isDevelopment) {
      console.log(JSON.stringify(logEntry, null, 2));
    } else {
      // Production logging - could send to external service
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, message, {
      error: error?.message,
      stack: error?.stack,
      ...context,
    });
  }

  // API specific logging
  apiRequest(method: string, path: string, context?: LogContext) {
    this.info(`API Request: ${method} ${path}`, context);
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number) {
    this.info(`API Response: ${method} ${path}`, { statusCode, duration });
  }

  apiError(method: string, path: string, error: Error, context?: LogContext) {
    this.error(`API Error: ${method} ${path}`, error, context);
  }

  // Database logging
  dbQuery(query: string, duration: number) {
    this.debug('Database Query', { query, duration });
  }

  dbError(query: string, error: Error) {
    this.error('Database Error', error, { query });
  }
}

export const logger = new Logger();
