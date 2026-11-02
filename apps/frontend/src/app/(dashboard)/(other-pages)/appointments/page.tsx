import { Metadata } from "next";

import PageBreadcrumb from "@/shared/components/ui/common/PageBreadCrumb";
import Calendar from "./components/Calendar";


export const metadata: Metadata = {
  title: "Appointments | Medical Dashboard",
  description:
    "Appointments",
  // other metadata
};
export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Appointments" />
      <Calendar />
    </div>
  );
}
