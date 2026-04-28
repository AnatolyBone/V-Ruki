import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Listing, Category } from '../types/database';
import ListingCard from '../components/ListingCard';
import { Search, ChevronRight, MapPin, Map as MapIcon, Sparkles } from 'lucide-react';
import { DEFAULT_CATEGORIES, POPULAR_CITIES } from '../constants/data';

const Home = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (catData && catData.length > 0) {
        setCategories(catData);
      } else {
        // Fallback to defaults if DB is empty
        setCategories(DEFAULT_CATEGORIES as any);
      }

      // Fetch recent listings
      const { data: listData } = await supabase
        .from('listings')
        .select('*, listing_images(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(8);

      if (listData) setListings(listData as Listing[]);
      setLoading(false);
    };

    fetchData();
  }, []);

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
          
          <div className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Что вы ищете?"
                className="w-full pl-12 pr-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
              />
            </div>
            <div className="md:w-1/3 relative border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700">
              <div className="relative h-full flex items-center">
                <MapPin className="absolute left-3 text-gray-400 w-5 h-5" />
                <select 
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-200 appearance-none bg-white dark:bg-gray-800"
                >
                  <option value="">Все города</option>
                  {POPULAR_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <Link 
                  to="/map"
                  className="absolute right-2 p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Поиск на карте"
                >
                  <MapIcon className="w-5 h-5" />
                </Link>
              </div>
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Категории</h2>
          <button className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline">
            Все категории <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.length > 0 ? categories.map((cat) => (
            <button 
              key={cat.id}
              className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex flex-col items-center gap-3 hover:border-blue-200 dark:hover:border-blue-500 hover:shadow-sm transition-all text-center group"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors text-2xl">
                {cat.icon || '📦'}
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
            </button>
          )) : (
            // Skeleton / Placeholder
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
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
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
              <MapIcon className="w-4 h-4" /> На карте
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.slice(0, 4).map((listing) => (
              <ListingCard key={`near-${listing.id}`} listing={listing} />
            ))}
          </div>
          
          <div className="mt-10 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-200 dark:shadow-none">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl">
                📍
              </div>
              <div>
                <h3 className="text-xl font-bold">Ищите по карте своего района</h3>
                <p className="text-blue-100 opacity-90">Зачем ехать далеко? Самое интересное — за углом.</p>
              </div>
            </div>
            <Link 
              to="/map"
              className="w-full md:w-auto px-8 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-colors text-center"
            >
              Открыть карту
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="container mx-auto px-4 py-12 bg-white dark:bg-gray-950 transition-colors">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Свежие объявления</h2>
          <button className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline">
            Смотреть все <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gray-100 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500">Пока нет активных объявлений. Будьте первыми!</p>
            <Link to="/listings/new" className="mt-4 inline-block text-blue-600 font-bold">
              Подать объявление
            </Link>
          </div>
        )}
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold mb-4">ВРуки — это бесплатно</h2>
            <p className="text-gray-300 text-lg mb-6">
              Никаких скрытых комиссий и ограничений. Размещайте свои предложения на v-ruki.ru и находите покупателей сегодня.
            </p>
            <Link 
              to="/register" 
              className="bg-white text-blue-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors inline-block"
            >
              Начать сейчас
            </Link>
          </div>
          <div className="hidden lg:block w-1/3">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full"></div>
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=400" 
                alt="Safe shopping"
                className="relative rounded-2xl shadow-2xl rotate-3"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
