'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Navigation,
  Layers,
  Search,
  Filter,
  Euro,
  Home,
  Star,
  Maximize2,
  Minimize2
} from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface PropertyMapProps {
  properties: Array<{
    id: number;
    title: string;
    price: number;
    location: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    type: string;
    bedrooms: number;
    rating?: number;
    image?: string;
    features: string[];
  }>;
  selectedPropertyId?: number;
  onPropertySelect?: (propertyId: number) => void;
  height?: string;
  showFilters?: boolean;
  className?: string;
}

const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  selectedPropertyId,
  onPropertySelect,
  height = '400px',
  showFilters = true,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [infoWindow, setInfoWindow] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 5000,
    propertyType: 'all',
    bedrooms: 'all'
  });

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      if (!window.google) {
        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => initMap();
        document.head.appendChild(script);
        return;
      }
      initMap();
    };

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      // Default center (Athens, Greece)
      const defaultCenter = { lat: 37.9838, lng: 23.7275 };

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: defaultCenter,
        mapTypeId: mapType,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative'
      });

      setMap(mapInstance);

      // Create info window
      const infoWindowInstance = new window.google.maps.InfoWindow();
      setInfoWindow(infoWindowInstance);
    };

    initializeMap();
  }, [mapType]);

  // Create property markers
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const filteredProperties = properties.filter(property => {
      return (
        property.price >= filters.minPrice &&
        property.price <= filters.maxPrice &&
        (filters.propertyType === 'all' || property.type.toLowerCase() === filters.propertyType) &&
        (filters.bedrooms === 'all' || property.bedrooms.toString() === filters.bedrooms)
      );
    });

    const newMarkers = filteredProperties.map(property => {
      // Custom marker icon based on price range
      const getMarkerIcon = (price: number) => {
        let color = '#3b82f6'; // blue
        if (price > 1500) color = '#dc2626'; // red (expensive)
        else if (price > 1000) color = '#f59e0b'; // amber (moderate)
        else color = '#10b981'; // green (affordable)

        return {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: 'white',
          strokeWeight: 2,
          scale: selectedPropertyId === property.id ? 12 : 8,
        };
      };

      const marker = new window.google.maps.Marker({
        position: property.coordinates,
        map: map,
        title: property.title,
        icon: getMarkerIcon(property.price),
        animation: selectedPropertyId === property.id ? window.google.maps.Animation.BOUNCE : null,
        zIndex: selectedPropertyId === property.id ? 1000 : 1
      });

      // Property info window content
      const createInfoWindowContent = (prop: typeof property) => `
        <div class="p-4 max-w-xs">
          <h3 class="font-semibold text-lg mb-2">${prop.title}</h3>
          <div class="flex items-center text-green-600 font-bold text-xl mb-2">
            <span>€${prop.price}/month</span>
          </div>
          <div class="text-gray-600 text-sm mb-2">
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              ${prop.location}
            </div>
            <div class="mt-1">
              ${prop.bedrooms} bedrooms • ${prop.type}
            </div>
          </div>
          ${prop.rating ? `
            <div class="flex items-center mb-2">
              <span class="text-yellow-400 mr-1">★</span>
              <span class="text-sm">${prop.rating} rating</span>
            </div>
          ` : ''}
          <div class="flex flex-wrap gap-1 mb-3">
            ${prop.features.slice(0, 3).map(feature =>
              `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${feature}</span>`
            ).join('')}
          </div>
          <button
            onclick="window.viewProperty(${prop.id})"
            class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
        </div>
      `;

      marker.addListener('click', () => {
        infoWindow?.setContent(createInfoWindowContent(property));
        infoWindow?.open(map, marker);
        onPropertySelect?.(property.id);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Adjust map bounds to fit all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      map.fitBounds(bounds);

      // Prevent over-zooming for single properties
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 16) map.setZoom(16);
        window.google.maps.event.removeListener(listener);
      });
    }

  }, [map, properties, selectedPropertyId, filters, infoWindow, onPropertySelect]);

  // Global function for property viewing (called from info window)
  useEffect(() => {
    window.viewProperty = (propertyId: number) => {
      window.open(`/property/${propertyId}`, '_blank');
    };

    return () => {
      delete window.viewProperty;
    };
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const centerOnUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          map?.setCenter(userLocation);
          map?.setZoom(15);
        },
        () => {
          console.log('Error: Geolocation service failed.');
        }
      );
    }
  };

  const filteredCount = properties.filter(property => {
    return (
      property.price >= filters.minPrice &&
      property.price <= filters.maxPrice &&
      (filters.propertyType === 'all' || property.type.toLowerCase() === filters.propertyType) &&
      (filters.bedrooms === 'all' || property.bedrooms.toString() === filters.bedrooms)
    );
  }).length;

  return (
    <div className={`relative ${className}`}>
      <Card className={`overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {showFilters && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property Map
                <Badge variant="secondary">{filteredCount} properties</Badge>
              </CardTitle>

              <div className="flex items-center gap-2">
                {/* Map Type Selector */}
                <select
                  value={mapType}
                  onChange={(e) => setMapType(e.target.value as any)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="roadmap">Road</option>
                  <option value="satellite">Satellite</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="terrain">Terrain</option>
                </select>

                {/* User Location */}
                <Button size="sm" variant="outline" onClick={centerOnUserLocation}>
                  <Navigation className="h-4 w-4" />
                </Button>

                {/* Fullscreen */}
                <Button size="sm" variant="outline" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Min Price</label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600">€{filters.minPrice}</div>
              </div>

              <div>
                <label className="text-sm font-medium">Max Price</label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600">€{filters.maxPrice}</div>
              </div>

              <div>
                <label className="text-sm font-medium">Property Type</label>
                <select
                  value={filters.propertyType}
                  onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                  className="w-full text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                  <option value="loft">Loft</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Bedrooms</label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => setFilters(prev => ({ ...prev, bedrooms: e.target.value }))}
                  className="w-full text-sm border rounded px-2 py-1"
                >
                  <option value="all">Any</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4+ Bedrooms</option>
                </select>
              </div>
            </div>
          </CardHeader>
        )}

        <CardContent className="p-0">
          <div
            ref={mapRef}
            style={{ height: isFullscreen ? 'calc(100vh - 120px)' : height }}
            className="w-full bg-gray-200 flex items-center justify-center"
          >
            <div className="text-center text-gray-600">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <div>Loading map...</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10">
        <div className="text-sm font-medium mb-2">Price Range</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">€0 - €1000</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs">€1000 - €1500</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">€1500+</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMap;
