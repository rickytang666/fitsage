/**
 * Centralized logging utility for FitSage
 * Provides environment-based logging with different levels
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      // In production, only log errors and warnings
      return level === LogLevel.ERROR || level === LogLevel.WARN;
    }
    // In development, log everything
    return true;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  // Special method for API calls (only in development)
  api(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🤖 ${message}`, ...args);
    }
  }

  // Special method for database operations (only in development)
  db(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`💾 ${message}`, ...args);
    }
  }

  // Special method for auth operations (only in development)
  auth(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🔐 ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
export default logger;
