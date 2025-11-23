import { TwelveDataService } from './twelveDataService';
import { TechnicalIndicatorsCalculator } from '../utils/technicalIndicators';
import { TimeSeriesData, TechnicalIndicators, TimeframeScore, AggregatedBias } from '../types';

export class MarketDataService {
  private dataService: TwelveDataService;

  constructor() {
    this.dataService = new TwelveDataService();
  }

  // Parse Alpha Vantage time series response
  private parseTimeSeriesData(apiResponse: any, seriesKey: string): TimeSeriesData[] {
    console.log(`Parsing time series with key: ${seriesKey}`);
    console.log(`API Response keys:`, Object.keys(apiResponse));
    
    const timeSeries = apiResponse[seriesKey];
    if (!timeSeries) {
      console.error(`No time series found for key: ${seriesKey}`);
      return [];
    }

    const data: TimeSeriesData[] = [];
    for (const [timestamp, values] of Object.entries(timeSeries)) {
      const v = values as any;
      data.push({
        timestamp,
        open: parseFloat(v['1. open'] || v.open),
        high: parseFloat(v['2. high'] || v.high),
        low: parseFloat(v['3. low'] || v.low),
        close: parseFloat(v['4. close'] || v.close),
        volume: parseFloat(v['5. volume'] || v.volume)
      });
    }

    console.log(`Parsed ${data.length} data points`);
    return data.reverse(); // Reverse to get chronological order
  }

  // Get data for a specific timeframe
  async getTimeframeData(symbol: string, timeframe: string): Promise<TimeSeriesData[]> {
    try {
      let apiResponse: any;
      let seriesKey: string;

      switch (timeframe) {
        case '15min':
        case '15m':
          apiResponse = await this.dataService.getIntradayData(symbol, '15min');
          seriesKey = 'Time Series (15min)';
          break;
        case '1hour':
        case '1h':
        case '60min':
          apiResponse = await this.dataService.getIntradayData(symbol, '60min');
          seriesKey = 'Time Series (60min)';
          break;
        case '4hour':
        case '4h':
          apiResponse = await this.dataService.getIntradayData(symbol, '60min');
          seriesKey = 'Time Series (60min)';
          // TODO: Aggregate 60min data to 4hour
          break;
        case '1day':
        case '1D':
        case 'daily':
          apiResponse = await this.dataService.getDailyData(symbol);
          seriesKey = 'Time Series (Daily)';
          break;
        case '1week':
        case '1W':
        case 'weekly':
          apiResponse = await this.dataService.getWeeklyData(symbol);
          seriesKey = 'Weekly Time Series';
          break;
        default:
          throw new Error(`Unsupported timeframe: ${timeframe}`);
      }

      return this.parseTimeSeriesData(apiResponse, seriesKey);
    } catch (error: any) {
      throw new Error(`Failed to get data for ${timeframe}: ${error.message}`);
    }
  }

  // Calculate technical indicators for a timeframe
  calculateIndicators(data: TimeSeriesData[]): TechnicalIndicators | null {
    if (data.length < 50) return null; // Need enough data

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);

    // Calculate EMA
    const ema = TechnicalIndicatorsCalculator.calculateEMA(closes, 50);
    const emaSlope = TechnicalIndicatorsCalculator.calculateSlope(ema, ema.length - 1);

    // Calculate RSI
    const rsi = TechnicalIndicatorsCalculator.calculateRSI(closes, 14);
    const rsiValue = rsi[rsi.length - 1];
    const rsiMomentum = TechnicalIndicatorsCalculator.calculateSlope(rsi, rsi.length - 1);

    // Calculate ATR
    const atr = TechnicalIndicatorsCalculator.calculateATR(highs, lows, closes, 14);
    const atrValue = atr[atr.length - 1];

    // Calculate Supertrend
    const supertrend = TechnicalIndicatorsCalculator.calculateSupertrend(highs, lows, closes);
    const supertrendDirection = supertrend.direction[supertrend.direction.length - 1];

    // Calculate ADX
    const adx = TechnicalIndicatorsCalculator.calculateADX(highs, lows, closes, 14);
    const adxValue = adx[adx.length - 1] || 25;

    // For demo purposes, simulate MACD (in production, use Alpha Vantage MACD API)
    const macdHist = (ema[ema.length - 1] - closes[closes.length - 1]) / closes[closes.length - 1] * 10;
    const macdHistSlope = TechnicalIndicatorsCalculator.calculateSlope([macdHist], 0);

