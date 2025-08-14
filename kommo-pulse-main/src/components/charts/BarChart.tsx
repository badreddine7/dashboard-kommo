import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '@/contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
    }[];
  };
  options?: Partial<ChartOptions<'bar'>>;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, options = {}, height = 300 }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const defaultOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? 'hsl(240 10% 98%)' : 'hsl(240 10% 4%)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'hsl(240 8% 6%)' : 'hsl(0 0% 100%)',
        titleColor: isDark ? 'hsl(240 10% 98%)' : 'hsl(240 10% 4%)',
        bodyColor: isDark ? 'hsl(240 10% 98%)' : 'hsl(240 10% 4%)',
        borderColor: isDark ? 'hsl(240 6% 12%)' : 'hsl(240 5% 85%)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? 'hsl(240 6% 12%)' : 'hsl(240 5% 85%)',
        },
        ticks: {
          color: isDark ? 'hsl(240 5% 65%)' : 'hsl(240 5% 45%)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: isDark ? 'hsl(240 6% 12%)' : 'hsl(240 5% 85%)',
        },
        ticks: {
          color: isDark ? 'hsl(240 5% 65%)' : 'hsl(240 5% 45%)',
          font: {
            size: 11,
          },
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 4,
      },
    },
    ...options,
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={defaultOptions} />
    </div>
  );
};

export default BarChart;