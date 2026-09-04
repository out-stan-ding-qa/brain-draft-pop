type LogFields = Record<string, unknown>;

function write(level: string, message: string, fields?: LogFields): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...fields,
  });
  console.log(line);
}

export const logger = {
  info: (message: string, fields?: LogFields) => write('info', message, fields),
  warn: (message: string, fields?: LogFields) => write('warn', message, fields),
  error: (message: string, fields?: LogFields) => write('error', message, fields),
  debug: (message: string, fields?: LogFields) => {
    if (process.env.DEBUG_TESTS === '1') {
      write('debug', message, fields);
    }
  },
};
