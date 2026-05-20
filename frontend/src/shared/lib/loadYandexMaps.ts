declare global {
  interface Window {
    ymaps?: {
      ready: (cb: () => void) => void;
      Map: new (
        container: HTMLElement,
        state: { center: [number, number]; zoom: number },
        options?: Record<string, unknown>,
      ) => {
        destroy: () => void;
        setBounds: (
          bounds: [[number, number], [number, number]],
          options?: Record<string, unknown>,
        ) => void;
        setCenter: (center: [number, number], zoom?: number) => void;
        geoObjects: {
          add: (obj: unknown) => void;
          remove: (obj: unknown) => void;
          removeAll: () => void;
        };
        events: { add: (name: string, cb: (e: unknown) => void) => void };
      };
      Placemark: new (
        geometry: [number, number],
        properties?: Record<string, unknown>,
        options?: Record<string, unknown>,
      ) => {
        geometry: { setCoordinates: (coords: [number, number]) => void };
      events?: { add: (name: string, cb: () => void) => void };
      };
    templateLayoutFactory: { createClass: (html: string) => unknown };
    };
  }
}

let loaderPromise: Promise<NonNullable<Window["ymaps"]>> | null = null;

export function loadYandexMaps(): Promise<NonNullable<Window["ymaps"]>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Yandex Maps can be loaded only in browser"));
  }

  if (window.ymaps) return Promise.resolve(window.ymaps);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-yandex-maps="true"]',
    );
    const onReady = () => {
      if (!window.ymaps) {
        reject(new Error("Yandex Maps did not initialize"));
        return;
      }
      window.ymaps.ready(() => resolve(window.ymaps!));
    };

    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Yandex Maps")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY?.trim();
    const params = new URLSearchParams({ lang: "ru_RU" });
    if (apiKey) params.set("apikey", apiKey);
    script.src = `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.yandexMaps = "true";
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load Yandex Maps")), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return loaderPromise;
}
