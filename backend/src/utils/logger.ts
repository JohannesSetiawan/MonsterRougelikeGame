import { Logger } from '@nestjs/common';

export class AppLogger {
  private static logger = new Logger('App');

  static info(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  static warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }

  static error(message: string, error?: any, context?: string): void {
    if (error) {
      this.logger.error(message, error.stack || error, context);
    } else {
      this.logger.error(message, context);
    }
  }

  static debug(message: string, context?: string): void {
    this.logger.debug(message, context);
  }

  static verbose(message: string, context?: string): void {
    this.logger.verbose(message, context);
  }
}
