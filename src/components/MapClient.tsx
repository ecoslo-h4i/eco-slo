"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { Map as LeafletMap, Icon } from "leaflet";
import { MapContainer, TileLayer, useMap, Marker, useMapEvents } from "react-leaflet";
import { supabase } from "@/supabase-client";

type Location = {
  id: number;
  latitude: number;
  longitude: number;
};

const center: [number, number] = [35.2828, -120.6596];
const zoom = 13;
const Min_Zoom = 8;
const Max_Zoom = 6400;

const customIcon = new Icon({
  iconUrl: "/icons/pin.svg",
  iconSize: [48, 70],
  iconAnchor: [24, 70],
});

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

export default function MapClient() {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    async function fetchLocations() {
      const { data, error } = await supabase.from("trees").select(`
          id,
          ecoslo_num,
          status,
          date_planted,
          species_name,
          common_name,
          address,
          latitude,
          longitude,
          adopter_name,
          is_public,
          notes`);

      if (error) {
        console.error(error);
        return;
      }
      setLocations(data);
    }
    fetchLocations();
  }, []);

  return (
    <main>
      <div className="relative h-screen w-screen">
        <MapContainer
          center={center}
          zoom={zoom}
          minZoom={Min_Zoom}
          maxZoom={Max_Zoom}
          zoomControl={false}
          className="h-full w-full"
        >
          <ZoomButtons />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {locations.map((marker) => (
            <Marker key={marker.id} position={[marker.latitude, marker.longitude]} icon={customIcon}></Marker>
          ))}
        </MapContainer>
      </div>
    </main>
  );
}
