import MapPageClient from "@/components/MapPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tree Map - ECOSLO",
  description: "Tree Map and Management System",
};

export default function Map() {
  return <MapPageClient />;
}
