"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import { createClient } from "@/lib/supabase/client";
import { DocsIcon, EyeIcon, PatientIcon } from "@/icons";
import Loading from "@/app/loading";
import { useErrorHandler } from "@/shared/hooks";

gsap.registerPlugin(useGSAP);

interface Patient {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  condition: string | null;
  status: string;
  created_at: string;
}

const supabase = createClient();

export default function PatientsClient() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const rootRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  useErrorHandler(Boolean(error), error);

  useEffect(() => {
    async function fetchPatients() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .schema("medical")
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError);
        console.error("Patients fetch error:", fetchError);
      } else {
        setPatients((data ?? []) as Patient[]);
      }

      setLoading(false);
    }

    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        patient.full_name.toLowerCase().includes(searchValue) ||
        (patient.email ?? "").toLowerCase().includes(searchValue) ||
        (patient.phone ?? "").includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || patient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const activeCount = patients.filter(
    (patient) => patient.status === "Active",
  ).length;

  const inactiveCount = patients.filter(
    (patient) => patient.status !== "Active",
  ).length;

  /* ------------------------------ Animations ------------------------------ */

  // Page entrance: header → button → summary cards → table container
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-animate='header-item']", {
        opacity: 0,
        y: 22,
        duration: 0.55,
        stagger: 0.09,
        clearProps: "all",
      })
        .from(
          "[data-animate='add-btn']",
          { opacity: 0, scale: 0.9, duration: 0.45, clearProps: "all" },
          "-=0.35",
        )
        .from(
          "[data-animate='card']",
          {
            opacity: 0,
            y: 34,
            scale: 0.96,
            duration: 0.55,
            stagger: 0.12,
            clearProps: "all",
          },
          "-=0.3",
        )
        .from(
          "[data-animate='table']",
          { opacity: 0, y: 30, duration: 0.6, clearProps: "all" },
          "-=0.35",
        );
    },
    { scope: rootRef, dependencies: [] },
  );

  // Table rows: stagger in when data loads or the status filter changes
  useGSAP(
    () => {
      if (loading) return;

      const rows = rootRef.current?.querySelectorAll<HTMLElement>(
        "[data-animate='row']",
      );
      if (!rows || rows.length === 0) return;

      gsap.from(rows, {
        opacity: 0,
        y: 14,
        duration: 0.4,
        stagger: 0.045,
        ease: "power3.out",
        clearProps: "all",
      });
    },
    { scope: rootRef, dependencies: [loading, statusFilter] },
  );

  const handleAddBtnEnter = () => {
    gsap.to(addBtnRef.current, {
      scale: 1.04,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const handleAddBtnLeave = () => {
    gsap.to(addBtnRef.current, {
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  return (
    <div ref={rootRef} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            data-animate="header-item"
            className="text-sm font-medium text-teal-600 dark:text-teal-400"
          >
            CLINIC MANAGEMENT
          </p>

          <h1
            data-animate="header-item"
            className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            Patients
          </h1>

          <p
            data-animate="header-item"
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            Manage patient information and medical details.
          </p>
        </div>

        <button
          ref={addBtnRef}
          type="button"
          data-animate="add-btn"
          onMouseEnter={handleAddBtnEnter}
          onMouseLeave={handleAddBtnLeave}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <span className="text-lg leading-none">+</span>
          Add Patient
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Patients"
          value={patients.length}
          icon={<PatientIcon />}
          accent="bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
        />

        <SummaryCard
          title="Active Patients"
          value={activeCount}
          icon={<EyeIcon />}
          accent="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
        />

        <SummaryCard
          title="Other Statuses"
          value={inactiveCount}
          icon={<DocsIcon />}
          accent="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
        />
      </div>

      {/* Patients Table */}
      <div
        data-animate="table"
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Table Header */}
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              All Patients
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Patient directory and information
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white sm:w-64"
              />

              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {[
                  "Patient",
                  "Age / Gender",
                  "Contact",
                  "Condition",
                  "Status",
                  "Registration Date",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading || error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <Loading />
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr data-animate="row">
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No patients found.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    data-animate="row"
                    className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                  >
                    {/* Patient */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-400">
                          {patient.full_name
                            .split(" ")
                            .map((name) => name[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {patient.full_name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {patient.email || "No email provided"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Age / Gender */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {patient.age ?? "—"} years
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {patient.gender || "Not specified"}
                      </p>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {patient.phone || "—"}
                    </td>

                    {/* Condition */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {patient.condition || "Not specified"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          patient.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            patient.status === "Active"
                              ? "bg-emerald-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {patient.status}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(patient.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {!loading && !error && (
          <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {filteredPatients.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {patients.length}
              </span>{" "}
              patients
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  accent: string;
}

function SummaryCard({ title, value, icon, accent }: SummaryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLParagraphElement>(null);
  const [displayedValue, setDisplayedValue] = useState(0);

  // Animated count-up whenever the value changes
  useGSAP(
    () => {
      const counter = { val: displayedValue };

      gsap.to(counter, {
        val: value,
        duration: 1.1,
        ease: "power3.out",
        onUpdate: () => {
          setDisplayedValue(counter.val);
        },
      });
    },
    { dependencies: [value] },
  );

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { y: -6, duration: 0.35, ease: "power3.out" });

    gsap.to(iconRef.current, {
      keyframes: [
        { rotate: -12, scale: 1.18 },
        { rotate: 8, scale: 1.18 },
        { rotate: 0, scale: 1.18 },
      ],
      duration: 0.55,
      ease: "power2.inOut",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { y: 0, duration: 0.35, ease: "power3.out" });
    gsap.to(iconRef.current, {
      rotate: 0,
      scale: 1,
      duration: 0.35,
      ease: "power3.out",
    });
  };

  return (
    <div
      ref={cardRef}
      data-animate="card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>

        <div
          ref={iconRef}
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${accent}`}
        >
          {icon}
        </div>
      </div>

      <p
        ref={numberRef}
        className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
      >
        {Math.round(displayedValue).toLocaleString()}
      </p>
    </div>
  );
}
