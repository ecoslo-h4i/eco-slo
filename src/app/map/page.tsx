"use client";

import "leaflet/dist/leaflet.css";
import { useRef } from "react";
import { Map as LeafletMap } from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

function ZoomButtons() {
  const map = useMap();
  return (
    <div className="absolute top-4 left-4 z-1000 flex flex-col gap-3">
      <button
        type="button"
        className="grid h-[58px] w-[58px] place-items-center bg-[#A8B97C] rounded-full text-4xl leading-none text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:cursor-pointer"
        onClick={() => map.zoomIn()}
      >
        +
      </button>
      <button
        type="button"
        className="grid h-[58px] w-[58px] place-items-center bg-[#A8B97C] rounded-full text-4xl leading-none text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:cursor-pointer"
        onClick={() => map.zoomOut()}
      >
        -
      </button>
    </div>
  );
}

export default function Map() {
  return (
    <main>
      <div className="relative h-screen w-screen">
        <MapContainer center={[35.2828, -120.6596]} zoom={13} zoomControl={false} className="h-full w-full">
          <ZoomButtons />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer>
      </div>
    </main>
  );
}
