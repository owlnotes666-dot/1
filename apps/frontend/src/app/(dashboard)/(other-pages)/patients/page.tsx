import { Metadata } from "next";

import { OrdersPageClient } from "@/features/orders";

export const metadata: Metadata = {
  title: "Patients",
  description: "Patients",

};

export default function OrdersPage() {
  return <OrdersPageClient />;
}