'use client';

import L from 'leaflet';
import { Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { renderToString } from 'react-dom/server';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { TRAFFIC_LIGHT_REPORT_RADIUS_METERS, TrafficLightPoint } from '@/lib/constants/trafficLights';
import { Report } from '@/types/report';

interface TrafficLightMarkersProps {
  points: TrafficLightPoint[];
  reports: Report[];
  onSelect: (point: TrafficLightPoint, hasProblem: boolean) => void;
}

interface MarkerCluster {
  getChildCount: () => number;
}

const okColor = '#16A34A';
const problemColor = '#DC2626';

function createTrafficLightIcon(hasProblem: boolean) {
  const color = hasProblem ? problemColor : okColor;
  const iconHtml = renderToString(
    <CategoryIcon name="TrafficLight" size={14} color="#ffffff" className="shrink-0" />
  );

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 select-none animate-scale-in" style="pointer-events: none;">
        <div class="absolute w-9 h-9 rounded-full opacity-25 animate-ping" style="background-color:${color}; animation-duration:3s;"></div>
        <div class="absolute w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
          style="background-color:${color}; box-shadow:0 0 14px ${color}66, 0 4px 10px rgba(0,0,0,.5);">
          ${iconHtml}
        </div>
        <div class="absolute -bottom-[2px] w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
      </div>
    `,
    className: 'custom-traffic-light-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 36],
  });
}

function createClusterIcon(cluster: MarkerCluster) {
  const count = cluster.getChildCount();

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 select-none animate-scale-in" style="pointer-events:none;">
        <div class="absolute w-8 h-8 rounded-full opacity-20 animate-ping" style="background-color:${okColor};"></div>
        <div class="absolute w-8 h-8 rounded-full border-2 flex items-center justify-center font-outfit font-extrabold text-xs text-white"
          style="background-color:#052e16; border-color:${okColor}; box-shadow:0 0 14px rgba(22,163,74,.45), 0 4px 8px rgba(0,0,0,.6);">
          ${count}
        </div>
      </div>
    `,
    className: 'custom-traffic-light-cluster',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function hasOpenTrafficLightReport(point: TrafficLightPoint, reports: Report[]) {
  return reports.some((report) => (
    report.category === 'SEMAFORO'
    && report.status !== 'RESOLVED'
    && report.status !== 'DISMISSED'
    && distanceMeters(point, report) <= TRAFFIC_LIGHT_REPORT_RADIUS_METERS
  ));
}

function distanceMeters(left: Pick<TrafficLightPoint, 'lat' | 'lng'>, right: Pick<Report, 'lat' | 'lng'>) {
  const earthRadius = 6371000;
  const lat1 = toRadians(left.lat);
  const lat2 = toRadians(right.lat);
  const deltaLat = toRadians(right.lat - left.lat);
  const deltaLng = toRadians(right.lng - left.lng);
  const value = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}

export default function TrafficLightMarkers({ points, reports, onSelect }: TrafficLightMarkersProps) {
  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={35}
      showCoverageOnHover={false}
      spiderfyOnMaxZoom
      disableClusteringAtZoom={17}
      iconCreateFunction={createClusterIcon}
    >
      {points.map((point) => {
        const hasProblem = hasOpenTrafficLightReport(point, reports);

        return (
          <Marker
            key={`traffic-light-${point.id}`}
            position={[point.lat, point.lng]}
            icon={createTrafficLightIcon(hasProblem)}
            eventHandlers={{ click: () => onSelect(point, hasProblem) }}
          />
        );
      })}
    </MarkerClusterGroup>
  );
}
