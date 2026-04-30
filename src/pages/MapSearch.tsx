import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Listing, Location } from '../types/database';
import { MapPin, X, Navigation, Loader2 } from 'lucide-react';
import { loadYandexMaps } from '../lib/yandexMaps';

const MapSearch = () => {
  const mapRef = useRef<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapsReady, setMapsReady] = useState(false);

  // Search & Filter
  const [locSearch, setLocSearch] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        await loadYandexMaps();
        setMapsReady(true);
      } catch (err) {
        console.error('Yandex Maps init error:', err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('listings')
          .select('*, listing_images(*)')
          .eq('status', 'active');
        
        if (selectedCity) {
          query = query.eq('city', selectedCity);
        }

        const { data, error } = await query.limit(100);
        if (error) throw error;
        if (data) setListings(data as Listing[]);
      } catch (err) {
        console.error('Error fetching listings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [selectedCity]);

  // Locations dropdown search
  useEffect(() => {
    const fetchLocs = async () => {
      if (locSearch.length < 2 || locSearch === selectedCity) {
        setLocations([]);
        return;
      }
      const { data } = await supabase
        .from('locations')
        .select('*')
        .ilike('name', `%${locSearch}%`)
        .limit(5);
      if (data) setLocations(data as Location[]);
    };
    const timer = setTimeout(fetchLocs, 300);
    return () => clearTimeout(timer);
  }, [locSearch, selectedCity]);

  // Map initialization and markers
  useEffect(() => {
    if (!mapsReady) return;

    // @ts-ignore
    const ymaps = window.ymaps;

    if (!mapRef.current) {
      mapRef.current = new ymaps.Map('yandex-map-container', {
        center: [55.7558, 37.6173], // Moscow default
        zoom: 10,
        controls: ['zoomControl']
      });
    }

    const map = mapRef.current;
    map.geoObjects.removeAll();

    const clusterer = new ymaps.Clusterer({
      preset: 'islands#invertedBlueClusterIcons',
      groupByCoordinates: false,
    });

    listings.forEach(listing => {
      const query = `Россия, ${listing.city}, ${listing.address || ''}`;
      ymaps.geocode(query, { results: 1 }).then((res: any) => {
        const firstGeoObject = res.geoObjects.get(0);
        if (firstGeoObject) {
          const coords = firstGeoObject.geometry.getCoordinates();
          const placemark = new ymaps.Placemark(coords, {
            balloonContentHeader: `<div class="font-bold text-gray-900">${listing.title}</div>`,
            balloonContentBody: `
              <div class="text-sm">
                <div class="font-black text-blue-600 mb-1">${listing.price.toLocaleString()} ₽</div>
                <div class="text-gray-500 mb-2">${listing.city}${listing.address ? `, ${listing.address}` : ''}</div>
                <a href="/listing/${listing.id}" class="block text-center bg-blue-600 text-white py-1.5 px-3 rounded-lg font-bold text-xs no-underline">Подробнее</a>
              </div>
            `,
          }, {
            preset: 'islands#blueDotIcon'
          });
          
          placemark.events.add('click', () => setSelectedListing(listing));
          clusterer.add(placemark);
        }
      });
    });

    map.geoObjects.add(clusterer);

    // If city selected, center map
    if (selectedCity) {
      ymaps.geocode(`Россия, ${selectedCity}`, { results: 1 }).then((res: any) => {
        const firstGeoObject = res.geoObjects.get(0);
        if (firstGeoObject) {
          map.setCenter(firstGeoObject.geometry.getCoordinates(), 12, { duration: 1000 });
        }
      });
    }

  }, [mapsReady, listings, selectedCity]);

  const handleLocateUser = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      if (mapRef.current) {
        mapRef.current.setCenter([latitude, longitude], 14, { duration: 1000 });
      }
    });
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
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              <Navigation className="w-3 h-3" />
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
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Объявления рядом: {listings.length}</h2>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : listings.length > 0 ? listings.map((listing) => (
            <div 
              key={listing.id} 
              onClick={() => {
                setSelectedListing(listing);
                // In a real app we might geocode here and center the map
              }}
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
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">📦</div>
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
            <div className="text-center py-10 text-gray-400 italic">Ничего не найдено</div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full min-h-[400px]" id="yandex-map-container">
        {!mapsReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-950 z-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSearch;
