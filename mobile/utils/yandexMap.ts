const FALLBACK_TILE_TEMPLATE =
  'https://core-renderer-tiles.maps.yandex.net/tiles?l=map&v=23.04.25-0&x={x}&y={y}&z={z}&scale=1&lang=ru_RU'

export function getYandexTileUrlTemplate() {
  const key = process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY?.trim()
  if (!key) return FALLBACK_TILE_TEMPLATE
  return `${FALLBACK_TILE_TEMPLATE}&apikey=${encodeURIComponent(key)}`
}
