"use client";

import { motion, type Variants } from "framer-motion";
import {
  DoctorIcon,
  FileMedical,
  ScheduleIcon,
  PatientIcon,
} from "@/icons";

import type { DashboardStats } from "../types";

interface Props {
  stats: DashboardStats;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 16,
    },
  },
};

export default function EcommerceMetrics({ stats }: Props) {
  const metrics = [
    {
      title: "Total Patients",
      value: stats.totalPatients ?? 0,
      growth: stats.patientsGrowth ?? 0,
      icon: PatientIcon,
      accent: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
    },
    {
      title: "Appointments Today",
      value: stats.appointmentsToday ?? 0,
      growth: stats.appointmentsGrowth ?? 0,
      icon: ScheduleIcon,
      accent: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    {
      title: "Active Doctors",
      value: stats.activeDoctors ?? 0,
      growth: stats.doctorsGrowth ?? 0,
      icon: DoctorIcon,
      accent: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports ?? 0,
      growth: stats.reportsGrowth ?? 0,
      icon: FileMedical,
      accent: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <motion.div
            key={metric.title}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 md:p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {metric.title}
                </p>

                <h3 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {metric.value.toLocaleString()}
                </h3>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${metric.accent}`}
              >
                <span className="[&_svg]:h-6 [&_svg]:w-6">
                  <Icon />
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
