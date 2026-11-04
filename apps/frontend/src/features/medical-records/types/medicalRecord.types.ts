export type MedicalRecordStatus = "Pending" | "Reviewed" | "Completed";

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string | null;
  status: MedicalRecordStatus;
  created_at: string;
}

export interface MedicalRecordWithRelations extends MedicalRecord {
  patient: {
    full_name: string;
  } | null;

  doctor: {
    full_name: string;
    specialty: string;
  } | null;
}

export interface CreateMedicalRecordInput {
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string;
}

export interface UpdateMedicalRecordStatusInput {
  id: string;
  status: MedicalRecordStatus;
}

export interface MedicalRecordFilters {
  search?: string;
  status?: MedicalRecordStatus | "All";
  patient_id?: string;
  doctor_id?: string;
}
