/**
 * Map Background Layer
 * Pure 100% Free OpenStreetMap (OSM) Tile Layer via react-native-webview.
 * Zero API keys required - No watermarks, no rate limits.
 * Features:
 * - Free official OpenStreetMap tile server (tile.openstreetmap.org)
 * - Intelligent Dark Mode CSS inversion filter (sleek charcoal night map)
 * - Geolocation pin: Glowing pulse dot ("📍 You Are Here")
 * - Dynamic place pins for search results (lat, lng, place name, rating)
 * - Auto camera framing (fitBounds & flyTo)
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/context/themeContext';
import { useHome } from '@/context/homeContext';
import { PlaceSearchResult } from '@/domain/models/search';
import { SAMPLE_PLACES } from '@/data/sampleDatasets';

export const MapBackground: React.FC = () => {
  const { isDark } = useTheme();
  const { userLocation, searchResults, selectedPlaceId, setSelectedPlaceId } = useHome();
  const webViewRef = useRef<WebView>(null);

  // Helper to extract coordinates from search results or fallback dataset lookup
  const getMarkerCoordinates = (place: PlaceSearchResult): { lat: number; lng: number } | null => {
    if (typeof place.lat === 'number' && typeof place.lng === 'number' && place.lat !== 0 && place.lng !== 0) {
      return { lat: place.lat, lng: place.lng };
    }

    const fallbackMatch = SAMPLE_PLACES.find(
      (sp) => sp.name.toLowerCase() === place.name.toLowerCase() || place.name.toLowerCase().includes(sp.name.toLowerCase())
    );
    if (fallbackMatch && fallbackMatch.lat && fallbackMatch.lng) {
      return { lat: fallbackMatch.lat, lng: fallbackMatch.lng };
    }

    return null;
  };

  const placePins = searchResults
    .map((place) => {
      const coords = getMarkerCoordinates(place);
      return coords ? { place, coords } : null;
    })
    .filter((item): item is { place: PlaceSearchResult; coords: { lat: number; lng: number } } => item !== null);

  // Prepare map data payload for webview injection
  const mapData = {
    isDark,
    userLocation,
    pins: placePins.map((p) => ({
      id: p.place.id,
      name: p.place.name,
      category: p.place.category || p.place.city || 'Destination',
      rating: p.place.rating || p.place.feedback?.averageRating || null,
      lat: p.coords.lat,
      lng: p.coords.lng,
    })),
    selectedPlaceId,
  };

  // Inject updated marker data into Leaflet WebView whenever state updates
  useEffect(() => {
    if (!webViewRef.current) return;
    const jsCode = `if (window.updateGhumoMap) { window.updateGhumoMap(${JSON.stringify(mapData)}); } true;`;
    webViewRef.current.injectJavaScript(jsCode);
  }, [userLocation, searchResults, isDark, selectedPlaceId]);

  const initialLat = userLocation?.latitude || 28.6139;
  const initialLng = userLocation?.longitude || 77.2090;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: ${isDark ? '#191816' : '#F6F1E9'};
    }
    .leaflet-control-container .leaflet-routing-container-hide {
      display: none !important;
    }
    .leaflet-control-attribution {
      font-size: 9px !important;
      opacity: 0.6;
      background: rgba(0,0,0,0.4) !important;
      color: #fff !important;
    }

    /* 100% Free OpenStreetMap Dark Mode Styling (Zero API Key, No Watermark) */
    .dark-mode .leaflet-tile {
      filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(92%);
    }

    .user-pulse-marker {
      width: 24px;
      height: 24px;
      background: rgba(217, 83, 56, 0.35);
      border: 2px solid #D95338;
      border-radius: 50%;
      box-shadow: 0 0 14px rgba(217, 83, 56, 0.85);
      position: relative;
    }
    .user-pulse-dot {
      width: 10px;
      height: 10px;
      background: #D95338;
      border-radius: 50%;
      position: absolute;
      top: 5px;
      left: 5px;
      border: 1px solid #FFFFFF;
    }
    .place-pin-marker {
      background: #D95338;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      border: 1.5px solid rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .custom-popup .leaflet-popup-content-wrapper {
      background: ${isDark ? '#2B2825' : '#FFFFFF'};
      color: ${isDark ? '#FFF' : '#111'};
      border-radius: 12px;
      padding: 4px 8px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.3);
    }
    .custom-popup .leaflet-popup-tip {
      background: ${isDark ? '#2B2825' : '#FFFFFF'};
    }
  </style>
