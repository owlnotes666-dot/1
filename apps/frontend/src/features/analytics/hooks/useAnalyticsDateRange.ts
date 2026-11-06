import { useMemo, useState } from "react";
import type {
  AnalyticsDateRange,
  AnalyticsPeriod,
} from "../types";

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateRange = (
  period: AnalyticsPeriod,
  customStartDate: string,
  customEndDate: string,
): AnalyticsDateRange => {
  const endDate = new Date();
  const startDate = new Date(endDate);

  if (period === "custom") {
    const validStartDate =
      /^\d{4}-\d{2}-\d{2}$/.test(customStartDate) &&
      !Number.isNaN(new Date(`${customStartDate}T00:00:00`).getTime());

    const validEndDate =
      /^\d{4}-\d{2}-\d{2}$/.test(customEndDate) &&
      !Number.isNaN(new Date(`${customEndDate}T00:00:00`).getTime());

    if (!validStartDate || !validEndDate) {
      startDate.setDate(startDate.getDate() - 29);

      return {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    }

    const customStart = new Date(
      `${customStartDate}T00:00:00`,
    );

    const customEnd = new Date(
      `${customEndDate}T23:59:59.999`,
    );

    return {
      period,
      startDate: customStart.toISOString(),
      endDate: customEnd.toISOString(),
    };
  }

  switch (period) {
    case "7d":
      startDate.setDate(startDate.getDate() - 6);
      break;

    case "30d":
      startDate.setDate(startDate.getDate() - 29);
      break;

    case "3m":
      startDate.setMonth(startDate.getMonth() - 3);
      break;

    case "6m":
      startDate.setMonth(startDate.getMonth() - 6);
      break;

    case "year":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return {
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

export const useAnalyticsDateRange = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return formatLocalDate(date);
  });

  const [customEndDate, setCustomEndDate] = useState(() =>
    formatLocalDate(new Date()),
  );

  const dateRange = useMemo(
    () =>
      getDateRange(period, customStartDate, customEndDate),
    [period, customStartDate, customEndDate],
  );

  return {
    period,
    setPeriod,
    dateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
  };
};