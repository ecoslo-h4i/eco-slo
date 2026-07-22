-- =============================================================================
-- ECOSLO: fix latitude/longitude that were mis-parsed from DMS coordinates
-- =============================================================================
-- Bug: the original workbook's combined "Lat/Long" cell is normally a decimal
-- pair like "(35.3104039, -120.8300631)", but 47 rows instead used
-- degrees/minutes/seconds with cardinal directions, e.g.
--     35°16'31.5"N 120°39'45.1"W
-- The importer pulled the first two numbers it found, so those rows landed in
-- the database as latitude = 35, longitude = 16 (the DEGREES and MINUTES of the
-- latitude) -- placing them off the map entirely.
--
-- Affected: ecoslo_num 501-509 and 1015-1052 (47 trees). Values below are
-- parsed from docs/handoff/tree_planting_log_ORIGINAL.csv as
--     decimal = degrees + minutes/60 + seconds/3600   (negated for S / W)
-- =============================================================================

update public.trees t
set latitude  = v.lat,
    longitude = v.lon
from (values
    (501, 35.2754167, -120.6625278),
    (502, 35.2756389, -120.6621944),
    (503, 35.2758056, -120.6618889),
    (504, 35.2757222, -120.6618333),
    (505, 35.2755833, -120.6620278),
    (506, 35.2755, -120.6621667),
    (507, 35.2754444, -120.6623056),
    (508, 35.2753333, -120.6624167),
    (509, 35.2752222, -120.6626667),
    (1015, 35.0524167, -120.4868889),
    (1016, 35.0524444, -120.4868611),
    (1017, 35.0523889, -120.4869167),
    (1018, 35.0523611, -120.4869722),
    (1019, 35.0522778, -120.4870556),
    (1020, 35.0523333, -120.487),
    (1021, 35.05225, -120.4870833),
    (1022, 35.05225, -120.4871111),
    (1023, 35.0522222, -120.4871111),
    (1024, 35.0521389, -120.48725),
    (1025, 35.0521944, -120.4871667),
    (1026, 35.0521111, -120.4872778),
    (1027, 35.0520278, -120.4873611),
    (1028, 35.0520833, -120.4873333),
    (1029, 35.0520556, -120.4873889),
    (1030, 35.0520278, -120.4874167),
    (1031, 35.052, -120.4874444),
    (1032, 35.0519722, -120.4875),
    (1033, 35.0519722, -120.4874722),
    (1034, 35.0518889, -120.4875556),
    (1035, 35.0519167, -120.4875556),
    (1036, 35.0518611, -120.4876389),
    (1037, 35.0518056, -120.4876944),
    (1038, 35.0517778, -120.48775),
    (1039, 35.05175, -120.4877778),
    (1040, 35.0517222, -120.4878056),
    (1041, 35.0516944, -120.4878889),
    (1042, 35.0516944, -120.4878333),
    (1043, 35.0516111, -120.4879444),
    (1044, 35.0516389, -120.4879167),
    (1045, 35.0515556, -120.488),
    (1046, 35.0515833, -120.4879722),
    (1047, 35.0515278, -120.4880278),
    (1048, 35.0514722, -120.4881389),
    (1049, 35.0514444, -120.4881667),
    (1050, 35.0514167, -120.4880833),
    (1051, 35.0514444, -120.48825),
    (1052, 35.0513611, -120.4881667)
) as v(ecoslo_num, lat, lon)
where t.ecoslo_num = v.ecoslo_num;

-- Verify: no tree may sit outside the San Luis Obispo County bounding box.
do $$
declare v_bad int;
begin
  select count(*) into v_bad
  from public.trees
  where latitude not between 34.5 and 36.5
     or longitude not between -121.5 and -119.5;

  if v_bad <> 0 then
    raise exception 'still % tree(s) with out-of-range coordinates', v_bad;
  end if;
end $$;
