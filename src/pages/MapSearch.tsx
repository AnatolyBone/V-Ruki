import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Listing, Location } from '../types/database';
import { MapPin, X, Navigation, Filter, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const MapSearch = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([55.7558, 37.6173]); // Moscow default
  const [isLocating, setIsLocating] = useState(false);

  // Search & Filter
  const [locSearch, setLocSearch] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    const fetchListings = async () => {
      let query = supabase
        .from('listings')
        .select('*, listing_images(*)')
        .eq('status', 'active');
      
      if (selectedCity) {
        query = query.eq('city', selectedCity);
      }

      const { data } = await query.limit(100);
      if (data) setListings(data as Listing[]);
    };
    fetchListings();
  }, [selectedCity]);

  // Fetch locations for dropdown
  useEffect(() => {
    const fetchLocs = async () => {
      if (locSearch.length < 2) {
        setLocations([]);
        return;
      }
      const { data } = await supabase
        .from('locations')
        .select('*')
        .ilike('name', `%${locSearch}%`)
        .limit(5);
      if (data) setLocations(data);
    };
    const timer = setTimeout(fetchLocs, 300);
    return () => clearTimeout(timer);
  }, [locSearch]);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Не удалось определить местоположение. Проверьте разрешения.');
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Sidebar - Listings */}
      <div className="w-full md:w-80 lg:w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-10 shadow-xl transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative mb-4">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Город..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              value={locSearch}
              onChange={(e) => {
                setLocSearch(e.target.value);
                setShowLocDropdown(true);
              }}
              onFocus={() => setShowLocDropdown(true)}
            />
            
            {showLocDropdown && locations.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b last:border-0 dark:border-gray-700"
                    onClick={() => {
                      setSelectedCity(loc.name);
                      setLocSearch(loc.name);
                      setShowLocDropdown(false);
                      if (loc.lat && loc.lng) setUserLocation([Number(loc.lat), Number(loc.lng)]);
                    }}
                  >
                    <div className="font-bold text-gray-900 dark:text-white text-xs">{loc.name}</div>
                    <div className="text-[10px] text-gray-500">{loc.region}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleLocateUser}
              disabled={isLocating}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
              Мой район
            </button>
            {selectedCity && (
              <button 
                onClick={() => {setSelectedCity(''); setLocSearch('');}}
                className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Найдено рядом: {listings.length}</h2>
          {listings.length > 0 ? listings.map((listing) => (
            <div 
              key={listing.id} 
              onClick={() => setSelectedListing(listing)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedListing?.id === listing.id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                : 'border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  {listing.listing_images?.[0] ? (
                    <img src={listing.listing_images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                      📦 Нет фото
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{listing.title}</h3>
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">{listing.price.toLocaleString()} ₽</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {listing.city}
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-gray-400 italic">Пока нет объявлений в этом районе</div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full min-h-[400px]">
        <MapContainer 
          center={userLocation} 
          zoom={13} 
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={userLocation} />
          
          {listings.map((listing) => {
            if (!listing.lat || !listing.lng) return null;
            
            return (
              <Marker 
                key={`marker-${listing.id}`} 
                position={[Number(listing.lat), Number(listing.lng)]}
                icon={selectedListing?.id === listing.id ? selectedIcon : defaultIcon}
                eventHandlers={{
                  click: () => setSelectedListing(listing),
                }}
              >
                <Popup>
                  <div className="min-w-48">
                    <h3 className="font-bold text-sm mb-1">{listing.title}</h3>
                    <p className="text-blue-600 font-black mb-2">{listing.price.toLocaleString()} ₽</p>
                    <Link 
                      to={`/listing/${listing.id}`}
                      className="block text-center bg-blue-600 text-white py-1.5 rounded-lg text-xs font-bold"
                    >
                      Подробнее
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Selected Listing Overlay (Mobile/Desktop Popup) */}
        {selectedListing && (
          <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 z-[1000]">
            <button 
              onClick={() => setSelectedListing(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/10 hover:bg-black/20 rounded-full dark:text-white z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex">
              <div className="w-32 h-32 flex-shrink-0">
                {selectedListing.listing_images?.[0] ? (
                  <img src={selectedListing.listing_images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div className="p-4 flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1">{selectedListing.title}</h3>
                  <p className="text-xl font-black text-blue-600">{selectedListing.price.toLocaleString()} ₽</p>
                </div>
                <Link 
                  to={`/listing/${selectedListing.id}`}
                  className="mt-2 block text-center text-xs font-bold text-white bg-blue-600 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Смотреть детали
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Map UI Elements */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 z-[1000]">
          <button 
            onClick={handleLocateUser}
            className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {isLocating ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : <Navigation className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSearch;
