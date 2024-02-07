// Constants
const API_URL = "https://api.binance.com/api/v3/klines";
const SYMBOL = "SOLUSDT";
const INTERVAL = "1d";
const START_TIME = new Date("2023-01-1").getTime();
const END_TIME = new Date("2024-1-8").getTime();
const TARGET_GROWTH_PER_DAY = 10;

interface Candlestick {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

async function fetchOHLCData(
  startTime: number,
  endTime: number
): Promise<Candlestick[]> {
  try {
    const queryParams = new URLSearchParams({
      symbol: SYMBOL,
      interval: INTERVAL,
      startTime: startTime.toString(),
      endTime: endTime.toString(),
    });

    const response = await fetch(`${API_URL}?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.map((d: any[]) => ({
      openTime: d[0],
      open: d[1],
      high: d[2],
      low: d[3],
      close: d[4],
      volume: d[5],
      closeTime: d[6],
      quoteAssetVolume: d[7],
      numberOfTrades: d[8],
      takerBuyBaseAssetVolume: d[9],
      takerBuyQuoteAssetVolume: d[10],
    }));
  } catch (error) {
    console.error("Error fetching OHLC data:", error);
    return [];
  }
}

async function backtestValueAveraging() {
  const ohlcData = await fetchOHLCData(START_TIME, END_TIME);
  let totalInvestment = 0;
  let total = 0;
  let targetValue = 0;
  let numberOFBuys = 0;

  for (const day of ohlcData) {
    targetValue += TARGET_GROWTH_PER_DAY;
    const btcPrice = parseFloat(day.close);
    const currentValue = total * btcPrice;
    const investmentNeeded = targetValue - currentValue;

    if (investmentNeeded > 0) {
      numberOFBuys++;
      // Only buy, do not sell
      const toBuyAmount = investmentNeeded / btcPrice;
      total += toBuyAmount;
      totalInvestment += investmentNeeded;

      console.log(
        `Bought ${toBuyAmount.toFixed(
          6
        )} ${SYMBOL} at $${btcPrice} with $${investmentNeeded} on ${new Date(
          day.closeTime
        ).toLocaleDateString()}`
      );
    }
    // If investmentNeeded is negative, it implies we're above the target and do nothing.
  }

  // Calculate the final total value of BTC holdings
  const startPrice = parseFloat(ohlcData[0].open);
  const finalPrice = parseFloat(ohlcData[ohlcData.length - 1].close);
  const finalTotalValue = total * finalPrice;

  console.log(
    `Average Price ${SYMBOL}: ${(totalInvestment / total).toFixed(6)}`
  );
  console.log(`Total ${SYMBOL}: ${total.toFixed(6)}`);
  console.log(`Total Investment: $${totalInvestment}`);
  console.log(`Final Total Value: $${finalTotalValue.toFixed(2)}`);
  console.log(`PNL: ${(finalTotalValue - totalInvestment).toFixed(2)}`);
  console.log(
    `PNL: ${(
      ((finalTotalValue - totalInvestment) * 100) /
      totalInvestment
    ).toFixed(2)}%`
  );
  console.log(
    `Hodl PNL: ${(((finalPrice - startPrice) * 100) / startPrice).toFixed(2)}%`
  );
  console.log(`Number of buys: ${numberOFBuys}`)
}

backtestValueAveraging();
