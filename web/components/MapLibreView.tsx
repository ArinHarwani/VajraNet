"use client";

import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Configure MapLibre Web Worker URL for Next.js / Turbopack
if (typeof window !== "undefined") {
  if (typeof maplibregl.setWorkerUrl === "function") {
    maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
  } else if (maplibregl.config) {
    maplibregl.config.WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";
  }
}

export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface MapLibreViewProps {
  bbox?: [number, number, number, number]; // [w, s, e, n]
  center?: [number, number]; // [lon, lat]
  zoom?: number;
  imageUrl?: string | null;
  imageCoordinates?: [[number, number], [number, number], [number, number], [number, number]];
  points?: MapPoint[];
  selectedPointId?: string;
  onPointSelect?: (pointId: string) => void;
  opacity?: number;
  className?: string;
}

const DEFAULT_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapLibreView({
  bbox,
  center = [88.3639, 22.5726],
  zoom = 7.5,
  imageUrl,
  imageCoordinates,
  points = [],
  selectedPointId,
  onPointSelect,
  opacity = 0.85,
  className = "w-full h-full min-h-[420px]",
}: MapLibreViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: DEFAULT_STYLE,
      center: center,
      zoom: zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "VajraNet · Carto · OpenStreetMap",
      }),
      "bottom-right"
    );

    map.on("load", () => {
      setMapLoaded(true);
      if (bbox) {
        map.fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]],
          ],
          { padding: 40, duration: 600 }
        );
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fit bounds when bbox changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !bbox) return;
    map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 40, duration: 800 }
    );
  }, [bbox, mapLoaded]);

  // Update or add Image Overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const sourceId = "storm-radar-source";
    const layerId = "storm-radar-layer";

    if (!imageUrl || !imageCoordinates) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      return;
    }

    const existingSource = map.getSource(sourceId) as maplibregl.ImageSource | undefined;

    if (existingSource) {
      existingSource.updateImage({
        url: imageUrl,
        coordinates: imageCoordinates,
      });
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, "raster-opacity", opacity);
      }
    } else {
      map.addSource(sourceId, {
        type: "image",
        url: imageUrl,
        coordinates: imageCoordinates,
      });

      map.addLayer({
        id: layerId,
        type: "raster",
        source: sourceId,
        paint: {
          "raster-opacity": opacity,
          "raster-fade-duration": 150,
        },
      });
    }
  }, [imageUrl, imageCoordinates, opacity, mapLoaded]);

  // Update Points / Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    points.forEach((pt) => {
      const isSelected = pt.id === selectedPointId;

      const el = document.createElement("div");
      el.className = "group relative cursor-pointer";
      el.innerHTML = `
        <div class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur shadow-lg border transition-all ${
          isSelected
            ? "bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50 scale-110"
            : "bg-slate-900/90 text-slate-200 border-slate-700 hover:border-slate-500"
        }">
          <span class="w-2 h-2 rounded-full ${isSelected ? "bg-amber-300 animate-ping" : "bg-blue-400"}"></span>
          <span>${pt.name.split(" ")[0]}</span>
        </div>
      `;

      el.addEventListener("click", () => {
        if (onPointSelect) onPointSelect(pt.id);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pt.lon, pt.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [points, selectedPointId, onPointSelect, mapLoaded]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-800 ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-xs text-slate-400">
          Loading interactive map...
        </div>
      )}
    </div>
  );
}
