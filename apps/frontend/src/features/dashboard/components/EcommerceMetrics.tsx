"use client";

import { motion, type Variants } from "framer-motion";
import { DoctorIcon, FileMedical, ScheduleIcon, PatientIcon } from "@/icons";
import type { DashboardStats } from "../types";

interface Props {
  stats: DashboardStats;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
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
    },
    {
      title: "Appointments Today",
      value: stats.appointmentsToday ?? 0,
      growth: stats.appointmentsGrowth ?? 0,
      icon: ScheduleIcon,
    },
    {
      title: "Active Doctors",
      value: stats.activeDoctors ?? 0,
      growth: stats.doctorsGrowth ?? 0,
      icon: DoctorIcon,
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports ?? 0,
      growth: stats.reportsGrowth ?? 0,
      icon: FileMedical,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6"
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
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white">
              <span className="flex items-center justify-center [&_svg]:h-6 [&_svg]:w-6 [&_svg]:fill-current [&_svg]:stroke-current [&_path]:fill-current [&_path]:stroke-current">
                <Icon />
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {metric.title}
                </span>
                <h4 className="text-title-sm mt-2 font-bold text-gray-800 dark:text-white/90">
                  {metric.value.toLocaleString()}
                </h4>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
