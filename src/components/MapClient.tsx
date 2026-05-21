"use client";
import "leaflet/dist/leaflet.css";
import { createElement, useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import { createUserLevelClient } from "@/lib/supabase/client";
import MapPopout from "./MapPopout";
import MapControlPanel from "./MapControlPanel";
import { QueryData } from "@supabase/supabase-js";
import { LocateFixed, MapPin, TreeDeciduous, ZoomIn, ZoomOut } from "lucide-react";

const supabase = createUserLevelClient();

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

const treesQuery = supabase.from("public_trees").select(`
  id,
  ecoslo_num,
  status,
  date_planted,
  species_name,
  common_name,
  address,
  latitude,
  longitude,
  tree_keeper_id,
  tree_keeper_firstname,
  tree_keeper_lastname,
  is_public,
  notes
`);

type TreeRow = QueryData<typeof treesQuery>[number];

function createTreeMarkerIcon(selected: boolean) {
  const pin = "var(--color-primary)";
  const white = "var(--color-card)";
  const black = "var(--color-text)";
  const ring = selected
    ? `0 0 0 4px ${white}, 0 5px 14px color-mix(in srgb, ${black} 28%, transparent)`
    : `0 2px 6px color-mix(in srgb, ${black} 18%, transparent)`;

  return L.divIcon({
    className: "eco-tree-marker",
    html: renderToStaticMarkup(
      createElement(
        "div",
        {
          style: {
            position: "relative",
            width: "44px",
            height: "44px",
            filter: `drop-shadow(0 2px 4px color-mix(in srgb, ${black} 18%, transparent))`,
          },
        },
        createElement(MapPin, {
          color: pin,
          fill: pin,
          size: 44,
          strokeWidth: 2.25,
          style: { boxShadow: ring, borderRadius: selected ? "999px" : undefined },
        }),
        createElement(TreeDeciduous, {
          color: white,
          size: 15,
          strokeWidth: 2.2,
          style: {
            position: "absolute",
            left: "14.5px",
            top: "11px",
          },
        }),
      ),
    ),
    iconSize: [44, 44],
    iconAnchor: [22, 40],
  });
}

const customIcon = createTreeMarkerIcon(false);
const selectedIcon = createTreeMarkerIcon(true);

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
        member:
          row.tree_keeper_id !== null && row.tree_keeper_firstname !== null && row.tree_keeper_lastname !== null
            ? {
                id: row.tree_keeper_id,
                firstname: row.tree_keeper_firstname,
                lastname: row.tree_keeper_lastname,
              }
            : null,
        species_name: row.species_name ?? null,
        common_name: row.common_name,
        address: row.address,
        status: row.status,
        date_planted: row.date_planted,
        notes: row.notes,
        is_public: row.is_public,
      }));

      setLocations(normalized);
      setFilteredLocations(normalized);
    }
    fetchLocations();
  }, []);

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
    <main className="flex-1 w-full min-h-screen bg-off-white">
      <div className="relative h-screen w-full overflow-hidden bg-off-white">
        <div className="absolute left-[88px] top-6 z-[999] w-[450px] rounded-[16px] bg-card px-[18px] py-[17px] shadow-map-control max-md:left-[78px] max-md:right-4 max-md:w-auto">
          <MapControlPanel trees={locations} onFilter={setFilteredLocations} onCenter={handleCenter} />
        </div>
        <div ref={mapContainerRef} className="h-full w-full" />

        <div className="absolute left-5 top-6 z-[1000] flex items-start">
          <div className="w-11 overflow-hidden rounded-[18px] bg-card shadow-map-control">
            <button
              type="button"
              className="grid h-10 w-full place-items-center text-text transition hover:bg-off-white hover:cursor-pointer"
              onClick={zoomIn}
              aria-label="Zoom in"
            >
              <ZoomIn aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={2} />
            </button>
            <div className="mx-3 h-px bg-border" />
            <button
              onClick={handleCenter}
              className="grid h-10 w-full place-items-center text-text transition hover:bg-off-white hover:cursor-pointer"
              aria-label="Reset map view"
            >
              <LocateFixed aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={2} />
            </button>
            <div className="mx-3 h-px bg-border" />
            <button
              type="button"
              className="grid h-10 w-full place-items-center text-text transition hover:bg-off-white hover:cursor-pointer"
              onClick={zoomOut}
              aria-label="Zoom out"
            >
              <ZoomOut aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={2} />
            </button>
          </div>
        </div>
        <MapPopout tree={selectedTree} onClose={() => setSelectedTree(null)} />
      </div>
    </main>
  );
}
