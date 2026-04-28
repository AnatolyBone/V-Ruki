import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Listing, Category } from '../types/database';
import ListingCard from '../components/ListingCard';
import { Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Get category info
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (catData) setCategory(catData);

      // Get listings for this category
      let query = supabase
        .from('listings')
        .select('*, listing_images(*)')
        .eq('status', 'active');
      
      if (catData) {
        query = query.eq('category_id', catData.id);
      }

      const { data: listData } = await query.order('created_at', { ascending: false });

      if (listData) setListings(listData as Listing[]);
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{category?.name || 'Все объявления'}</h1>
          <p className="text-gray-500">{listings.length} объявлений найдено</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
            <SlidersHorizontal className="w-4 h-4" /> Фильтры
          </button>
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
              Сначала новые <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters (Desktop) */}
        <div className="hidden lg:block space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Цена, ₽
            </h3>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="От" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="w-4 h-[1px] bg-gray-300"></div>
              <input type="number" placeholder="До" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold mb-4">Город</h3>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
              <option>Все города</option>
              <option>Москва</option>
              <option>Санкт-Петербург</option>
              <option>Новосибирск</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-gray-100 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500">В этой категории пока нет объявлений.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
