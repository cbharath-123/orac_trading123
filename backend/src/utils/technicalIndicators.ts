import { TimeSeriesData, TechnicalIndicators } from '../types';

export class TechnicalIndicatorsCalculator {
  // Calculate EMA
  static calculateEMA(data: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    // Start with SMA
    let sma = 0;
    for (let i = 0; i < period; i++) {
      sma += data[i];
    }
    sma = sma / period;
    ema.push(sma);

    // Calculate EMA
    for (let i = period; i < data.length; i++) {
      const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }

    return ema;
  }

  // Calculate RSI
  static calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate average gains and losses
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // First RSI
    let rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));

    // Subsequent RSI values
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
  }

  // Calculate ATR (Average True Range)
  static calculateATR(high: number[], low: number[], close: number[], period: number = 14): number[] {
    const tr: number[] = [];
    const atr: number[] = [];

    // Calculate True Range
    for (let i = 1; i < high.length; i++) {
      const hl = high[i] - low[i];
      const hc = Math.abs(high[i] - close[i - 1]);
      const lc = Math.abs(low[i] - close[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }

    // Calculate initial ATR (simple average)
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += tr[i];
    }
    atr.push(sum / period);

    // Calculate subsequent ATR values (smoothed)
    for (let i = period; i < tr.length; i++) {
      const currentATR = (atr[atr.length - 1] * (period - 1) + tr[i]) / period;
      atr.push(currentATR);
    }

    return atr;
  }

  // Calculate Supertrend
  static calculateSupertrend(
    high: number[],
    low: number[],
    close: number[],
    period: number = 10,
    multiplier: number = 3
  ): { supertrend: number[]; direction: number[] } {
    const atr = this.calculateATR(high, low, close, period);
    const supertrend: number[] = [];
    const direction: number[] = [];

    let trend = 1; // 1 for uptrend, -1 for downtrend

    for (let i = 0; i < close.length - period; i++) {
      const hl2 = (high[i + period] + low[i + period]) / 2;
      const upperBand = hl2 + multiplier * atr[i];
      const lowerBand = hl2 - multiplier * atr[i];

      if (i === 0) {
        supertrend.push(close[i + period] > hl2 ? lowerBand : upperBand);
        direction.push(close[i + period] > hl2 ? 1 : -1);
        trend = direction[0];
      } else {
        const prevSupertrend = supertrend[i - 1];
        const prevClose = close[i + period - 1];
        const currentClose = close[i + period];

        if (trend === 1) {
          const newLowerBand = Math.max(lowerBand, prevSupertrend);
          if (currentClose <= newLowerBand) {
            trend = -1;
            supertrend.push(upperBand);
          } else {
            supertrend.push(newLowerBand);
          }
        } else {
          const newUpperBand = Math.min(upperBand, prevSupertrend);
          if (currentClose >= newUpperBand) {
            trend = 1;
            supertrend.push(lowerBand);
          } else {
            supertrend.push(newUpperBand);
          }
        }
        direction.push(trend);
      }
    }

    return { supertrend, direction };
  }

  // Calculate ADX
  static calculateADX(high: number[], low: number[], close: number[], period: number = 14): number[] {
    const adx: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];
    const tr: number[] = [];

    // Calculate +DM, -DM, and TR
    for (let i = 1; i < high.length; i++) {
      const highDiff = high[i] - high[i - 1];
      const lowDiff = low[i - 1] - low[i];

      plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
      minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

      const hl = high[i] - low[i];
      const hc = Math.abs(high[i] - close[i - 1]);
      const lc = Math.abs(low[i] - close[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }

    // Smooth +DM, -DM, and TR
    const smoothPlusDM = this.smooth(plusDM, period);
    const smoothMinusDM = this.smooth(minusDM, period);
    const smoothTR = this.smooth(tr, period);

    // Calculate +DI and -DI
    const plusDI: number[] = [];
    const minusDI: number[] = [];
    for (let i = 0; i < smoothTR.length; i++) {
      plusDI.push((smoothPlusDM[i] / smoothTR[i]) * 100);
      minusDI.push((smoothMinusDM[i] / smoothTR[i]) * 100);
    }

    // Calculate DX
    const dx: number[] = [];
    for (let i = 0; i < plusDI.length; i++) {
      const diSum = plusDI[i] + minusDI[i];
      const diDiff = Math.abs(plusDI[i] - minusDI[i]);
      dx.push(diSum === 0 ? 0 : (diDiff / diSum) * 100);
    }

    // Calculate ADX (smoothed DX)
    return this.smooth(dx, period);
  }

  // Helper function to smooth data
  private static smooth(data: number[], period: number): number[] {
    const result: number[] = [];
    let sum = 0;

    for (let i = 0; i < period && i < data.length; i++) {
      sum += data[i];
    }
    result.push(sum / Math.min(period, data.length));

    for (let i = period; i < data.length; i++) {
      const smoothed = (result[result.length - 1] * (period - 1) + data[i]) / period;
      result.push(smoothed);
    }

    return result;
  }

  // Calculate slope (for EMA and MACD histogram)
  static calculateSlope(data: number[], index: number, period: number = 1): number {
    if (index < period) return 0;
    return data[index] - data[index - period];
  }

  // Normalize value using ATR
  static normalizeWithATR(value: number, atr: number): number {
    return atr !== 0 ? value / atr : 0;
  }

  // Calculate confidence based on ADX
  static calculateConfidence(adx: number, threshold: number = 25): number {
    return Math.max(0, Math.min(1, (adx - threshold) / threshold));
  }

  // Calculate final score
  static calculateScore(
    emaScore: number,
    rsiScore: number,
    macdScore: number,
    supertrendScore: number,
    weights: { ema: number; rsi: number; macd: number; supertrend: number } = {
      ema: 0.3,
      rsi: 0.2,
      macd: 0.25,
      supertrend: 0.25
    }
  ): number {
    return (
      emaScore * weights.ema +
      rsiScore * weights.rsi +
      macdScore * weights.macd +
      supertrendScore * weights.supertrend
    );
  }

  // Map score to -100 to +100 range
  static mapScoreToRange(score: number): number {
    return Math.max(-100, Math.min(100, score * 100));
  }

  // Determine bias from score
  static determineBias(score: number): 'Bullish' | 'Bearish' | 'Neutral' {
    if (score >= 20) return 'Bullish';
    if (score <= -20) return 'Bearish';
    return 'Neutral';
  }

  // Calculate grade
  static calculateGrade(score: number): string {
    const absScore = Math.abs(score);
    if (absScore >= 80) return 'A+';
    if (absScore >= 70) return 'A';
    if (absScore >= 60) return 'B+';
    if (absScore >= 50) return 'B';
    if (absScore >= 40) return 'C+';
    if (absScore >= 30) return 'C';
    if (absScore >= 20) return 'D';
    return 'F';
  }
}
