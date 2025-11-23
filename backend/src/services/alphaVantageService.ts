import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

export class AlphaVantageService {
  private apiKey: string;
  private baseURL = 'https://www.alphavantage.co/query';

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
  }

  async getIntradayData(symbol: string, interval: string = '15min') {
    const cacheKey = `intraday_${symbol}_${interval}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    try {
      console.log(`Calling Alpha Vantage API: TIME_SERIES_INTRADAY for ${symbol}`);
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'TIME_SERIES_INTRADAY',
          symbol,
          interval,
          apikey: this.apiKey,
          outputsize: 'full'
        }
      });

      console.log(`Alpha Vantage response keys:`, Object.keys(response.data));
      if (response.data['Error Message']) {
        console.error(`Alpha Vantage Error:`, response.data['Error Message']);
      }
      if (response.data['Note']) {
        console.error(`Alpha Vantage Rate Limit:`, response.data['Note']);
      }

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Alpha Vantage API Error for ${symbol}:`, error.message);
      throw new Error(`Alpha Vantage API Error: ${error.message}`);
    }
  }

  async getDailyData(symbol: string) {
    const cacheKey = `daily_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          apikey: this.apiKey,
          outputsize: 'full'
        }
      });

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(`Alpha Vantage API Error: ${error.message}`);
    }
  }

  async getWeeklyData(symbol: string) {
    const cacheKey = `weekly_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'TIME_SERIES_WEEKLY',
          symbol,
          apikey: this.apiKey
        }
      });

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(`Alpha Vantage API Error: ${error.message}`);
    }
  }

  async getRSI(symbol: string, interval: string, timePeriod: number = 14) {
    const cacheKey = `rsi_${symbol}_${interval}_${timePeriod}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'RSI',
          symbol,
          interval,
          time_period: timePeriod,
          series_type: 'close',
          apikey: this.apiKey
        }
      });

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(`Alpha Vantage API Error: ${error.message}`);
    }
  }

  async getMACD(symbol: string, interval: string) {
    const cacheKey = `macd_${symbol}_${interval}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'MACD',
          symbol,
          interval,
          series_type: 'close',
          apikey: this.apiKey
        }
      });

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(`Alpha Vantage API Error: ${error.message}`);
    }
  }

  async getEMA(symbol: string, interval: string, timePeriod: number = 50) {
    const cacheKey = `ema_${symbol}_${interval}_${timePeriod}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'EMA',
          symbol,
          interval,
          time_period: timePeriod,
          series_type: 'close',
          apikey: this.apiKey
        }
      });

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(`Alpha Vantage API Error: ${error.message}`);
    }
  }

  async getADX(symbol: string, interval: string, timePeriod: number = 14) {
    const cacheKey = `adx_${symbol}_${interval}_${timePeriod}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'ADX',
          symbol,
          interval,
          time_period: timePeriod,
          apikey: this.apiKey
        }
      });

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(`Alpha Vantage API Error: ${error.message}`);
    }
  }
}
