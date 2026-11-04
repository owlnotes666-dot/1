"use client";

import { useMemo, useState, type ReactNode } from "react";

import { useMedicalRecords } from "../hooks/useMedicalRecords";
import type { MedicalRecordStatus } from "../types/medicalRecord.types";
import { useIsAdmin } from "@/features/auth/hooks/useIsAdmin";
import AddMedicalRecordModal from "./AddMedicalRecordModal";

import { CheckLineIcon, DocsIcon, EyeIcon, TimeIcon } from "@/icons";
import MedicalRecordStatusSelect from "./MedicalRecordStatusSelect.tsx";

const statusStyles: Record<MedicalRecordStatus, string> = {
  Pending:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
  Reviewed:
    "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20",
  Completed:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
          {icon}
        </span>
      </div>

      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

export default function MedicalRecordsClient() {
  const {
    data: records = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useMedicalRecords();

  const stats = useMemo(
    () => ({
      total: records.length,
      pending: records.filter((record) => record.status === "Pending").length,
      reviewed: records.filter((record) => record.status === "Reviewed").length,
      completed: records.filter((record) => record.status === "Completed")
        .length,
    }),
    [records],
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: isAdmin = false, isLoading: isAdminLoading } = useIsAdmin();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
            CLINIC MANAGEMENT
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Medical Records
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage and review patient medical records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isAdmin && !isAdminLoading) setIsAddModalOpen(true);
          }}
          disabled={!isAdmin || isAdminLoading}
          title={
            isAdmin
              ? "Add a medical record"
              : "Demo accounts can view medical records but cannot add them."
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-lg">+</span>
          Add Medical Record
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Records"
          value={stats.total}
          description="All medical records"
          icon={<DocsIcon />}
        />

        <StatCard
          title="Pending"
          value={stats.pending}
          description="Waiting for review"
          icon={<TimeIcon />}
        />

        <StatCard
          title="Reviewed"
          value={stats.reviewed}
          description="Reviewed by doctors"
          icon={<EyeIcon />}
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          description="Completed records"
          icon={<CheckLineIcon />}
        />
      </div>

      {/* Records Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              All Medical Records
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A list of registered patient records.
            </p>
          </div>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {stats.total} records
          </span>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600 dark:border-gray-700 dark:border-t-teal-400" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Loading medical records...
              </p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <p className="font-medium text-red-600">
              Failed to load medical records.
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Try Again
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl text-gray-400 dark:bg-gray-800 dark:text-gray-500">
              ▤
            </div>
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
              No medical records found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Medical records will appear here once they are created.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4">Record</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Date Created</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="transition hover:bg-gray-50/70 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {record.title}
                      </div>
                      <div className="mt-1 max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
                        {record.description || "No description"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {record.patient?.full_name || "Unknown patient"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {record.doctor?.full_name || "Unknown doctor"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {record.doctor?.specialty || "—"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(record.created_at)}
                    </td>

                    <td className="px-6 py-4">
                      <MedicalRecordStatusSelect
                        recordId={record.id}
                        status={record.status}
                        isAdmin={isAdmin}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {isAdmin && (
        <AddMedicalRecordModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
