"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  appointmentSchema,
  type AppointmentFormValues,
} from "../schemas/appointmentSchema";
import { useAppointmentFormOptions } from "../hooks";
import type { AppointmentWithRelations } from "../types";

interface Props {
  appointment?: AppointmentWithRelations | null;
  isSubmitting?: boolean;
  onSubmit: (values: AppointmentFormValues) => void;
  onClose: () => void;
}

const inputClass =
  "mt-1 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#0F9D91] focus:ring-2 focus:ring-[#0F9D91]/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200";

export default function AppointmentForm({
  appointment,
  isSubmitting = false,
  onSubmit,
  onClose,
}: Props) {
  const { data: options, isLoading, isError } = useAppointmentFormOptions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: "",
      doctor_id: "",
      appointment_date: "",
      appointment_time: "",
      status: "Scheduled",
    },
  });

  useEffect(() => {
    if (appointment) {
      reset({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time.slice(0, 5),
        status: appointment.status,
      });
    } else {
      reset({
        patient_id: "",
        doctor_id: "",
        appointment_date: "",
        appointment_time: "",
        status: "Scheduled",
      });
    }
  }, [appointment, reset]);

  const fieldErrorClass = "mt-1 text-xs text-red-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
          {" "}
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading patients and doctors...{" "}
        </div>
      ) : isError || !options ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20">
          Unable to load patients and doctors. Please try again.{" "}
        </div>
      ) : (
        <>
          {" "}
          <div>
            {" "}
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Patient{" "}
            </label>
            <select {...register("patient_id")} className={inputClass}>
              {" "}
              <option value="">Select a patient</option>
              {options.patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}{" "}
                </option>
              ))}{" "}
            </select>
            {errors.patient_id && (
              <p className={fieldErrorClass}>{errors.patient_id.message}</p>
            )}{" "}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Doctor
            </label>
            <select {...register("doctor_id")} className={inputClass}>
              <option value="">Select a doctor</option>
              {options.doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name} — {doctor.specialty}
                </option>
              ))}
            </select>
            {errors.doctor_id && (
              <p className={fieldErrorClass}>{errors.doctor_id.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Appointment Date
              </label>
              <input
                type="date"
                {...register("appointment_date")}
                className={inputClass}
              />
              {errors.appointment_date && (
                <p className={fieldErrorClass}>
                  {errors.appointment_date.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Appointment Time
              </label>
              <input
                type="time"
                {...register("appointment_time")}
                className={inputClass}
              />
              {errors.appointment_time && (
                <p className={fieldErrorClass}>
                  {errors.appointment_time.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select {...register("status")} className={inputClass}>
              <option value="Scheduled">Scheduled</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No-show">No-show</option>
            </select>
            {errors.status && (
              <p className={fieldErrorClass}>{errors.status.message}</p>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting || isLoading || isError || !options}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F9D91] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0c897f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {appointment ? "Save Changes" : "Schedule Appointment"}
        </button>
      </div>
    </form>
  );
}
