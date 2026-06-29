import React from 'react';

export default function DashboardChart({ data = [], type = 'tickets' }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>No sales analytics data available yet.</p>
      </div>
    );
  }

  // Find max value to calibrate height ratio
  const valueKey = type === 'revenue' ? 'revenue' : 'ticketsSold';
  const values = data.map(d => d[valueKey]);
  const maxValue = Math.max(...values, type === 'revenue' ? 100 : 10);
  
  // Dimensions
  const chartHeight = 220;
  const paddingBottom = 40;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  
  const width = 600;
  const height = chartHeight + paddingBottom + paddingTop;
  
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = chartHeight;

  // Grid y-ticks
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const val = (maxValue / ticks) * i;
    const y = paddingTop + graphHeight - (graphHeight / ticks) * i;
    return { val, y };
  });

  // Calculate Bar coordinates
  const barWidth = Math.max(15, Math.min(45, (graphWidth / data.length) * 0.5));
  const spacing = (graphWidth - barWidth * data.length) / (data.length + 1);

  const bars = data.map((item, index) => {
    const val = item[valueKey];
    const barHeight = (val / maxValue) * graphHeight;
    const x = paddingLeft + spacing + index * (barWidth + spacing);
    const y = paddingTop + graphHeight - barHeight;
    return {
      x,
      y,
      h: Math.max(barHeight, 2), // min height of 2px
      w: barWidth,
      label: item.label,
      value: val
    };
  });

  return (
    <div className="svg-chart-container">
      <div className="chart-header">
        <h4>{type === 'revenue' ? 'Revenue Generation (₹)' : 'Tickets Distributed (Qty)'}</h4>
      </div>
      <div className="svg-wrapper">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--secondary)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={tick.y} 
                x2={width - paddingRight} 
                y2={tick.y} 
                className="grid-line" 
              />
              <text 
                x={paddingLeft - 10} 
                y={tick.y + 4} 
                textAnchor="end" 
                className="tick-label"
              >
                {type === 'revenue' ? `₹${Math.round(tick.val)}` : Math.round(tick.val)}
              </text>
            </g>
          ))}

          {/* Axis lines */}
          <line 
            x1={paddingLeft} 
            y1={paddingTop + graphHeight} 
            x2={width - paddingRight} 
            y2={paddingTop + graphHeight} 
            className="axis-line" 
          />
          <line 
            x1={paddingLeft} 
            y1={paddingTop} 
            x2={paddingLeft} 
            y2={paddingTop + graphHeight} 
            className="axis-line" 
          />

          {/* Draw bars */}
          {bars.map((bar, idx) => (
            <g key={idx} className="chart-bar-group">
              <rect 
                x={bar.x} 
                y={bar.y} 
                width={bar.w} 
                height={bar.h} 
                rx="4"
                fill="url(#barGradient)"
                className="chart-bar"
              />
              {/* Value label on top of bar on hover */}
              <text
                x={bar.x + bar.w / 2}
                y={bar.y - 6}
                textAnchor="middle"
                className="bar-value-label"
              >
                {type === 'revenue' ? `₹${bar.value.toFixed(0)}` : bar.value}
              </text>
              {/* X-axis labels */}
              <text 
                x={bar.x + bar.w / 2} 
                y={paddingTop + graphHeight + 20} 
                textAnchor="middle" 
                className="x-axis-label"
                transform={`rotate(-15, ${bar.x + bar.w / 2}, ${paddingTop + graphHeight + 20})`}
              >
                {bar.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .svg-chart-container {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          margin-top: 1rem;
        }

        .chart-header {
          margin-bottom: 1rem;
        }

        .chart-header h4 {
          font-size: 0.95rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0;
        }

        .svg-wrapper {
          position: relative;
          width: 100%;
        }

        .grid-line {
          stroke: rgba(255, 255, 255, 0.04);
          stroke-width: 1px;
        }

        .axis-line {
          stroke: rgba(131, 56, 236, 0.25);
          stroke-width: 1px;
        }

        .tick-label {
          fill: var(--text-muted);
          font-size: 10px;
          font-weight: 500;
        }

        .x-axis-label {
          fill: var(--text-muted);
          font-size: 10px;
          font-weight: 500;
        }

        .chart-bar {
          transition: height 0.5s ease, y 0.5s ease, fill 0.3s ease;
          cursor: pointer;
        }

        .chart-bar:hover {
          fill: var(--secondary-hover);
          filter: drop-shadow(0px 0px 8px rgba(0, 245, 212, 0.4));
        }

        .bar-value-label {
          fill: var(--secondary);
          font-size: 10px;
          font-weight: 700;
          opacity: 0;
          transition: var(--transition);
        }

        .chart-bar-group:hover .bar-value-label {
          opacity: 1;
        }

        .chart-empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: var(--radius-md);
          border: 1px dashed var(--border-glass);
          color: var(--text-muted);
          font-size: 0.9rem;
        }
      `}} />
    </div>
  );
}
