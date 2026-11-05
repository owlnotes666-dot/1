import type { Profile } from "../types/profile.type";
import { createClient } from "@/lib/supabase/client";

export const profileService = {
  getProfile: async (): Promise<Profile | null> => {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) return null;

    const { data, error } = await supabase
      .schema("medical")
      .from("profile")
      .select("*")
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      firstname: data.first_name,
      lastname: data.last_name,
      email: data.email,
      phone: data.phone ?? "",
      avatar: data.avatar ?? "",
      bio: data.bio ?? "",
      role: data.role,
      country: data.country ?? "",
      city: data.city ?? "",
      postalCode: data.postal_code ?? "",
      facebook: data.facebook ?? "",
      twitter: data.twitter ?? "",
      linkedin: data.linkedin ?? "",
      github: data.github ?? "",
      instagram: data.instagram ?? "",
      createdAt: data.created_at,
      isVerified: data.is_verified ?? false,
      specialty: data.specialty ?? "",
      licenseNumber: data.license_number ?? "",
      experienceYears: data.experience_years,
      hospital: data.hospital ?? "",
    };
  },
};
