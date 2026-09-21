import { redact, redactMessage } from './redaction';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogSink = (level: LogLevel, message: string, meta?: unknown) => void;

const defaultSink: LogSink = (level, message, meta) => {
  const payload = meta === undefined ? message : `${message} ${JSON.stringify(meta)}`;
  switch (level) {
    case 'debug':
      if (__DEV__) console.debug(payload);
      break;
    case 'info':
      if (__DEV__) console.info(payload);
      break;
    case 'warn':
      console.warn(payload);
      break;
    case 'error':
      console.error(payload);
      break;
  }
};

let sink: LogSink = defaultSink;

/** Override for crash reporters / tests. */
export function setLogSink(next: LogSink): void {
  sink = next;
}

export function resetLogSink(): void {
  sink = defaultSink;
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  sink(level, redactMessage(message), meta === undefined ? undefined : redact(meta));
}

export const logger = {
  debug: (message: string, meta?: unknown) => write('debug', message, meta),
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
};
