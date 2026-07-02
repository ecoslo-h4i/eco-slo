/** Tree + keeper shape shared by the public map components (MapClient, MapControlPanel, MapPopout). */
export type MapMember = {
  id: number;
  firstname: string;
  lastname: string;
};

export type MapTree = {
  id: number;
  ecoslo_num: number;
  latitude: number;
  longitude: number;
  member: MapMember | null;
  species_name?: string | null;
  common_name: string;
  address: string;
  status: string;
  date_planted: string;
  notes: string;
  is_public: boolean;
};
