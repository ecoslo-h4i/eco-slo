"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L, { Icon, map } from "leaflet";
import { supabase } from "@/supabase-client";
import MapPopout from "./MapPopout";
import MapControlPanel from "./MapControlPanel";
import { QueryData } from "@supabase/supabase-js";

type Member = {
  id: number;
  firstname: string;
  lastname: string;
};

type Tree = {
  id: number;
  latitude: number;
  longitude: number;
  member: Member | null;
  species_name?: string | null;
  common_name: string;
  address: string;
  status: string;
  date_planted: string;
  notes: string;
  is_public: boolean;
};

const center: [number, number] = [35.2828, -120.6596];
const zoom = 13;
const MIN_ZOOM = 8;
const MAX_ZOOM = 18;

const treesQuery = supabase.from("trees").select(`
  id,
  ecoslo_num,
  status,
  date_planted,
  species_name,
  common_name,
  address,
  latitude,
  longitude,
  member: tree_keeper_id (
    id,
    firstname,
    lastname
  ),
  is_public,
  notes
`);

type TreeRow = QueryData<typeof treesQuery>[number];

const customIcon = new Icon({
  iconUrl: "/icons/pin.svg",
  iconSize: [48, 70],
  iconAnchor: [24, 70],
});

const selectedIcon = new Icon({
  iconUrl: "/icons/pinactive.svg",
  iconSize: [48, 70],
  iconAnchor: [24, 70],
});

export default function MapClient() {
  const [locations, setLocations] = useState<Tree[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Tree[]>([]);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      const { data, error } = await treesQuery;

      if (error) {
        console.error(error);
        return;
      }

      const normalized: Tree[] = (data ?? []).map((row: TreeRow) => ({
        id: row.id,
        latitude: row.latitude,
        longitude: row.longitude,
        member: Array.isArray(row.member) ? (row.member[0] ?? null) : row.member,
        species_name: row.species_name ?? null,
        common_name: row.common_name,
        address: row.address,
        status: row.status,
        date_planted: row.date_planted,
        notes: row.notes,
        is_public: row.is_public,
      }));

      setLocations(normalized);
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    setFilteredLocations(locations);
  }, [locations]);

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container || mapRef.current) {
      return;
    }

    const map = L.map(container, {
      center,
      zoom,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      zoomControl: false,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    map.on("click", () => {
      setSelectedTree(null);
    });

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) {
      return;
    }

    markersLayerRef.current.clearLayers();

    for (const tree of filteredLocations) {
      const isSelected = selectedTree?.id === tree.id;

      const marker = L.marker([tree.latitude, tree.longitude], {
        icon: isSelected ? selectedIcon : customIcon,
      });

      marker.on("click", () => {
        setSelectedTree(tree);
      });

      marker.addTo(markersLayerRef.current);
    }
  }, [filteredLocations, selectedTree]);

  const zoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const zoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleCenter = () => {
    mapRef.current?.setView(center, zoom);
  };

  return (
    <main className="flex-1 w-full min-h-0">
      <div className="relative w-full h-full">
        <div className="absolute left-30 top-4 w-[450px] h-[130px] bg-white rounded-lg shadow-lg overflow-y-auto z-[999]">
          <MapControlPanel trees={locations} onFilter={setFilteredLocations} onCenter={handleCenter} />
        </div>
        <div ref={mapContainerRef} className="h-full w-full" />

        <div className="absolute top-4 left-10 z-[1000] flex flex-col gap-3">
          <button
            type="button"
            className="grid h-[58px] w-[58px] place-items-center rounded-full bg-[#A8B97C] text-4xl leading-none text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:cursor-pointer"
            onClick={zoomIn}
          >
            +
          </button>
          <button
            onClick={handleCenter}
            className="h-10 px-4 rounded-full bg-[#6F7C58] text-white text-sm font-medium hover:bg-[#5F6B4C]"
          >
            Center Map
          </button>
          <button
            type="button"
            className="grid h-[58px] w-[58px] place-items-center rounded-full bg-[#A8B97C] text-4xl leading-none text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:cursor-pointer"
            onClick={zoomOut}
          >
            -
          </button>
        </div>

        <MapPopout tree={selectedTree} onClose={() => setSelectedTree(null)} />
      </div>
    </main>
  );
}
