"use client";

import { Plus, CalendarDays } from "lucide-react";

interface Props {
  onAddAppointment: () => void;
}

export default function AppointmentsHeader({ onAddAppointment }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {" "}
      <div>
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <CalendarDays className="h-6 w-6 text-[#0F9D91]" />{" "}
          <h1 className="text-2xl font-semibold text-[#172B4D] dark:text-white">
            Appointments{" "}
          </h1>{" "}
        </div>
        <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">
          Manage, track, and organize patient appointments.
        </p>
      </div>
      <button
        type="button"
        onClick={onAddAppointment}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0F9D91] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#0c897f]"
      >
        <Plus className="h-4 w-4" />
        Schedule Appointment
      </button>
    </div>
  );
}