</head>
<body class="${isDark ? 'dark-mode' : ''}">
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([${initialLat}, ${initialLng}], 14);

    // Official OpenStreetMap (OSM) Tile Server - 100% Free, No Watermark, No API Key
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var userMarker = null;
    var placeMarkers = [];

    window.updateGhumoMap = function(data) {
      if (!data) return;

      if (data.isDark) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }

      // User location marker
      if (data.userLocation) {
        var uLat = data.userLocation.latitude;
        var uLng = data.userLocation.longitude;
        var userIcon = L.divIcon({
          className: '',
          html: '<div class="user-pulse-marker"><div class="user-pulse-dot"></div></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        if (userMarker) {
          userMarker.setLatLng([uLat, uLng]);
        } else {
          userMarker = L.marker([uLat, uLng], { icon: userIcon })
            .addTo(map)
            .bindPopup('<b style="color:#D95338;">📍 You Are Here</b><br><span style="font-size:11px;">Current Geolocation</span>', { className: 'custom-popup' });
        }
      }

      // Clear old place markers
      placeMarkers.forEach(function(m) { map.removeLayer(m); });
      placeMarkers = [];

      var boundsPoints = [];
      if (data.userLocation) {
        boundsPoints.push([data.userLocation.latitude, data.userLocation.longitude]);
      }

      var selectedMarker = null;

      if (data.pins && data.pins.length > 0) {
        data.pins.forEach(function(pin) {
          boundsPoints.push([pin.lat, pin.lng]);
          var isSelected = data.selectedPlaceId === pin.id;
          var pinIcon = L.divIcon({
            className: '',
            html: '<div class="place-pin-marker' + (isSelected ? ' selected-pin' : '') + '">📍 ' + pin.name + '</div>',
            iconSize: [null, 24],
            iconAnchor: [30, 12]
          });

          var popupContent = '<b>📍 ' + pin.name + '</b><br><span style="font-size:11px;color:#D95338;">' + pin.category + '</span>';
          if (pin.rating) {
            popupContent += '<br><span style="font-size:11px;font-weight:bold;">★ ' + pin.rating + ' / 5</span>';
          }

          var marker = L.marker([pin.lat, pin.lng], { icon: pinIcon })
            .addTo(map)
            .bindPopup(popupContent, { className: 'custom-popup' });

          if (isSelected) {
            selectedMarker = marker;
          }

          placeMarkers.push(marker);
        });
      }

      // Camera centering & zoom behavior:
      // 1. If a place on the carousel is clicked/selected -> smoothly pan and zoom in to zoom level 16
      // 2. If cross clicked (selectedPlaceId is null) -> smoothly pan and zoom back to user's current location
      if (data.selectedPlaceId && data.pins && data.pins.length > 0) {
        var activePin = data.pins.find(function(p) { return p.id === data.selectedPlaceId; });
        if (activePin) {
          map.setView([activePin.lat, activePin.lng], 16, { animate: true });
          if (selectedMarker) {
            selectedMarker.openPopup();
          }
        }
      } else if (data.userLocation) {
        map.setView([data.userLocation.latitude, data.userLocation.longitude], 15, { animate: true });
        if (userMarker) {
          userMarker.openPopup();
        }
      } else if (boundsPoints.length > 1) {
        map.fitBounds(boundsPoints, { padding: [50, 50], maxZoom: 15 });
      } else if (boundsPoints.length === 1) {
        map.setView(boundsPoints[0], 14, { animate: true });
      }
    };

    // Initial trigger
    window.updateGhumoMap(${JSON.stringify(mapData)});
  </script>
</body>
</html>
  `;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="auto">
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={StyleSheet.absoluteFill}
        scrollEnabled={false}
        overScrollMode="never"
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 0,
  },
});
