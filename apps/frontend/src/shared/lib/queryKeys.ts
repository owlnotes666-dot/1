export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },

  dashboard: {
    stats: ["dashboard", "stats"],
    appointments: ["dashboard", "appointments"],
    todayAppointments: ["dashboard", "todayAppointments"],
    operationsInsights: ["dashboard", "operationsInsights"],
  },

  profile: {
    me: ["profile"] as const,
  },
};
