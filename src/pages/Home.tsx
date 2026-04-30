import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Listing, Category } from '../types/database';
import ListingCard from '../components/ListingCard';
import { Search, ChevronRight, MapPin, Map as MapIcon, Sparkles } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../constants/data';

const Home = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [locSearch, setLocSearch] = useState('');

  // --- Categories ---
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: catData, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Categories error:', error);
        setCategories(DEFAULT_CATEGORIES as any);
        return;
      }

      setCategories(catData && catData.length > 0 ? catData : (DEFAULT_CATEGORIES as any));
    };

    fetchInitialData();
  }, []);

  // --- Listings ---
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
        query = query.ilike('city', `%${selectedCity}%`);
      }

      if (searchQuery.trim()) {
        const search = searchQuery.trim();
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) {
        console.error('Listings error:', error);
        setListings([]);
        return;
      }

      setListings((data || []) as Listing[]);
    } catch (err) {
      console.error('Filter error:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchListings, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategoryId, selectedCity]);

  // --- Actions ---
  const handleSearch = () => {
    setSelectedCity(locSearch.trim());
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setLocSearch('');
    setSelectedCategoryId(null);
  };

  return (
    <div className="pb-20">
      {/* Hero */}
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
            
            {/* Text search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Что вы ищете?"
                className="w-full pl-12 pr-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-white dark:bg-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchListings();
                }}
              />
            </div>

            {/* City */}
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
                    setSelectedCity('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />

                <Link
                  to="/map"
                  className="absolute right-2 p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <MapIcon className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors"
            >
              Найти
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12 bg-white dark:bg-gray-950">
        <h2 className="text-2xl font-bold mb-8">Популярные категории</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
              className={`p-6 rounded-3xl ${
                selectedCategoryId === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Near */}
      <section className="bg-gray-100 dark:bg-gray-900/50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">
            {selectedCity ? `Новое рядом: ${selectedCity}` : 'Новое рядом с вами'}
          </h2>

          {selectedCity ? (
            <div className="grid grid-cols-4 gap-6">
              {listings.slice(0, 4).map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Введите город
            </div>
          )}
        </div>
      </section>

      {/* Listings */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">
          {searchQuery || selectedCity ? 'Результаты поиска' : 'Свежие объявления'}
        </h2>

        {loading ? (
          <div>Загрузка...</div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-4 gap-6">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="text-center">
            Ничего не найдено
            <br />
            <button onClick={resetFilters}>Сбросить</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
