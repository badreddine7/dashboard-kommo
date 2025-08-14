import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '@/contexts/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderColor?: string[];
      borderWidth?: number;
    }[];
  };
  options?: Partial<ChartOptions<'doughnut'>>;
  size?: number;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ 
  data, 
  options = {}, 
  size = 200 
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const defaultOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? 'hsl(240 10% 98%)' : 'hsl(240 10% 4%)',
          font: {
            size: 12,
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'hsl(240 8% 6%)' : 'hsl(0 0% 100%)',
        titleColor: isDark ? 'hsl(240 10% 98%)' : 'hsl(240 10% 4%)',
        bodyColor: isDark ? 'hsl(240 10% 98%)' : 'hsl(240 10% 4%)',
        borderColor: isDark ? 'hsl(240 6% 12%)' : 'hsl(240 5% 85%)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
    cutout: '60%',
    ...options,
  };

  return (
    <div style={{ height: size, width: size, margin: '0 auto' }}>
      <Doughnut data={data} options={defaultOptions} />
    </div>
  );
};

export default DoughnutChart;