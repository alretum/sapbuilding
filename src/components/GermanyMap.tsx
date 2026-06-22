"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { getSocket } from "@/lib/socketClient";
import { NO_DATA_COLOR, readinessColor, regionName } from "@/lib/germany";
import { AnimatedNumber } from "./AnimatedNumber";

type RegionData = { code: string; name: string; avgReadiness: number | null; companies: number; participants: number };
type CityData = { name: string; regionCode: string; lat: number; lng: number; avgReadiness: number; companies: number };
type MapData = { regions: RegionData[]; cities: CityData[]; cityMinCompanies: number };

type Selected =
  | { kind: "region"; data: RegionData }
  | { kind: "city"; data: CityData }
  | null;

const GERMANY_CENTER: [number, number] = [10.45, 51.3];
const GEO_URL = "/germany-states.geojson";

export default function GermanyMap() {
  const [data, setData] = useState<MapData | null>(null);
  const [selected, setSelected] = useState<Selected>(null);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: GERMANY_CENTER,
    zoom: 1,
  });

  const refetch = useCallback(() => {
    fetch("/api/map")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ regions: [], cities: [], cityMinCompanies: 3 }));
  }, []);

  useEffect(() => {
    refetch();
    const socket = getSocket();
    let t: ReturnType<typeof setTimeout>;
    const onDirty = () => {
      clearTimeout(t);
      t = setTimeout(refetch, 500);
    };
    const subscribe = () => socket.emit("companies:subscribe");
    socket.on("companies:dirty", onDirty);
    socket.on("connect", subscribe);
    if (socket.connected) subscribe();
    return () => {
      socket.off("companies:dirty", onDirty);
      socket.off("connect", subscribe);
      clearTimeout(t);
    };
  }, [refetch]);

  const regionByCode = useMemo(() => new Map((data?.regions ?? []).map((r) => [r.code, r])), [data]);
  const showCities = position.zoom >= 2.5;
  const z = position.zoom;

  function reset() {
    setSelected(null);
    setPosition({ coordinates: GERMANY_CENTER, zoom: 1 });
  }

  return (
    <div className="relative overflow-hidden rounded-xl2 border border-white/60 bg-gradient-to-b from-[#eef0fb] to-[#e7fbf4] shadow-card">
      {/* Legend */}
      <div className="absolute left-3 top-3 z-10 rounded-2xl bg-white/85 px-3 py-2 text-[11px] shadow-card backdrop-blur">
        <p className="mb-1 font-bold text-ink/60">Readiness</p>
        <div
          className="h-2 w-32 rounded-full"
          style={{ background: "linear-gradient(90deg,#f4a7a7,#ffce6b,#5fe0c0,#6d5df6)" }}
        />
        <div className="mt-0.5 flex justify-between text-ink/45">
          <span>0%</span>
          <span>100%</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-ink/45">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: NO_DATA_COLOR }} /> no data
        </div>
      </div>

      {/* Reset */}
      {(position.zoom > 1.05 || selected) && (
        <button
          onClick={reset}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold text-ink/70 shadow-card backdrop-blur active:scale-95"
        >
          ⤺ Reset
        </button>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: GERMANY_CENTER, scale: 3200 }}
        width={800}
        height={820}
        className="h-[68vh] w-full"
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={1}
          maxZoom={8}
          onMoveEnd={(p) => setPosition(p)}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const rd = regionByCode.get(geo.properties.id) ?? null;
                const fill = readinessColor(rd?.avgReadiness ?? null);
                const isSel = selected?.kind === "region" && selected.data.code === geo.properties.id;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      const c = geoCentroid(geo) as [number, number];
                      setPosition({ coordinates: c, zoom: 4 });
                      if (rd) setSelected({ kind: "region", data: rd });
                    }}
                    style={{
                      default: { fill, stroke: "#ffffff", strokeWidth: isSel ? 1.4 : 0.6, outline: "none" },
                      hover: { fill, stroke: "#ffffff", strokeWidth: 1.4, outline: "none", cursor: "pointer" },
                      pressed: { fill, outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {showCities &&
            (data?.cities ?? []).map((c) => {
              const r = (5 + Math.min(c.companies, 14) * 0.7) / z;
              const isSel = selected?.kind === "city" && selected.data.name === c.name;
              return (
                <Marker key={`${c.regionCode}-${c.name}`} coordinates={[c.lng, c.lat]}>
                  {/* glow */}
                  <circle r={r * 1.9} fill={readinessColor(c.avgReadiness)} opacity={0.18} />
                  <circle
                    r={r}
                    fill={readinessColor(c.avgReadiness)}
                    stroke="#ffffff"
                    strokeWidth={(isSel ? 2.4 : 1.4) / z}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected({ kind: "city", data: c })}
                  />
                  {z >= 4 && (
                    <text
                      textAnchor="middle"
                      y={-r - 2 / z}
                      style={{ fontSize: 9 / z, fontWeight: 700, fill: "#161a3e", pointerEvents: "none" }}
                    >
                      {c.name}
                    </text>
                  )}
                </Marker>
              );
            })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Selected detail card */}
      {selected && (
        <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-white/90 p-4 shadow-card backdrop-blur">
          <button
            onClick={() => setSelected(null)}
            className="absolute right-3 top-3 text-ink/40"
            aria-label="Close"
          >
            ✕
          </button>
          {selected.kind === "region" ? (
            <RegionCard data={selected.data} />
          ) : (
            <CityCard data={selected.data} />
          )}
        </div>
      )}

      {!showCities && (
        <p className="absolute inset-x-0 bottom-2 z-0 text-center text-[11px] font-semibold text-ink/40">
          Tap a region to zoom in and reveal city readiness
        </p>
      )}
    </div>
  );
}

function RegionCard({ data }: { data: RegionData }) {
  return (
    <div>
      <p className="font-display text-lg font-bold">{data.name}</p>
      {data.avgReadiness === null ? (
        <p className="text-sm text-ink/50">No companies competing here yet.</p>
      ) : (
        <>
          <div className="my-1 flex items-end gap-2">
            <AnimatedNumber value={data.avgReadiness} suffix="%" className="font-display text-3xl font-bold text-brand" />
            <span className="pb-1 text-xs text-ink/50">avg readiness</span>
          </div>
          <p className="text-xs text-ink/50">
            {data.companies} compan{data.companies === 1 ? "y" : "ies"} · {data.participants} participants
          </p>
        </>
      )}
    </div>
  );
}

function CityCard({ data }: { data: CityData }) {
  return (
    <div>
      <p className="font-display text-lg font-bold">{data.name}</p>
      <p className="text-xs text-ink/50">{regionName(data.regionCode)}</p>
      <div className="my-1 flex items-end gap-2">
        <AnimatedNumber value={data.avgReadiness} suffix="%" className="font-display text-3xl font-bold text-brand" />
        <span className="pb-1 text-xs text-ink/50">avg readiness</span>
      </div>
      <p className="text-xs text-ink/50">{data.companies} companies (aggregated for privacy)</p>
    </div>
  );
}
