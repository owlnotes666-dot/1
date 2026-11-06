"use client";

import AnalyticsStats from "./AnalyticsStats";
import PatientAnalyticsChart from "./PatientAnalyticsChart";
import AnalyticsDateFilter from "./AnalyticsDateFilter";
import CustomDateRangePicker from "./CustomDateRangePicker";
import { useAnalyticsDateRange } from "../hooks";

export default function AnalyticsClient() {
  const {
    period,
    setPeriod,
    dateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
  } = useAnalyticsDateRange();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitor your healthcare system performance and statistics.
        </p>
      </div>

      <div className="space-y-4">
        <AnalyticsDateFilter period={period} onPeriodChange={setPeriod} />

        {period === "custom" && (
          <CustomDateRangePicker
            startDate={customStartDate}
            endDate={customEndDate}
            onStartDateChange={setCustomStartDate}
            onEndDateChange={setCustomEndDate}
          />
        )}
      </div>

      <AnalyticsStats dateRange={dateRange} />

      <PatientAnalyticsChart dateRange={dateRange} />
    </div>
  );
}
