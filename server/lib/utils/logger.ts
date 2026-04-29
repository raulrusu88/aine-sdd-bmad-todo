type LogContext = Record<string, unknown>;
type LogLevel = "error" | "info" | "warn";

function log(level: LogLevel, message: string, context: LogContext = {}): void {
  console[level](
    JSON.stringify({
      context,
      level,
      message,
      timestamp: new Date().toISOString(),
    }),
  );
}

export const logger = {
  error(message: string, context?: LogContext) {
    log("error", message, context);
  },
  info(message: string, context?: LogContext) {
    log("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    log("warn", message, context);
  },
};
