"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { useErrorHandler } from "@/shared/hooks/useErrorHandler";
import { useIsAdmin } from "@/features/auth/hooks/useIsAdmin";

import AppointmentStats from "./AppointmentStats";
import AppointmentFilters from "./AppointmentFilters";
import AppointmentsTable from "./AppointmentsTable";
import AppointmentForm from "./AppointmentForm";
import AppointmentsHeader from "./AppointmentsHeader";

import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
} from "../hooks";

import type {
  AppointmentFilters as AppointmentFiltersType,
  AppointmentWithRelations,
} from "../types";

import type { AppointmentFormValues } from "../schemas/appointmentSchema";

import { Modal } from "@/shared/components/modal";
import Loading from "@/app/loading";

export default function AppointmentsClient() {
  const [filters, setFilters] = useState<AppointmentFiltersType>({
    page: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);

  const {
    data: isAdmin = false,
    isLoading: isAdminLoading,
  } = useIsAdmin();

  const {
    data: appointments,
    isLoading,
    isError,
    error,
  } = useAppointments(filters);

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();

  useErrorHandler(isError, error);

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;

  const isMutating =
    isSubmitting || cancelMutation.isPending;

  // Sequential soft entrance animation
  useGSAP(
    () => {
      if (isLoading) return;

      const tl = gsap.timeline({
        defaults: {
          ease: "power3.out",
          duration: 0.55,
        },
      });

      tl.from("[data-animate='header']", {
        opacity: 0,
        y: 24,
        clearProps: "all",
      })
        .from(
          "[data-animate='stats']",
          {
            opacity: 0,
            y: 28,
            scale: 0.98,
            clearProps: "all",
          },
          "-=0.3",
        )
        .from(
          "[data-animate='filters']",
          {
            opacity: 0,
            y: 20,
            clearProps: "all",
          },
          "-=0.28",
        )
        .from(
          "[data-animate='content']",
          {
            opacity: 0,
            y: 26,
            clearProps: "all",
          },
          "-=0.25",
        );
    },
    { scope: rootRef, dependencies: [isLoading] },
  );

  const openCreateModal = () => {
    if (!isAdmin || isAdminLoading) return;

    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (appointment: AppointmentWithRelations) => {
    if (!isAdmin || isAdminLoading) return;

    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleSubmit = async (values: AppointmentFormValues) => {
    if (!isAdmin || isAdminLoading) {
      toast.error("You don't have permission to modify appointments.");
      return;
    }

    try {
      if (selectedAppointment) {
        await updateMutation.mutateAsync({
          id: selectedAppointment.id,
          ...values,
        });

        toast.success("Appointment updated successfully.");
      } else {
        await createMutation.mutateAsync(values);

        toast.success("Appointment scheduled successfully.");
      }

      setIsModalOpen(false);
      setSelectedAppointment(null);
    } catch {
      toast.error("Unable to save appointment. Please try again.");
    }
  };

  const handleCancel = async (
    appointment: AppointmentWithRelations,
  ) => {
    if (!isAdmin || isAdminLoading) {
      toast.error("You don't have permission to cancel appointments.");
      return;
    }

    if (cancelMutation.isPending) return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel the appointment for ${
        appointment.patients?.full_name ?? "this patient"
      }?`,
    );

    if (!confirmed) return;

    try {
      await cancelMutation.mutateAsync(appointment.id);

      toast.success("Appointment cancelled successfully.");
    } catch {
      toast.error("Unable to cancel appointment. Please try again.");
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div ref={rootRef} className="space-y-6">
      <div data-animate="header">
        <AppointmentsHeader
          onAddAppointment={openCreateModal}
          isAdmin={isAdmin && !isAdminLoading}
        />
      </div>

      <div data-animate="stats">
        <AppointmentStats />
      </div>

      <div data-animate="filters">
        <AppointmentFilters
          filters={filters}
          onChange={setFilters}
        />
      </div>

      <div data-animate="content">
        {isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20">
            Unable to load appointments. Please refresh the page.
          </div>
        ) : (
          <AppointmentsTable
            appointments={appointments ?? []}
            onEdit={openEditModal}
            onCancel={handleCancel}
            isAdmin={isAdmin && !isAdminLoading}
          />
        )}
      </div>

      {isAdmin && !isAdminLoading && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
        >
          <h2 className="mb-4 text-lg font-semibold">
            {selectedAppointment
              ? "Edit Appointment"
              : "Schedule Appointment"}
          </h2>

          <AppointmentForm
            appointment={selectedAppointment}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onClose={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}