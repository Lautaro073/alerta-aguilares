'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { AGUILARES_BOUNDS } from '@/lib/constants/map';

type HeatPoint = {
  lat: number;
  lng: number;
  weight: number;
};

const HEATMAP_BOUNDS = L.latLngBounds(
  [AGUILARES_BOUNDS.bbox.south, AGUILARES_BOUNDS.bbox.west],
  [AGUILARES_BOUNDS.bbox.north, AGUILARES_BOUNDS.bbox.east]
);

function HeatLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap();

  useEffect(() => {
    const heatLayer = L.heatLayer(
      points.map((point) => [point.lat, point.lng, point.weight]),
      {
        radius: 30,
        blur: 18,
        maxZoom: 16,
        minOpacity: 0.18,
        gradient: {
          0.2: '#2563eb',
          0.45: '#22c55e',
          0.65: '#facc15',
          0.82: '#f97316',
          1: '#dc2626',
        },
      }
    ).addTo(map);

    return () => {
      heatLayer.remove();
    };
  }, [map, points]);

  return null;
}

export function AdminHeatMap({ points }: { points: HeatPoint[] }) {
  return (
    <div className="admin-heatmap">
      <MapContainer
        bounds={HEATMAP_BOUNDS}
        maxBounds={HEATMAP_BOUNDS}
        maxBoundsViscosity={1}
        minZoom={14}
        maxZoom={15}
        scrollWheelZoom
        dragging
        zoomControl
        attributionControl={false}
        className="admin-heatmap-map"
      >
        <TileLayer
          attribution="Map data &copy; Google"
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          className="google-map-tile"
        />
        <HeatLayer points={points} />
      </MapContainer>
      <div className="admin-heatmap-legend" aria-hidden="true">
        <span>Baja</span>
        <i />
        <span>Alta</span>
      </div>
    </div>
  );
}