    return {
      ema: ema[ema.length - 1],
      emaSlope: TechnicalIndicatorsCalculator.normalizeWithATR(emaSlope, atrValue),
      rsi: rsiValue,
      rsiMomentum,
      macd: 0, // Simplified
      macdSignal: 0, // Simplified
      macdHist,
      macdHistSlope: TechnicalIndicatorsCalculator.normalizeWithATR(macdHistSlope, atrValue),
      supertrend: supertrend.supertrend[supertrend.supertrend.length - 1],
      supertrendDirection,
      adx: adxValue,
      atr: atrValue
    };
  }

  // Calculate score for a timeframe
  calculateTimeframeScore(indicators: TechnicalIndicators): number {
    // EMA Score (normalized slope)
    const emaScore = Math.max(-1, Math.min(1, indicators.emaSlope));

    // RSI Score (70% level, 30% momentum)
    const rsiLevel = (indicators.rsi - 50) / 50; // -1 to 1
    const rsiMomentumNorm = Math.max(-1, Math.min(1, indicators.rsiMomentum / 10));
    const rsiScore = rsiLevel * 0.7 + rsiMomentumNorm * 0.3;

    // MACD Score (normalized histogram slope)
    const macdScore = Math.max(-1, Math.min(1, indicators.macdHistSlope));

    // Supertrend Score
    const supertrendScore = indicators.supertrendDirection;

    // Calculate weighted score
    const score = TechnicalIndicatorsCalculator.calculateScore(
      emaScore,
      rsiScore,
      macdScore,
      supertrendScore
    );

    // Calculate confidence
    const confidence = TechnicalIndicatorsCalculator.calculateConfidence(indicators.adx);

    // Apply confidence to score
    return score * (0.5 + 0.5 * confidence);
  }

  // Get multi-timeframe analysis
  async getMultiTimeframeAnalysis(symbol: string, timeframes: string[]): Promise<AggregatedBias> {
    const timeframeScores: TimeframeScore[] = [];

    // Timeframe weights
    const timeframeWeights: { [key: string]: number } = {
      '15min': 0.5,
      '15m': 0.5,
      '1hour': 1.0,
      '1h': 1.0,
      '60min': 1.0,
      '4hour': 1.5,
      '4h': 1.5,
      '1day': 2.0,
      '1D': 2.0,
      'daily': 2.0,
      '1week': 2.5,
      '1W': 2.5,
      'weekly': 2.5
    };

    let totalWeightedScore = 0;
    let totalWeight = 0;
    let totalConfidence = 0;

    // Analyze each timeframe
    for (const timeframe of timeframes) {
      try {
        const data = await this.getTimeframeData(symbol, timeframe);
        const indicators = this.calculateIndicators(data);

        if (indicators) {
          const score = this.calculateTimeframeScore(indicators);
          const normalizedScore = TechnicalIndicatorsCalculator.mapScoreToRange(score);
          const confidence = TechnicalIndicatorsCalculator.calculateConfidence(indicators.adx);
          const bias = TechnicalIndicatorsCalculator.determineBias(normalizedScore);

          timeframeScores.push({
            timeframe,
            score: normalizedScore,
            confidence,
            indicators,
            bias
          });

          const weight = timeframeWeights[timeframe] || 1.0;
          totalWeightedScore += normalizedScore * weight;
          totalWeight += weight;
          totalConfidence += confidence;
        }
      } catch (error) {
        console.error(`Error analyzing ${timeframe}:`, error);
      }
    }

    // Calculate overall metrics
    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const avgConfidence = timeframeScores.length > 0 ? totalConfidence / timeframeScores.length : 0;
    const grade = TechnicalIndicatorsCalculator.calculateGrade(overallScore);
    const bias = TechnicalIndicatorsCalculator.determineBias(overallScore);

    return {
      overallScore: Math.round(overallScore),
      grade,
      bias,
      confidence: avgConfidence,
      timeframes: timeframeScores
    };
  }

  // Get current price and chart data
  async getChartData(symbol: string, interval: string = '15min'): Promise<TimeSeriesData[]> {
    try {
      const data = await this.getTimeframeData(symbol, interval);
      return data.slice(-100); // Return last 100 candles
    } catch (error: any) {
      throw new Error(`Failed to get chart data: ${error.message}`);
    }
  }
}
