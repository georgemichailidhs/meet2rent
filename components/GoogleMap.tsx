'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Navigation,
  Car,
  Train,
  Bus,
  ShoppingCart,
  Coffee,
  Utensils,
  GraduationCap,
  Building2,
  TreePine,
  Heart,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
} from 'lucide-react';

interface PropertyLocation {
  lat: number;
  lng: number;
  title: string;
  address: string;
  city: string;
}

interface NearbyPlace {
  place_id: string;
  name: string;
  vicinity: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  distance?: number;
  geometry: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
}

interface GoogleMapProps {
  location: PropertyLocation;
  zoom?: number;
  height?: string;
  showNearbyPlaces?: boolean;
  showDirections?: boolean;
  className?: string;
}

const NEARBY_PLACE_TYPES = [
  { type: 'subway_station', label: 'Metro', icon: Train, color: 'blue' },
  { type: 'bus_station', label: 'Bus Stop', icon: Bus, color: 'green' },
  { type: 'supermarket', label: 'Supermarket', icon: ShoppingCart, color: 'purple' },
  { type: 'restaurant', label: 'Restaurants', icon: Utensils, color: 'orange' },
  { type: 'cafe', label: 'Cafes', icon: Coffee, color: 'brown' },
  { type: 'hospital', label: 'Hospital', icon: Heart, color: 'red' },
  { type: 'school', label: 'Schools', icon: GraduationCap, color: 'indigo' },
  { type: 'university', label: 'University', icon: Building2, color: 'pink' },
  { type: 'park', label: 'Parks', icon: TreePine, color: 'green' },
];

export default function GoogleMap({
  location,
  zoom = 15,
  height = '400px',
  showNearbyPlaces = true,
  showDirections = true,
  className = '',
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<{ [key: string]: NearbyPlace[] }>({});
  const [activeMarkers, setActiveMarkers] = useState<google.maps.Marker[]>([]);
  const [selectedPlaceType, setSelectedPlaceType] = useState<string | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: 'weekly',
          libraries: ['places', 'geometry'],
        });

        await loader.load();

        if (!mapRef.current) return;

        const mapOptions: google.maps.MapOptions = {
          center: { lat: location.lat, lng: location.lng },
          zoom: zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }],
            },
          ],
        };

        const googleMap = new google.maps.Map(mapRef.current, mapOptions);
        setMap(googleMap);

        // Initialize Places service
        const service = new google.maps.places.PlacesService(googleMap);
        setPlacesService(service);

        // Add property marker
        const propertyMarker = new google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: googleMap,
          title: location.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0ZM16 22C12.69 22 10 19.31 10 16C10 12.69 12.69 10 16 10C19.31 10 22 12.69 22 16C22 19.31 19.31 22 16 22Z" fill="#2563eb"/>
                <circle cx="16" cy="16" r="4" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40),
          },
        });

        // Add property info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${location.title}</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">${location.address}, ${location.city}</p>
            </div>
          `,
        });

        propertyMarker.addListener('click', () => {
          infoWindow.open(googleMap, propertyMarker);
        });

        // Get user's location for directions
        if (navigator.geolocation && showDirections) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            (error) => {
              console.log('Geolocation error:', error);
            }
          );
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setError('Failed to load map. Please check your internet connection.');
        setLoading(false);
      }
    };

    initializeMap();
  }, [location, zoom, showDirections]);

  // Search for nearby places
  const searchNearbyPlaces = (placeType: string) => {
    if (!map || !placesService) return;

    const request: google.maps.places.PlaceSearchRequest = {
      location: { lat: location.lat, lng: location.lng },
      radius: 1000, // 1km radius
      type: placeType as any,
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Clear existing markers
        clearMarkers();

        const places = results.slice(0, 10).map(place => ({
          ...place,
          distance: place.geometry?.location ?
            google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(location.lat, location.lng),
              place.geometry.location
            ) : undefined,
        } as NearbyPlace));

        // Sort by distance
        places.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        setNearbyPlaces(prev => ({ ...prev, [placeType]: places }));
        setSelectedPlaceType(placeType);

        // Add markers for found places
        const markers = places.map(place => {
          if (!place.geometry?.location) return null;

          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12),
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${place.name}</h4>
                <p style="margin: 0; color: #666; font-size: 12px;">${place.vicinity}</p>
                ${place.rating ? `
                  <div style="margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                    <span style="color: #fbbf24;">★</span>
                    <span style="font-size: 12px;">${place.rating} (${place.user_ratings_total || 0})</span>
                  </div>
                ` : ''}
                ${place.distance ? `
                  <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">
                    ${Math.round(place.distance)}m away
                  </p>
                ` : ''}
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          return marker;
        }).filter(Boolean) as google.maps.Marker[];

        setActiveMarkers(markers);
      }
    });
  };

  // Clear all place markers
  const clearMarkers = () => {
    activeMarkers.forEach(marker => marker.setMap(null));
    setActiveMarkers([]);
    setSelectedPlaceType(null);
  };

  // Get directions to property
  const getDirections = () => {
    if (!userLocation) {
      alert('Location access is required for directions. Please enable location services.');
      return;
    }

    const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  // Map controls
  const zoomIn = () => map?.setZoom((map.getZoom() || 15) + 1);
  const zoomOut = () => map?.setZoom((map.getZoom() || 15) - 1);
  const resetView = () => {
    map?.setCenter({ lat: location.lat, lng: location.lng });
    map?.setZoom(zoom);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-red-600 mb-2">Failed to load map</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & Nearby
            </CardTitle>
            <div className="flex items-center gap-2">
              {showDirections && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getDirections}
                  disabled={!userLocation}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Directions
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={resetView}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative p-0">
          <div
            ref={mapRef}
            style={{ height }}
            className="w-full rounded-b-lg"
          />

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              className="bg-white shadow-md"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              className="bg-white shadow-md"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Places */}
      {showNearbyPlaces && (
        <Card>
          <CardHeader>
            <CardTitle>Explore Nearby</CardTitle>
            <p className="text-gray-600 text-sm">
              Discover amenities and services within 1km of the property
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              {NEARBY_PLACE_TYPES.map((placeType) => {
                const Icon = placeType.icon;
                const isActive = selectedPlaceType === placeType.type;

                return (
                  <button
                    key={placeType.type}
                    onClick={() =>
                      isActive
                        ? clearMarkers()
                        : searchNearbyPlaces(placeType.type)
                    }
                    className={`p-3 rounded-lg border transition-colors text-center ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">{placeType.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Places List */}
            {selectedPlaceType && nearbyPlaces[selectedPlaceType] && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">
                  {NEARBY_PLACE_TYPES.find(p => p.type === selectedPlaceType)?.label} Near Property
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {nearbyPlaces[selectedPlaceType].slice(0, 8).map((place, index) => (
                    <div key={place.place_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 truncate">{place.name}</h5>
                        <p className="text-sm text-gray-600 truncate">{place.vicinity}</p>
                        <div className="flex items-center gap-4 mt-1">
                          {place.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm">{place.rating}</span>
                              <span className="text-xs text-gray-500">
                                ({place.user_ratings_total || 0})
                              </span>
                            </div>
                          )}
                          {place.distance && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(place.distance)}m
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
