import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SF_CENTER = [37.784, -122.405];

export default function MapView({ events, selectedId, savedIds, dense, onEventSelect }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const onEventSelectRef = useRef(onEventSelect);

  useEffect(() => { onEventSelectRef.current = onEventSelect; }, [onEventSelect]);

  useEffect(() => {
    const map = L.map(hostRef.current, {
      center: SF_CENTER,
      zoom: 13,
      zoomControl: false,
      scrollWheelZoom: true,
      maxZoom: 17,
      minZoom: 9,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(hostRef.current);
    mapRef.current = map;
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    for (const event of events) {
      if (!event.position) continue;
      const selected = event.id === selectedId;
      const saved = savedIds.includes(event.id);
      const icon = L.divIcon({
        className: `event-pin ${dense ? 'event-pin--dense' : ''} ${selected ? 'event-pin--selected' : ''} ${saved ? 'event-pin--saved' : ''}`,
        html: '<span class="event-pin__body" aria-hidden="true"><span class="event-pin__core"></span></span>',
        iconSize: dense ? [18, 22] : [28, 34],
        iconAnchor: dense ? [9, 18] : [14, 29],
      });
      const label = `${event.name}, ${event.dateText}, ${event.neighborhood === 'unknown' ? 'location to be announced' : event.neighborhood}. Approximate map position.`;
      const marker = L.marker(event.position, {
        icon,
        title: label,
        keyboard: true,
        zIndexOffset: selected ? 1000 : saved ? 500 : 0,
      }).addTo(map);
      marker.getElement()?.setAttribute('aria-label', label);
      const tooltip = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = event.name;
      const detail = document.createElement('span');
      detail.textContent = `${event.dateText} · ${event.neighborhood}`;
      tooltip.append(name, detail);
      marker.bindTooltip(tooltip, { className: 'event-pin-tooltip', direction: 'top', offset: [0, -20] });
      marker.on('click', () => onEventSelectRef.current(event.id));
      markersRef.current.set(event.id, marker);
    }
  }, [events, selectedId, savedIds, dense]);

  useEffect(() => {
    const selected = events.find((event) => event.id === selectedId);
    if (selected?.position && mapRef.current) {
      const zoom = selected.isOutsideSF ? 11 : Math.max(mapRef.current.getZoom(), 13);
      mapRef.current.flyTo(selected.position, zoom, { duration: 0.65 });
    }
  }, [selectedId]);

  return <div className="map-canvas" ref={hostRef} aria-label="Interactive map with one pin per event at approximate locations" />;
}
