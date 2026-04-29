import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Listing } from '../types/database';
import { Shield, Check, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const canModerate = ['owner', 'admin', 'moderator'].includes(profile?.role || '');

  useEffect(() => {
    if (canModerate) {
      fetchModerationListings();
    } else {
      setLoading(false);
    }
  }, [canModerate]);

  const fetchModerationListings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles!listings_user_id_fkey (*),
        listing_images (*)
      `)
      .eq('status', 'moderation')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching moderation listings:', error);
      alert(error.message);
      setLoading(false);
      return;
    }

    setListings(data as any);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: 'active' | 'rejected') => {
    const { error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating listing status:', error);
      alert(error.message);
      return;
    }

    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  if (!canModerate) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Доступ запрещен</h1>
        <p className="text-gray-500">У вас нет прав для доступа к этому разделу.</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600 text-white rounded-2xl">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Панель модерации</h1>
          <p className="text-gray-500">
            Очередь проверки на сегодня ({listings.length}) · роль: {profile?.role}
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-8 flex items-start gap-4">
        <AlertTriangle className="text-amber-600 w-6 h-6 flex-shrink-0" />
        <div className="text-sm">
          <h3 className="font-bold text-amber-900 mb-1">Политика безопасности:</h3>
          <p className="text-amber-800 leading-relaxed">
            Внимательно проверяйте текст и изображения. Запрещены: любые виды оружия,
            наркотические вещества, финансовые пирамиды, поддельные документы,
            услуги сексуального характера и контент 18+. При обнаружении — отклоняйте объявление.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка очереди...</p>
        </div>
      ) : listings.length > 0 ? (
        <div className="grid gap-6">
          {listings.map((listing: any) => (
            <div
              key={listing.id}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 hover:border-blue-200 transition-colors"
            >
              <div className="md:w-1/4">
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                  {listing.listing_images?.[0] ? (
                    <img
                      src={listing.listing_images[0].url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Нет фото
                    </div>
                  )}
                  <Link
                    to={`/listing/${listing.id}`}
                    target="_blank"
                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-6 h-6" />
                  </Link>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{listing.title}</h3>
                    <div className="text-2xl font-black text-blue-600 mb-2">
                      {listing.price.toLocaleString()} ₽
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-400 uppercase">Автор:</div>
                    <div className="text-sm font-bold text-gray-800">
                      {listing.profiles?.full_name || 'Не указан'}
                    </div>
                    <div className="text-xs text-gray-500">{listing.profiles?.email}</div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-6 line-clamp-3 bg-gray-50 p-4 rounded-xl italic">
                  "{listing.description}"
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <button
                    onClick={() => updateStatus(listing.id, 'active')}
                    className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                  >
                    <Check className="w-5 h-5" /> Одобрить
                  </button>
                  <button
                    onClick={() => updateStatus(listing.id, 'rejected')}
                    className="flex-1 bg-white border-2 border-red-600 text-red-600 py-4 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" /> Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white py-20 text-center rounded-3xl border border-gray-100 shadow-sm">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Очередь пуста</h2>
          <p className="text-gray-500">Все объявления проверены. Хорошая работа!</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
