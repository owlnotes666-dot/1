"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

import { usePatientMonthlyStats } from "../hooks";
import type { AnalyticsDateRange } from "../types";

interface PatientAnalyticsChartProps {
  dateRange: AnalyticsDateRange;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

export default function PatientAnalyticsChart({
  dateRange,
}: PatientAnalyticsChartProps) {
  const { data, isLoading, isError } = usePatientMonthlyStats(dateRange);

  if (isLoading) {
    return (
      <div className="h-[350px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-2xl border border-red-200 text-sm text-red-500">
        Failed to load patient analytics.
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "New Patients",
        data: data.map((item) => item.total),
        fill: true,
        backgroundColor: "rgba(15, 157, 145, 0.10)",
        borderColor: "#0F9D91",
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#0F9D91",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#172B4D",
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        grid: {
          color: "rgba(148, 163, 184, 0.15)",
        },
        border: {
          display: false,
          dash: [4, 4],
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Patient Analytics
        </h3>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          New patient registrations over the last 6 months
        </p>
      </div>

      <div className="h-[300px] w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
