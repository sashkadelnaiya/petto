import { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

function markerColor(status) {
  return status === 'lost' ? '#ffca92' : '#9eb71a'
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildHtml({ apiKey, center, zoom, markers, selectedPoint, selectable }) {
  const markersData = JSON.stringify(
    markers.map((m) => ({
      id: String(m.id),
      lat: Number(m.lat),
      lon: Number(m.lon),
      color: markerColor(m.status),
      photo: m.photo ? escapeAttr(m.photo) : '',
    }))
  )
  const selectedData = selectedPoint
    ? JSON.stringify({
        lat: Number(selectedPoint.lat),
        lon: Number(selectedPoint.lon),
        color: markerColor(selectedPoint.status),
      })
    : 'null'
  const query = new URLSearchParams({ lang: 'ru_RU' })
  if (apiKey) query.set('apikey', apiKey)

  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
    <style>
      html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #fff; }
      .petto-pin {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        overflow: hidden;
        border: 3px solid;
        background: #fff;
        box-sizing: border-box;
      }
      .petto-pin img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .petto-pin-empty {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .petto-pin-dot {
        width: 12px;
        height: 12px;
        border-radius: 6px;
        background: #0f0b1d;
      }
    </style>
    <script src="https://api-maps.yandex.ru/2.1/?${query.toString()}"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const CENTER = [${Number(center.lat)}, ${Number(center.lon)}];
      const ZOOM = ${Number(zoom)};
      const MARKERS = ${markersData};
      const SELECTED = ${selectedData};
      const SELECTABLE = ${selectable ? 'true' : 'false'};
      ymaps.ready(function () {
        const map = new ymaps.Map('map', { center: CENTER, zoom: ZOOM }, { suppressMapOpenBlock: true });
        const bounds = [];
        MARKERS.forEach((m) => {
          const iconContentLayout = ymaps.templateLayoutFactory.createClass(
            m.photo
              ? '<div class="petto-pin" style="border-color:' + m.color + '"><img src="' + m.photo + '" alt="" /></div>'
              : '<div class="petto-pin petto-pin-empty" style="border-color:' + m.color + ';background:' + m.color + '"><span class="petto-pin-dot"></span></div>'
          );
          const p = new ymaps.Placemark(
            [m.lat, m.lon],
            {},
            {
              iconLayout: 'default#imageWithContent',
              iconImageHref: 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=',
              iconImageSize: [40, 40],
              iconImageOffset: [-20, -20],
              iconContentSize: [40, 40],
              iconContentOffset: [-20, -20],
              iconContentLayout,
            }
          );
          p.events.add('click', function() {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id }));
          });
          map.geoObjects.add(p);
          bounds.push([m.lat, m.lon]);
        });
        if (SELECTED) {
          const selectedPlacemark = new ymaps.Placemark(
            [SELECTED.lat, SELECTED.lon],
            {},
            { preset: 'islands#circleDotIcon', iconColor: SELECTED.color }
          );
          map.geoObjects.add(selectedPlacemark);
          bounds.push([SELECTED.lat, SELECTED.lon]);
        }
        if (bounds.length > 1) {
          map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 32 });
        } else if (bounds.length === 1) {
          map.setCenter(bounds[0], Math.max(12, ZOOM));
        }
        if (SELECTABLE) {
          map.events.add('click', function (e) {
            const coords = e.get('coords');
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapPress', lat: coords[0], lon: coords[1] }));
          });
        }
      });
    </script>
  </body>
</html>`
}

export default function YandexMapView({
  style,
  center,
  zoom = 12,
  markers = [],
  selectedPoint = null,
  selectable = false,
  onMapPress,
  onMarkerPress,
}) {
  const apiKey = process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY || ''
  const html = useMemo(
    () => buildHtml({ apiKey, center, zoom, markers, selectedPoint, selectable }),
    [apiKey, center, zoom, markers, selectedPoint, selectable]
  )

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data)
            if (message?.type === 'mapPress' && onMapPress) {
              onMapPress({ lat: Number(message.lat), lon: Number(message.lon) })
            }
            if (message?.type === 'markerPress' && onMarkerPress) {
              onMarkerPress(String(message.id))
            }
          } catch {}
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: 'hidden',
  },
})
