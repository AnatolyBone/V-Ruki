import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Listing, Category, Location } from '../types/database';
import ListingCard from '../components/ListingCard';
import { Search, ChevronRight, MapPin, Map as MapIcon, Sparkles } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../constants/data';

const Home = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [locSearch, setLocSearch] = useState('');
  const [showLocDropdown, setShowLocDropdown] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (catData && catData.length > 0) {
        setCategories(catData);
      } else {
        setCategories(DEFAULT_CATEGORIES as any);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('listings')
          .select('*, listing_images(*)')
          .eq('status', 'active');

        if (selectedCategoryId) {
          query = query.eq('category_id', selectedCategoryId);
        }

        if (selectedCity) {
          query = query.eq('city', selectedCity);
        }

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(40);

        if (!error && data) {
          setListings(data as Listing[]);
        }
      } catch (err) {
        console.error('Filter error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchListings, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategoryId, selectedCity]);

  // Fetch locations for dropdown
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

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="bg-blue-600 py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Продай или найди — всё в одних руках
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            ВРуки — простая доска объявлений без лишних комиссий и ограничений. 
            Покупайте и продавайте вещи выгодно и быстро.
          </p>
          
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 relative">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Что вы ищете?"
                className="w-full pl-12 pr-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-white dark:bg-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="md:w-1/3 relative border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700">
              <div className="relative h-full flex items-center">
                <MapPin className="absolute left-3 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Город"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-white dark:bg-gray-800"
                  value={locSearch}
                  onChange={(e) => {
                    setLocSearch(e.target.value);
                    if (selectedCity) setSelectedCity('');
                    setShowLocDropdown(true);
                  }}
                  onFocus={() => setShowLocDropdown(true)}
                />
                <Link 
                  to="/map"
                  className="absolute right-2 p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <MapIcon className="w-5 h-5" />
                </Link>
              </div>

              {showLocDropdown && locations.length > 0 && (
                <div className="absolute top-full left-0 z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b last:border-0 dark:border-gray-700"
                      onClick={() => {
                        setSelectedCity(loc.name);
                        setLocSearch(loc.name);
                        setShowLocDropdown(false);
                      }}
                    >
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{loc.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{loc.region}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors">
              Найти
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12 bg-white dark:bg-gray-950 transition-colors">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Популярные категории</h2>
          {categories.length === 0 && !loading && (
            <p className="text-amber-600 text-sm italic">Категории не загружены.</p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categories.length > 0 ? categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
              className={`p-6 rounded-3xl flex flex-col items-center gap-4 transition-all text-center ${
                selectedCategoryId === cat.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 dark:shadow-none scale-105' 
                  : 'bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:bg-white dark:hover:bg-gray-800 shadow-sm'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${
                selectedCategoryId === cat.id ? 'bg-white/20' : 'bg-white dark:bg-gray-800'
              }`}>
                {cat.icon || '📦'}
              </div>
              <span className={`font-black text-sm uppercase tracking-wider ${
                selectedCategoryId === cat.id ? 'text-white' : 'text-gray-900 dark:text-gray-100'
              }`}>{cat.name}</span>
            </button>
          )) : (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl shadow-sm"></div>
            ))
          )}
        </div>
      </section>

      {/* NEW: Near You Block */}
      <section className="bg-gray-100 dark:bg-gray-900/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Новое рядом с вами</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Вещи у соседей, которые можно забрать сегодня</p>
              </div>
            </div>
            <Link to="/map" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
              <MapIcon className="w-4 h-4" /> На карте
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.slice(0, 4).map((listing) => (
              <ListingCard key={`near-${listing.id}`} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="container mx-auto px-4 py-12 bg-white dark:bg-gray-950 transition-colors">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {searchQuery || selectedCity || selectedCategoryId ? 'Результаты поиска' : 'Свежие объявления'}
          </h2>
          <button className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline">
            Смотреть все <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-500">Ничего не найдено по вашему запросу.</p>
            {(searchQuery || selectedCity || selectedCategoryId) && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('');
                  setLocSearch('');
                  setSelectedCategoryId(null);
                }}
                className="mt-4 text-blue-600 font-bold"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
