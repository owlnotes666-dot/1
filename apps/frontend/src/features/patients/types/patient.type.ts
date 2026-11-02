export interface Patient {
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

export interface CreatePatientPayload {
  full_name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  condition: string | null;
  status: string;
}