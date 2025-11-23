import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

export class TwelveDataService {
  private apiKey: string;
  private baseURL = 'https://api.twelvedata.com';

  constructor() {
    this.apiKey = process.env.TWELVE_DATA_API_KEY || 'demo';
  }

  async getIntradayData(symbol: string, interval: string = '15min') {
    const cacheKey = `intraday_${symbol}_${interval}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    try {
      console.log(`Calling Twelve Data API: time_series for ${symbol} with interval ${interval}`);
      const response = await axios.get(`${this.baseURL}/time_series`, {
        params: {
          symbol,
          interval,
          apikey: this.apiKey,
          outputsize: 5000,
          format: 'JSON'
        }
      });

      console.log(`Twelve Data response status:`, response.data.status);
      
      if (response.data.status === 'error') {
        console.error(`Twelve Data Error:`, response.data.message);
        throw new Error(response.data.message);
      }

      // Transform to Alpha Vantage format for compatibility
      const transformed = this.transformToAlphaVantageFormat(response.data, interval);
      cache.set(cacheKey, transformed);
      return transformed;
    } catch (error: any) {
      console.error(`Twelve Data API Error for ${symbol}:`, error.message);
      
      // Return mock data for demo purposes
      return this.getMockData(symbol, interval);
    }
  }

  async getDailyData(symbol: string) {
    const cacheKey = `daily_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseURL}/time_series`, {
        params: {
          symbol,
          interval: '1day',
          apikey: this.apiKey,
          outputsize: 5000,
          format: 'JSON'
        }
      });

      if (response.data.status === 'error') {
        throw new Error(response.data.message);
      }

      const transformed = this.transformToAlphaVantageFormat(response.data, '1day');
      cache.set(cacheKey, transformed);
      return transformed;
    } catch (error: any) {
      return this.getMockData(symbol, '1day');
    }
  }

  async getWeeklyData(symbol: string) {
    const cacheKey = `weekly_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseURL}/time_series`, {
        params: {
          symbol,
          interval: '1week',
          apikey: this.apiKey,
          outputsize: 5000,
          format: 'JSON'
        }
      });

      if (response.data.status === 'error') {
        throw new Error(response.data.message);
      }

      const transformed = this.transformToAlphaVantageFormat(response.data, '1week');
      cache.set(cacheKey, transformed);
      return transformed;
    } catch (error: any) {
      return this.getMockData(symbol, '1week');
    }
  }

  private transformToAlphaVantageFormat(data: any, interval: string) {
    if (!data.values || !Array.isArray(data.values)) {
      console.log('No values in response, returning mock data');
      return this.getMockData(data.meta?.symbol || 'UNKNOWN', interval);
    }

    const timeSeriesKey = this.getTimeSeriesKey(interval);
    const timeSeries: any = {};

    data.values.forEach((item: any) => {
      timeSeries[item.datetime] = {
        '1. open': item.open,
        '2. high': item.high,
        '3. low': item.low,
        '4. close': item.close,
        '5. volume': item.volume || '0'
      };
    });

    return {
      'Meta Data': {
        '1. Information': `${interval} Time Series`,
        '2. Symbol': data.meta?.symbol || 'UNKNOWN',
        '3. Last Refreshed': new Date().toISOString(),
        '4. Interval': interval
      },
      [timeSeriesKey]: timeSeries
    };
  }

  private getTimeSeriesKey(interval: string): string {
    if (interval.includes('min')) return `Time Series (${interval})`;
    if (interval === '1hour' || interval === '60min') return 'Time Series (60min)';
    if (interval === '4hour') return 'Time Series (4hour)';
    if (interval === '1day') return 'Time Series (Daily)';
    if (interval === '1week') return 'Weekly Time Series';
    return 'Time Series (Daily)';
  }

  private getMockData(symbol: string, interval: string) {
    console.log(`Generating mock data for ${symbol} with interval ${interval}`);
    const timeSeriesKey = this.getTimeSeriesKey(interval);
    const timeSeries: any = {};
    const now = new Date();
    const dataPoints = 100;
    
    let basePrice = 150 + Math.random() * 50;
    let intervalMs: number;
    
    // Determine interval in milliseconds
    switch (interval) {
      case '15min':
        intervalMs = 15 * 60 * 1000;
        break;
      case '1hour':
      case '60min':
        intervalMs = 60 * 60 * 1000;
        break;
      case '4hour':
        intervalMs = 4 * 60 * 60 * 1000;
        break;
      case '1day':
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case '1week':
        intervalMs = 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        intervalMs = 15 * 60 * 1000;
    }

    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMs);
      const dateStr = interval === '1day' || interval === '1week'
        ? timestamp.toISOString().split('T')[0]
        : timestamp.toISOString().replace('T', ' ').substring(0, 19);

      // Generate realistic price movement
      const change = (Math.random() - 0.5) * basePrice * 0.02; // 2% max change
      basePrice += change;
      
      const open = basePrice;
      const close = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(1000000 + Math.random() * 5000000);

      timeSeries[dateStr] = {
        '1. open': open.toFixed(4),
        '2. high': high.toFixed(4),
        '3. low': low.toFixed(4),
        '4. close': close.toFixed(4),
        '5. volume': volume.toString()
      };
    }

    return {
      'Meta Data': {
        '1. Information': `${interval} Time Series (Mock Data)`,
        '2. Symbol': symbol,
        '3. Last Refreshed': new Date().toISOString(),
        '4. Interval': interval
      },
      [timeSeriesKey]: timeSeries
    };
  }
}
