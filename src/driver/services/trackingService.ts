import type { TrackingPosition } from "../types/delivery";

type PositionHandler = (position: TrackingPosition) => void;
type ErrorHandler = (message: string) => void;

let watchId: number | null = null;

/** Traduz o erro nativo do navigator.geolocation para uma mensagem que a tela pode mostrar. */
function messageFor(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED)
    return "Permissão de localização negada. Ative o GPS/localização para este site nas configurações do celular.";
  if (error.code === error.POSITION_UNAVAILABLE)
    return "Não foi possível obter a localização agora. Verifique se o GPS está ligado.";
  return "A localização demorou demais para responder. Tentando de novo…";
}

export const trackingService = {
  /**
   * Liga o GPS do aparelho (navigator.geolocation.watchPosition) e chama onPosition a cada
   * atualização. Chamar de novo troca o "assinante" sem deixar um watch antigo pendurado.
   */
  start(deliveryId: string, driverId: string, onPosition: PositionHandler, onError?: ErrorHandler) {
    trackingService.stop();
    if (!navigator.geolocation) {
      onError?.("Este aparelho/navegador não tem suporte a geolocalização.");
      return;
    }
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
      (error) => {
        console.warn("GPS:", error);
        onError?.(messageFor(error));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  },
  stop() {
    if (watchId !== null) navigator.geolocation?.clearWatch(watchId);
    watchId = null;
  },
  sendPosition(_position: TrackingPosition) {
    // Future POST /api/deliveries/:id/location
    return Promise.resolve();
  },
};
