import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import ErrorBoundary from './ErrorBoundary';
import './styles.css';

const SYMBOLS = ['ETHUSDT', 'BNBUSDT', 'DOTUSDT'];
const INTERVALS = ['1m', '3m', '5m'];

function CandlestickChart({ symbol, interval }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);

  const initializeChart = useCallback(() => {
    if (chartContainerRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          backgroundColor: '#1e222d',
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: {
            color: 'rgba(42, 46, 57, 0.5)',
          },
          horzLines: {
            color: 'rgba(42, 46, 57, 0.5)',
          },
        },
        crosshair: {
          mode: 'normal',
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      seriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
      
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  useEffect(() => {
    initializeChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [initializeChart]);

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const candle = data.k;

        const newCandle = {
          time: candle.t / 1000,
          open: parseFloat(candle.o),
          high: parseFloat(candle.h),
          low: parseFloat(candle.l),
          close: parseFloat(candle.c),
        };

        if (seriesRef.current) {
          seriesRef.current.update(newCandle);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol, interval]);

  return <div ref={chartContainerRef} className="chart-container" />;
}

function App() {
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const [interval, setInterval] = useState(INTERVALS[0]);

  const handleSymbolChange = (e) => {
    setSymbol(e.target.value);
  };

  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Crypto Market Data</h1>
        <div className="controls">
          <div className="select-wrapper">
            <select value={symbol} onChange={handleSymbolChange}>
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="select-wrapper">
            <select value={interval} onChange={handleIntervalChange}>
              {INTERVALS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <main className="app-main">
        <ErrorBoundary>
          <CandlestickChart symbol={symbol} interval={interval} />
        </ErrorBoundary>
      </main>
      <footer className="app-footer">
        <p>Data provided by Binance</p>
      </footer>
    </div>
  );
}

export default App;