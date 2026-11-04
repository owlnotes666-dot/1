"use client";

import { useMemo, useState } from "react";
import { useDoctors } from "../hooks/useDoctors";
import { useIsAdmin } from "@/features/auth/hooks/useIsAdmin";
import { useUpdateDoctorStatus } from "../hooks/useUpdateDoctorStatus";
import AddDoctorModal from "./AddDoctorModal";
import EditDoctorModal from "./EditDoctorModal";
import type { Doctor } from "../types/doctor.types";

export default function DoctorsClient() {
  const { data: doctors = [], isLoading, isError, error } = useDoctors();

  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();

  const updateStatusMutation = useUpdateDoctorStatus();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const specialties = useMemo(
    () => [
      "All Specialties",
      ...Array.from(new Set(doctors.map((doctor) => doctor.specialty))).sort(),
    ],
    [doctors],
  );

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesSearch =
        doctor.full_name.toLowerCase().includes(normalizedSearch) ||
        (doctor.email ?? "").toLowerCase().includes(normalizedSearch);

      const matchesSpecialty =
        selectedSpecialty === "All Specialties" ||
        doctor.specialty === selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, searchTerm, selectedSpecialty]);

  const handleStatusChange = (doctor: Doctor) => {
    if (!isAdmin || isAdminLoading || updateStatusMutation.isPending) {
      return;
    }

    const nextStatus = doctor.status === "Active" ? "Inactive" : "Active";

    updateStatusMutation.mutate({
      id: doctor.id,
      status: nextStatus,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
            CLINIC MANAGEMENT
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Doctors
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage doctors, specialties, and contact information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          disabled={!isAdmin || isAdminLoading}
          title={
            isAdmin
              ? "Add a new doctor"
              : "Only administrators can add doctors."
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-lg leading-none">+</span>
          Add Doctor
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Doctors Directory
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </p>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="doctor-search"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Search doctors
            </label>

            <input
              id="doctor-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="doctor-specialty"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Filter by specialty
            </label>

            <select
              id="doctor-specialty"
              value={selectedSpecialty}
              onChange={(event) => setSelectedSpecialty(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>
        </div>

        {updateStatusMutation.isError && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
            Failed to update doctor status:{" "}
            {updateStatusMutation.error instanceof Error
              ? updateStatusMutation.error.message
              : JSON.stringify(updateStatusMutation.error)}
          </div>
        )}
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading doctors...
          </p>
        ) : isError ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
            Failed to load doctors: {error.message}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No doctors match your search or selected specialty.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Doctor</th>
                  <th className="px-4 py-3 font-medium">Specialty</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900 dark:text-white">
                      {doctor.full_name}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                      {doctor.specialty}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                      {doctor.email || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          doctor.status === "Active"
                            ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {doctor.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDoctor(doctor)}
                          disabled={!isAdmin || isAdminLoading}
                          title={
                            isAdmin
                              ? "Edit doctor"
                              : "Only administrators can edit doctors."
                          }
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-teal-400 dark:hover:bg-teal-950/40"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(doctor)}
                          disabled={
                            !isAdmin ||
                            isAdminLoading ||
                            updateStatusMutation.isPending
                          }
                          title={
                            isAdmin
                              ? `${doctor.status === "Active" ? "Deactivate" : "Activate"} doctor`
                              : "Only administrators can change doctor status."
                          }
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            doctor.status === "Active"
                              ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                              : "text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40"
                          }`}
                        >
                          {updateStatusMutation.isPending
                            ? "Updating..."
                            : doctor.status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAdmin && (
        <>
          <AddDoctorModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
          />

          {selectedDoctor && (
            <EditDoctorModal
              isOpen={!!selectedDoctor}
              doctor={selectedDoctor}
              onClose={() => setSelectedDoctor(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
