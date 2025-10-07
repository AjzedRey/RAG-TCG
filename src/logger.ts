import pino from 'pino';
import { randomUUID } from 'crypto';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const createRequestLogger = (req: any, res: any, next: any) => {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  req.logger = logger.child({ requestId });
  next();
};

export default logger;


