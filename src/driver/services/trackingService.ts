import type { TrackingPosition } from "../types/delivery";

type PositionHandler = (position: TrackingPosition) => void;

let watchId: number | null = null;

export const trackingService = {
  start(deliveryId: string, driverId: string, onPosition: PositionHandler) {
    if (!navigator.geolocation) throw new Error("Geolocalização não disponível neste dispositivo.");
    watchId = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) =>
        onPosition({
          deliveryId,
          driverId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp: new Date(timestamp).toISOString(),
        }),
      (error) => console.warn("GPS:", error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  },
  stop() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
  },
  sendPosition(_position: TrackingPosition) {
    // Future POST /api/deliveries/:id/location
    return Promise.resolve();
  },
};
