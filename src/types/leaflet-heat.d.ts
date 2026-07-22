import 'leaflet';

declare module 'leaflet' {
  type HeatLatLngTuple = [number, number, number?];
  type HeatLayerOptions = {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    minOpacity?: number;
    gradient?: Record<number, string>;
  };

  interface HeatLayer extends Layer {
    setOptions(options: HeatLayerOptions): this;
    redraw(): this;
  }

  function heatLayer(
    latlngs: HeatLatLngTuple[],
    options?: HeatLayerOptions
  ): HeatLayer;
}

declare module 'leaflet.heat';
