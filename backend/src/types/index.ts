// Backend Type Definitions

export interface TimeSeriesData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  ema: number;
  emaSlope: number;
  rsi: number;
  rsiMomentum: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  macdHistSlope: number;
  supertrend: number;
  supertrendDirection: number; // 1 for bullish, -1 for bearish
  adx: number;
  atr: number;
}

export interface TimeframeScore {
  timeframe: string;
  score: number;
  confidence: number;
  indicators: TechnicalIndicators;
  bias: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface AggregatedBias {
  overallScore: number;
  grade: string;
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  timeframes: TimeframeScore[];
}

export interface AlphaVantageTimeSeriesResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Interval'?: string;
    '5. Output Size'?: string;
    '6. Time Zone': string;
  };
  [key: string]: any;
}

export interface MarketDataRequest {
  symbol: string;
  timeframes: string[];
}
