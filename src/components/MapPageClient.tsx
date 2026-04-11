"use client";

import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("@/components/MapClient"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export default function MapPageClient() {
  return <MapClient />;
}
