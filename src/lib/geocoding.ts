/**
 * Geocoding: transforma um endereço em texto ("Rua das Flores, 128") em coordenadas
 * (latitude/longitude). É a base de qualquer coisa de mapa/rota — tudo que vem depois
 * (calcular distância, montar rota, mostrar no mapa do gestor/entregador) trabalha com
 * coordenadas, não com texto. Aqui é só isso: endereço → coordenadas.
 *
 * Mesmo padrão de segurança do bot do WhatsApp (src/lib/whatsappBot.ts): a chave da
 * Google Maps Platform NÃO se configura com prefixo VITE_ e só existe em variável de
 * ambiente do servidor (Vercel) — createServerFn garante que o corpo desta função só
 * roda no servidor, mesmo sendo importada por uma tela. Passo a passo de configuração
 * em docs/GEOLOCALIZACAO.md.
 *
 * "Melhor esforço" de propósito: se a chave não estiver configurada, ou a Google não
 * encontrar o endereço, devolve null em vez de lançar erro — o pedido continua indo
 * pra frente com o endereço em texto (como sempre funcionou), só sem o "bônus" do
 * pino no mapa.
 */
import { createServerFn } from "@tanstack/react-start";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  /** Endereço formatado que a Google entendeu — útil pra conferir se bateu com o digitado. */
  formattedAddress: string;
}

function readApiKey(): string | null {
  return process.env["GOOGLE_MAPS_API_KEY"] || null;
}

/** Diz pra tela se a Geocoding API está configurada, sem expor a chave. */
export const getGeocodingStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: readApiKey() !== null };
});

export interface GeocodeAddressInput {
  address: string;
}

/**
 * Resolve um endereço em texto para lat/long. Nunca lança erro (nem quando a chave
 * falta, nem quando a Google não encontra o endereço) — devolve `null` nesses casos,
 * pra não travar o checkout por causa de um recurso auxiliar.
 */
export const geocodeAddress = createServerFn({ method: "POST" })
  .validator((data: GeocodeAddressInput) => data)
  .handler(async ({ data }): Promise<GeocodeResult | null> => {
    const apiKey = readApiKey();
    const address = data.address.trim();
    if (!apiKey || !address) return null;

    try {
      const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      url.searchParams.set("address", address);
      url.searchParams.set("key", apiKey);
      // Sem viés de região configurado ainda — fica pronto pra adicionar "region=br"
      // ou um "bounds" da cidade da loja quando isso fizer diferença de verdade.

      const res = await fetch(url);
      const json = (await res.json().catch(() => null)) as {
        status?: string;
        results?: {
          formatted_address?: string;
          geometry?: { location?: { lat?: number; lng?: number } };
        }[];
      } | null;

      if (!res.ok || json?.status !== "OK") {
        if (json?.status && json.status !== "ZERO_RESULTS") {
          console.error("Geocoding falhou:", json.status);
        }
        return null;
      }
      const first = json.results?.[0];
      const lat = first?.geometry?.location?.lat;
      const lng = first?.geometry?.location?.lng;
      if (lat == null || lng == null) return null;

      return {
        latitude: lat,
        longitude: lng,
        formattedAddress: first?.formatted_address ?? address,
      };
    } catch (e) {
      console.error("Erro chamando a Geocoding API:", e);
      return null;
    }
  });
