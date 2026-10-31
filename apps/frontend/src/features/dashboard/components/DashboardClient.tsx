"use client";

import {
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor your clinic's activity and performance.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <EcommerceMetrics stats={stats} />

      {/* Appointment Analytics */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <MonthlyAppointments sales={appointments} />
        </div>
      </div>
      {/* Today's Schedule */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <TodaySchedule />
        </div>
      </div>
    </div>
  );
}
