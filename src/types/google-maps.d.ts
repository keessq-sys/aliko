/** Minimal ambient declarations for the Google Maps JS API (loaded via script tag). */
declare namespace google {
  namespace maps {
    interface MapOptions {
      center?: { lat: number; lng: number } | any;
      zoom?: number;
      styles?: any[];
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      mapTypeControlOptions?: { style?: any; position?: any };
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      gestureHandling?: string;
      mapId?: string;
    }

    class Map {
      constructor(el: HTMLElement | any, opts?: MapOptions);
      panTo(latLng: { lat: number; lng: number } | any): void;
      setCenter(latLng: { lat: number; lng: number } | any): void;
      setZoom(zoom: number): void;
      addListener(ev: string, handler: (e?: any) => void): void;
    }

    class Marker {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      addListener(ev: string, handler: (e?: any) => void): void;
      setTitle(t: string): void;
    }

    class Size {
      constructor(width: number | string, height: number | string, widthUnit?: string, heightUnit?: string);
      width: number;
      height: number;
    }

    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
    }

    class InfoWindow {
      constructor(opts?: any);
      open(opts?: any): void;
      close(): void;
    }

    namespace MapTypeControlStyle {
      const DROPDOWN_MENU: any;
      const HORIZONTAL_BAR: any;
    }

    namespace ControlPosition {
      const TOP_RIGHT: any;
      const TOP_LEFT: any;
      const BOTTOM_RIGHT: any;
      const BOTTOM_LEFT: any;
    }

    namespace marker {
      class AdvancedMarkerElement {
        constructor(opts?: any);
        setMap(map: Map | null): void;
        addListener(ev: string, handler: (e?: any) => void): void;
      }
    }
  }
}

interface Window {
  google?: typeof google;
}
