"use client";

type Tree = {
  id: number;
  latitude: number;
  longitude: number;
  species_name?: string | null;
  common_name: string;
  address: string;
  status: string;
  date_planted: string;
  is_public: boolean;
};

type MapPopoutProps = {
  tree: Tree | null;
  onClose: () => void;
};

export default function MapPopout({ tree, onClose }: MapPopoutProps) {
  if (!tree) return null;

  return <aside></aside>;
}
