"use client";

import {
  AIInsights,
  EcommerceMetrics,
  MonthlyAppointments,
  useDashboardSales,
  useDashboardStats,
} from "..";

import Loading from "@/shared/components/errors/LoadingState";
import { useErrorHandler } from "@/shared/hooks";
import TodaySchedule from "./TodaySchedule";

export default function DashboardClient() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorData,
  } = useDashboardStats();

  const {
    data: appointments,
    isLoading: appointmentsLoading,
    isError: appointmentsError,
    error: appointmentsErrorData,
  } = useDashboardSales();

  useErrorHandler(statsError, statsErrorData);
  useErrorHandler(appointmentsError, appointmentsErrorData);

  if (statsLoading || appointmentsLoading) {
    return <Loading />;
  }

  if (statsError || appointmentsError || !stats || !appointments) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
            CLINIC MANAGEMENT
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Overview
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Here's what's happening at your clinic today.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <svg
            className="h-5 w-5 text-teal-600 dark:text-teal-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Statistics */}
      <EcommerceMetrics stats={stats} />

      {/* Appointment Analytics */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <MonthlyAppointments appointments={appointments} />
        </div>
      </div>
      {/* Today's Schedule */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <TodaySchedule />
        </div>
      </div>
      <AIInsights />
    </div>
  );
}
