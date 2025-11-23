import { Router } from 'express';
import { MarketDataController } from '../controllers/marketDataController';

const router = Router();
const marketDataController = new MarketDataController();

// Market data routes
router.post('/analysis', (req, res) => marketDataController.getAnalysis(req, res));
router.get('/chart/:symbol', (req, res) => marketDataController.getChartData(req, res));
router.get('/symbols/search', (req, res) => marketDataController.searchSymbols(req, res));
router.get('/health', (req, res) => marketDataController.healthCheck(req, res));

export default router;
