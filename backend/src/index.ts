import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import marketDataRoutes from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', marketDataRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ORAC Trading Backend API',
    version: '1.0.0',
    endpoints: {
      analysis: 'POST /api/analysis',
      chart: 'GET /api/chart/:symbol',
      search: 'GET /api/symbols/search',
      health: 'GET /api/health'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/api/health`);
});

export default app;
