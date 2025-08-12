'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function CommitsChart({ labels, data }) {
  const [accentColor, setAccentColor] = useState('#007acc'); // fallback

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--panelkit-accent').trim();
    setAccentColor(color);
  }, []);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Commits',
        data,
        backgroundColor: accentColor,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cccccc', // legend label colour
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#cccccc', // x-axis label colour
        },
        grid: {
          color: '#3c3c3c',
        },
      },
      y: {
        ticks: {
          color: '#cccccc', // y-axis label colour
        },
        grid: {
          color: '#3c3c3c',
        },
      },
    },
  };

  return (
    <div className="chart-container" style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
