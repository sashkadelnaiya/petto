"use client";

import { useEffect, useRef, useState } from "react";
import { loadYandexMaps } from "@/shared/lib/loadYandexMaps";
import styles from "./CreatePostModal.module.css";

type Props = {
  status: "lost" | "found";
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
};

export function CreatePostMapPicker({
  status,
  latitude,
  longitude,
  onPick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<InstanceType<NonNullable<Window["ymaps"]>["Map"]> | null>(null);
  const markerRef = useRef<InstanceType<NonNullable<Window["ymaps"]>["Placemark"]> | null>(null);
  const onPickRef = useRef(onPick);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let cancelled = false;
    const mount = async () => {
      if (!containerRef.current) return;
      const ymaps = await loadYandexMaps();
      if (cancelled || !containerRef.current) return;

      const center: [number, number] = [latitude ?? 55.7558, longitude ?? 37.6173];
      const map = new ymaps.Map(
        containerRef.current,
        { center, zoom: 12 },
        { suppressMapOpenBlock: true },
      );
      mapRef.current = map;

      map.events.add("click", (event: unknown) => {
        const coords = (event as { get: (key: string) => [number, number] }).get("coords");
        onPickRef.current(coords[0], coords[1]);
      });
      setMapReady(true);
    };
    void mount();

    return () => {
      cancelled = true;
      setMapReady(false);
      mapRef.current?.destroy();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    const borderColor = status === "lost" ? "#ffca92" : "#9eb71a";
    const options = {
      preset: "islands#circleDotIcon",
      iconColor: borderColor,
    };

    if (latitude == null || longitude == null) {
      map.geoObjects.removeAll();
      markerRef.current = null;
      return;
    }

    const point: [number, number] = [latitude, longitude];
    const ymaps = window.ymaps as NonNullable<Window["ymaps"]>;
    if (markerRef.current) {
      map.geoObjects.remove(markerRef.current);
      markerRef.current = null;
    }
    markerRef.current = new ymaps.Placemark(point, {}, options);
    map.geoObjects.add(markerRef.current);
    map.setCenter(point);
  }, [latitude, longitude, mapReady, status]);

  return <div ref={containerRef} className={styles.map} />;
}
