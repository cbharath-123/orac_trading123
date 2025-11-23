import { Request, Response } from 'express';
import { MarketDataService } from '../services/marketDataService';

const marketDataService = new MarketDataService();

export class MarketDataController {
  // Get multi-timeframe analysis
  async getAnalysis(req: Request, res: Response) {
    try {
      const { symbol, timeframes } = req.body;

      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }

      const defaultTimeframes = ['15min', '1hour', '4hour', '1day', '1week'];
      const analysisTimeframes = timeframes || defaultTimeframes;

      console.log(`Fetching analysis for ${symbol} with timeframes:`, analysisTimeframes);
      const analysis = await marketDataService.getMultiTimeframeAnalysis(
        symbol.toUpperCase(),
        analysisTimeframes
      );
      console.log(`Analysis complete for ${symbol}`);

      return res.json(analysis);
    } catch (error: any) {
      console.error(`Error in getAnalysis for ${req.body.symbol}:`, error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // Get chart data
  async getChartData(req: Request, res: Response) {
    try {
      const { symbol } = req.params;
      const { interval } = req.query;

      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }

      console.log(`Fetching chart data for ${symbol} with interval ${interval}`);
      const chartData = await marketDataService.getChartData(
        symbol.toUpperCase(),
        (interval as string) || '15min'
      );
      console.log(`Chart data fetched for ${symbol}: ${chartData.length} points`);

      return res.json(chartData);
    } catch (error: any) {
      console.error(`Error in getChartData for ${req.params.symbol}:`, error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // Get available symbols (for search/autocomplete)
  async searchSymbols(req: Request, res: Response) {
    try {
      const { query } = req.query;

      // In a production app, you'd integrate with Alpha Vantage's SYMBOL_SEARCH endpoint
      // For now, return some common symbols
      const commonSymbols = [
        { symbol: 'IBM', name: 'International Business Machines Corporation' },
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'TSLA', name: 'Tesla, Inc.' },
        { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
        { symbol: 'META', name: 'Meta Platforms, Inc.' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation' }
      ];

      if (query) {
        const filtered = commonSymbols.filter(s =>
          s.symbol.toLowerCase().includes((query as string).toLowerCase()) ||
          s.name.toLowerCase().includes((query as string).toLowerCase())
        );
        return res.json(filtered);
      }

      return res.json(commonSymbols);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Health check
  async healthCheck(req: Request, res: Response) {
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ORAC Trading Backend'
    });
  }
}
