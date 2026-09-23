import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hasProblem, isDone, isOpen, type NextStep } from "../constants/delivery";
import { deliveryService } from "../services/deliveryService";
import { driverService } from "../services/driverService";
import { routeService } from "../services/routeService";
import type {
  Delivery,
  DeliveryEvent,
  DeliveryProblemType,
  Driver,
  Route,
} from "../types/delivery";

/*
 * Contexto = um "estado global" que qualquer tela pode ler com useDriver().
 * Antes, tudo isso vivia dentro do App.tsx e era passado na mão.
 */

type SheetMode = "detail" | "problem";

interface DriverState {
  loading: boolean;
  busy: boolean;
  error: string | null;
  dismissError: () => void;
  driver: Driver | null;
  route: Route | null;
  deliveries: Delivery[];
  events: DeliveryEvent[];
  stats: {
    total: number;
    done: number;
    open: number;
    problems: number;
    remainingKm: number;
    remainingMin: number;
  };
  nextDelivery: Delivery | undefined;
  available: boolean;
  routeStarted: boolean;
  routeFinished: boolean;

  selected: Delivery | undefined;
  sheet: SheetMode | null;
  openDelivery: (id: string) => void;
  openProblem: () => void;
  closeSheet: () => void;

  /* Cada ação devolve true se deu certo e false se deu erro (o erro aparece em `error`). */
  toggleAvailability: () => Promise<boolean>;
  startRoute: () => Promise<boolean>;
  finishRoute: () => Promise<boolean>;
  advance: (id: string, step: NextStep) => Promise<boolean>;
  reportProblem: (id: string, type: DeliveryProblemType, description: string) => Promise<boolean>;
}

const DriverContext = createContext<DriverState | undefined>(undefined);

export function DriverProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetMode | null>(null);

  const reload = useCallback(async () => {
    const [d, r, list, ev] = await Promise.all([
      driverService.get(),
      routeService.get(),
      deliveryService.list(),
      deliveryService.events(),
    ]);
    setDriver(d);
    setRoute(r);
    setDeliveries(list);
    setEvents(ev);
  }, []);

  useEffect(() => {
    reload()
      .catch((e) => setError(messageOf(e)))
      .finally(() => setLoading(false));
  }, [reload]);

  /**
   * Envolve cada ação: marca "ocupado", executa e recarrega os dados.
   * Se algo der errado (ex.: sem internet), guarda a mensagem para mostrar na tela
   * e devolve false, em vez de quebrar o app em silêncio.
   */
  const run = useCallback(
    async (task: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      try {
        await task();
        await reload();
        return true;
      } catch (e) {
        setError(messageOf(e));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  const startRoute = useCallback(
    () =>
      run(async () => {
        await routeService.start();
        const first = deliveries.find(isOpen);
        if (first) await deliveryService.start(first.id);
      }),
    [run, deliveries],
  );

  const finishRoute = useCallback(() => run(() => routeService.finish()), [run]);

  const advance = useCallback(
    (id: string, step: NextStep) =>
      run(async () => {
        if (step === "start") await deliveryService.start(id);
        if (step === "arrived") await deliveryService.arrived(id);
        if (step === "complete") await deliveryService.complete(id);
      }),
    [run],
  );

  const reportProblem = useCallback(
    async (id: string, type: DeliveryProblemType, description: string) => {
      const ok = await run(() =>
        deliveryService.reportProblem({ deliveryId: id, type, description }),
      );
      if (ok) setSheet("detail");
      return ok;
    },
    [run],
  );

  const toggleAvailability = useCallback(
    () => run(() => driverService.setAvailability(driver?.status === "OFFLINE")),
    [run, driver],
  );

  const value = useMemo<DriverState>(() => {
    const open = deliveries.filter(isOpen);
    return {
      loading,
      busy,
      error,
      dismissError: () => setError(null),
      driver,
      route,
      deliveries,
      events,
      stats: {
        total: deliveries.length,
        done: deliveries.filter(isDone).length,
        open: open.length,
        problems: deliveries.filter(hasProblem).length,
        remainingKm: open.reduce((sum, d) => sum + (d.distanceKm ?? 0), 0),
        remainingMin: open.reduce((sum, d) => sum + (d.etaMinutes ?? 0), 0),
      },
      nextDelivery: open[0],
      available: driver?.status !== "OFFLINE",
      routeStarted: route?.status === "IN_PROGRESS",
      routeFinished: route?.status === "COMPLETED",

      selected: deliveries.find((d) => d.id === selectedId),
      sheet,
      openDelivery: (id) => {
        setSelectedId(id);
        setSheet("detail");
      },
      openProblem: () => setSheet("problem"),
      closeSheet: () => setSheet(null),

      toggleAvailability,
      startRoute,
      finishRoute,
      advance,
      reportProblem,
    };
  }, [
    loading,
    busy,
    error,
    driver,
    route,
    deliveries,
    events,
    selectedId,
    sheet,
    toggleAvailability,
    startRoute,
    finishRoute,
    advance,
    reportProblem,
  ]);

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

function messageOf(e: unknown) {
  return e instanceof Error ? e.message : "Algo deu errado. Tente novamente.";
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriver precisa estar dentro de <DriverProvider>.");
  return ctx;
}
