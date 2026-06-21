"use client";
import "leaflet/dist/leaflet.css";
import { createElement, useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import { createUserLevelClient } from "@/lib/supabase/client";
import MapPopout from "./MapPopout";
import MapControlPanel from "./MapControlPanel";
import { QueryData } from "@supabase/supabase-js";
import { LocateFixed, TreeDeciduous, ZoomIn, ZoomOut } from "lucide-react";

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
const MARKER_SIZE = 44;
const MARKER_ICON_SIZE = 15;
const MARKER_ICON_LEFT = 14.5;
const MARKER_ICON_TOP = 11;
const MARKER_ANCHOR_X = 22;
const MARKER_ANCHOR_Y = 40;

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
  const pin = selected ? "var(--color-light-green-2)" : "var(--color-primary)";
  const outline = selected ? "var(--color-primary)" : "var(--color-primary-active)";
  const white = "var(--color-card)";

  return L.divIcon({
    className: "eco-tree-marker",
    html: renderToStaticMarkup(
      createElement(
        "div",
        {
          style: {
            position: "relative",
            width: `${MARKER_SIZE}px`,
            height: `${MARKER_SIZE}px`,
          },
        },
        createElement(
          "svg",
          {
            fill: "none",
            height: MARKER_SIZE,
            viewBox: "0 0 24 24",
            width: MARKER_SIZE,
            xmlns: "http://www.w3.org/2000/svg",
          },
          createElement("path", {
            d: "M12 22s8-5.4 8-12a8 8 0 1 0-16 0c0 6.6 8 12 8 12Z",
            fill: pin,
            stroke: outline,
            strokeLinejoin: "round",
            strokeWidth: 1.5,
          }),
        ),
        createElement(TreeDeciduous, {
          color: white,
          stroke: white,
          fill: "none",
          size: MARKER_ICON_SIZE,
          strokeWidth: 2.2,
          style: {
            position: "absolute",
            left: `${MARKER_ICON_LEFT}px`,
            top: `${MARKER_ICON_TOP}px`,
          },
        }),
      ),
    ),
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_ANCHOR_X, MARKER_ANCHOR_Y],
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
  // Markers indexed by tree id so selecting one can restyle just two markers
  // instead of rebuilding the whole layer; selectedIdRef tracks which is lit.
  const markersByIdRef = useRef<Map<number, L.Marker>>(new Map());
  const selectedIdRef = useRef<number | null>(null);

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

  // Build the marker layer only when the set of trees changes
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!mapRef.current || !layer) {
      return;
    }

    layer.clearLayers();
    markersByIdRef.current.clear();

    for (const tree of filteredLocations) {
      const marker = L.marker([tree.latitude, tree.longitude], { icon: customIcon });
      marker.on("click", () => setSelectedTree(tree));
      marker.addTo(layer);
      markersByIdRef.current.set(tree.id, marker);
    }

    // The selected tree may still be in the new set (e.g. after a filter
    // change), so re-light its freshly built marker.
    if (selectedIdRef.current !== null) {
      markersByIdRef.current.get(selectedIdRef.current)?.setIcon(selectedIcon);
    }
  }, [filteredLocations]);

  // Selection restyles only the two affected markers so clicks register
  // instantly and are never dropped.
  useEffect(() => {
    const markers = markersByIdRef.current;

    if (selectedIdRef.current !== null) {
      markers.get(selectedIdRef.current)?.setIcon(customIcon);
    }

    const nextId = selectedTree?.id ?? null;
    if (nextId !== null) {
      markers.get(nextId)?.setIcon(selectedIcon);
    }

    selectedIdRef.current = nextId;
  }, [selectedTree]);

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
    <main className="h-full w-full bg-off-white">
      <div className="isolate relative h-full w-full overflow-hidden bg-off-white">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

        <div className="pointer-events-none absolute inset-0 z-10 p-6 max-md:p-4">
          <div className="flex items-start gap-4 max-md:gap-3">
            <div className="pointer-events-auto w-11 shrink-0 overflow-hidden rounded-2xl bg-off-white border border-border shadow-map-control">
              <button
                type="button"
                className="grid h-10 w-full place-items-center text-text transition hover:bg-off-white-3 hover:cursor-pointer"
                onClick={zoomIn}
                aria-label="Zoom in"
              >
                <ZoomIn aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
              <div className="mx-3 h-px bg-border" />
              <button
                onClick={handleCenter}
                className="grid h-10 w-full place-items-center text-text transition hover:bg-off-white-3 hover:cursor-pointer"
                aria-label="Reset map view"
              >
                <LocateFixed aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
              <div className="mx-3 h-px bg-border" />
              <button
                type="button"
                className="grid h-10 w-full place-items-center text-text transition hover:bg-off-white-3 hover:cursor-pointer"
                onClick={zoomOut}
                aria-label="Zoom out"
              >
                <ZoomOut aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
            </div>

            <div className="pointer-events-auto min-w-0 flex-1 rounded-2xl border border-border bg-off-white px-4 py-3 shadow-map-control md:flex-none md:w-fit md:px-5 md:py-4">
              <MapControlPanel trees={locations} onFilter={setFilteredLocations} onCenter={handleCenter} />
            </div>
          </div>
        </div>

        <MapPopout tree={selectedTree} onClose={() => setSelectedTree(null)} />
      </div>
    </main>
  );
}
