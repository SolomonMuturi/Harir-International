
'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface ShipmentMapProps {
  origin: [number, number];
  destination: [number, number];
  route: [number, number][];
}

export default function ShipmentMap({ origin, destination, route }: ShipmentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // This effect runs only once on the client after the component mounts
    if (mapContainerRef.current && !mapInstanceRef.current) {
      import('leaflet').then(L => {
        // Create map instance
        const map = L.map(mapContainerRef.current!).setView([39.8283, -98.5795], 4);
        mapInstanceRef.current = map;

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const customIcon = new L.Icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });

        // Add markers
        L.marker(origin, { icon: customIcon }).addTo(map).bindPopup('Origin');
        L.marker(destination, { icon: customIcon }).addTo(map).bindPopup('Destination');

        // Add polyline
        L.polyline(route, { color: 'hsl(var(--primary))' }).addTo(map);

        // Fit map to bounds
        map.fitBounds([origin, destination], { padding: [50, 50] });
      });
    }

    // Cleanup function to run when component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [origin, destination, route]); // Dependencies ensure the map updates if these props change, but the core instance is reused.

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
