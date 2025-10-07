import express, { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import { createRequestLogger } from './logger';
import healthRouter from './routes/health';
import ingestRouter from './routes/ingest';
import searchRouter from './routes/search';
import { env } from './env';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(createRequestLogger);
app.use(pinoHttp());

// Routes
app.use('/health', healthRouter);
app.use('/ingest', ingestRouter);
app.use('/search', searchRouter);

// Error handler
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  const logger = (req as any).logger || console;
  logger.error({ 
    requestId: (req as any).requestId,
    error: error.message,
    stack: error.stack 
  }, 'Unhandled error');
  
  res.status(500).json({ 
    ok: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ 
    ok: false, 
    error: 'Not found' 
  });
});

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
