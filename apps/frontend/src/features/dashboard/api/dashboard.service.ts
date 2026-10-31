import type {
  DashboardStats,
  DashboardTarget,
  AppointmentData,
  RevenueData,
  VisitorsData,
  DemographicData,
  RecentOrder,
  TopProduct,
} from "../types";
import { User } from "@/features/users";
import { createClient } from "@/lib/supabase/client";

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const supabase = createClient().schema("medical");

    const { data, error } = await supabase
      .from("patients")
      .select("id")
      .limit(5);

    if (error) {
      console.error("Medical schema connection error:", error);
      throw error;
    }

    console.log("Medical schema connection successful:", data);

    return {
      totalPatients: data.length,
      patientsGrowth: 0,
      appointmentsToday: 0,
      appointmentsGrowth: 0,
      activeDoctors: 0,
      doctorsGrowth: 0,
      pendingReports: 0,
      reportsGrowth: 0,
    };
  },

  async getSales(): Promise<AppointmentData[]> {
    const supabase = createClient();

    const startDate = new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0];

    const endDate = new Date(new Date().getFullYear() + 1, 0, 1)
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .schema("medical")
      .from("appointments")
      .select("appointment_date")
      .gte("appointment_date", startDate)
      .lt("appointment_date", endDate);

    if (error) {
      throw error;
    }

    const months = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(new Date().getFullYear(), index, 1).toLocaleString("en-US", {
        month: "short",
      }),
      appointments: 0,
    }));

    data.forEach((appointment) => {
      const monthIndex = new Date(
        `${appointment.appointment_date}T00:00:00`,
      ).getMonth();

      months[monthIndex].appointments += 1;
    });

    return months.map((item, index) => ({
      id: String(index + 1),
      ...item,
    }));
  },

  async getRevenue(): Promise<RevenueData[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("dashboardrevenue").select("*");

    if (error) {
      throw error;
    }
    return data;
  },

  getTarget: async (): Promise<DashboardTarget> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dashboardtarget")
      .select("*")
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  async getVisitors(): Promise<VisitorsData[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dashboardvisitors")
      .select("*");
    if (error) {
      throw error;
    }
    return data;
  },

  getDemographics: async (): Promise<DemographicData[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dashboarddemographics")
      .select("*");
    if (error) {
      throw error;
    }
    return data;
  },

  async getRecentOrders(): Promise<RecentOrder[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("recentorders").select("*");

    if (error) {
      throw error;
    }
    return data;
  },

  async getTopProducts(): Promise<TopProduct[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("topproducts").select("*");

    if (error) {
      throw error;
    }
    return data;
  },

  async getLatestUsers(): Promise<User[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      throw error;
    }
    return data;
  },
};
