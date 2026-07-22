'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';
import { CategoryId } from '@/lib/constants/categories';
import { AGUILARES_BOUNDS } from '@/lib/constants/map';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeReports } from '@/hooks/useRealtimeReports';
import { Report } from '@/types/report';
import AuthModal from '../auth/AuthModal';
import FAB from '../layout/FAB';
import ReportDetailDrawer from '../report/ReportDetailDrawer';
import ReportDrawer from '../report/ReportDrawer';
import MapControls from './MapControls';
import ReportMarkers from './ReportMarkers';

const pendingReportStorageKey = 'aguilares:pending-report';
const mapBounds = L.latLngBounds(
  [AGUILARES_BOUNDS.bbox.south, AGUILARES_BOUNDS.bbox.west],
  [AGUILARES_BOUNDS.bbox.north, AGUILARES_BOUNDS.bbox.east]
);

function MapListener({
  onCenterChange,
}: {
  onCenterChange: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    },
  });

  return null;
}

export default function MapViewInner() {
  return <MapContent />;
}

function MapContent() {
  const { user, loading: authLoading } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([]);
  const { reports, isLoading, isConnected } = useRealtimeReports({
    categories: selectedCategories,
    view: 'markers',
    timeframe: 'all',
    bounds: null,
  });

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportDrawerOpen, setIsReportDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingReport, setPendingReport] = useState(() => (
    typeof window !== 'undefined' && window.sessionStorage.getItem(pendingReportStorageKey) === '1'
  ));
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number }>(
    AGUILARES_BOUNDS.center
  );

  const handleCenterChange = useCallback((lat: number, lng: number) => {
    setCurrentCenter({ lat, lng });
  }, []);

  const toggleCategory = useCallback((category: CategoryId) => {
    setSelectedCategories((current) => (
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    ));
  }, []);

  const clearCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  const isCategorySelected = useCallback((category: CategoryId) => {
    return selectedCategories.includes(category);
  }, [selectedCategories]);

  const handleReportSelect = useCallback((report: Report) => {
    setSelectedReport(report);
  }, []);

  const handleCreateReportClick = useCallback(() => {
    if (authLoading) {
      toast.info('Estamos verificando tu sesion. Intenta nuevamente en un momento.');
      return;
    }

    if (!user) {
      window.sessionStorage.setItem(pendingReportStorageKey, '1');
      setPendingReport(true);
      setIsAuthModalOpen(true);
      return;
    }

    setIsReportDrawerOpen(true);
  }, [authLoading, user]);

  useEffect(() => {
    if (!pendingReport || authLoading || !user) return;

    const resumeTimer = window.setTimeout(() => {
      window.sessionStorage.removeItem(pendingReportStorageKey);
      setPendingReport(false);
      setIsAuthModalOpen(false);
      setIsReportDrawerOpen(true);
    }, 0);

    return () => window.clearTimeout(resumeTimer);
  }, [authLoading, pendingReport, user]);

  const allReports = reports as Report[];

  return (
    <div className="w-full h-full relative" style={{ height: '100dvh' }}>
      <MapControls
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        clearCategories={clearCategories}
        isCategorySelected={isCategorySelected}
      />

      <MapContainer
        center={AGUILARES_BOUNDS.center}
        zoom={AGUILARES_BOUNDS.defaultZoom}
        minZoom={AGUILARES_BOUNDS.minZoom}
        maxZoom={AGUILARES_BOUNDS.maxZoom}
        maxBounds={mapBounds}
        maxBoundsViscosity={1}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution="Map data &copy; Google"
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=2"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          className="google-map-tile"
          tileSize={512}
          zoomOffset={-1}
          updateWhenZooming={false}
          updateWhenIdle={true}
          keepBuffer={4}
          maxZoom={AGUILARES_BOUNDS.maxZoom}
          maxNativeZoom={19}
        />

        <MapListener onCenterChange={handleCenterChange} />

        <ReportMarkers
          reports={allReports}
          onSelectReport={handleReportSelect}
        />
      </MapContainer>

      <FAB onClick={handleCreateReportClick} />

      <ReportDetailDrawer
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      <ReportDrawer
        key={isReportDrawerOpen ? `manual-${currentCenter.lat}-${currentCenter.lng}` : 'closed'}
        isOpen={isReportDrawerOpen}
        onClose={() => setIsReportDrawerOpen(false)}
        mapCenter={currentCenter}
        onReportCreated={() => setIsReportDrawerOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          window.sessionStorage.removeItem(pendingReportStorageKey);
          setPendingReport(false);
          setIsAuthModalOpen(false);
        }}
      />

      <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-3 pointer-events-none">
        <div className="pointer-events-none self-start">
          {isLoading ? (
            <div className="glass px-3 py-1.5 flex items-center gap-2 select-none shadow animate-fade-in pointer-events-auto">
              <div className="w-3.5 h-3.5 rounded-full border border-slate-700 border-t-accent animate-spin" />
              <span className="font-jakarta text-[10px] text-muted font-bold tracking-wide uppercase">
                Conectando...
              </span>
            </div>
          ) : isConnected ? (
            <div className="glass px-3 py-1.5 flex items-center gap-2 select-none shadow animate-fade-in pointer-events-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-jakarta text-[10px] text-emerald-400 font-bold tracking-wide uppercase">
                En vivo
              </span>
            </div>
          ) : (
            <div className="glass px-3 py-1.5 flex items-center gap-2 select-none shadow animate-fade-in pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="font-jakarta text-[10px] text-yellow-400 font-bold tracking-wide uppercase">
                Reconectando...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
