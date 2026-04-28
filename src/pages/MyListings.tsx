import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Listing } from '../types/database';
import { Edit2, Trash2, Eye, Plus, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';

const MyListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMyListings = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('listings')
      .select('*, listing_images(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
    } else {
      setListings(data as Listing[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchMyListings();
  }, [user, navigate]);

  const handleEdit = (listingId: string) => {
    navigate(`/listings/${listingId}/edit`);
  };

  const handleDelete = async (listingId: string) => {
    if (!user) return;

    const confirmed = window.confirm('Удалить объявление? Это действие нельзя отменить.');
    if (!confirmed) return;

    setDeletingId(listingId);

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('user_id', user.id);

      if (error) throw error;

      setListings((prev) => prev.filter((item) => item.id !== listingId));
    } catch (err: any) {
      console.error('Error deleting listing:', err);
      alert(err?.message || 'Не удалось удалить объявление');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Активно</span>;
      case 'moderation':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> На модерации</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Отклонено</span>;
      case 'archived':
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">Архив</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мои объявления</h1>
          <p className="text-gray-500">Управляйте вашими предложениями на ВРуки</p>
        </div>
        <Link
          to="/listings/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Новое объявление
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold text-gray-700">Объявление</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Статус</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Цена</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Активность</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {listing.listing_images?.[0] ? (
                            <img src={listing.listing_images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Eye className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <Link to={`/listing/${listing.id}`} className="font-bold text-gray-900 hover:text-blue-600 line-clamp-1">
                            {listing.title}
                          </Link>
                          <div className="text-sm text-gray-500">
                            Создано {new Date(listing.created_at).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(listing.status)}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {listing.price.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> 24
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" /> 2
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(listing.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Редактировать"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(listing.id)}
                          disabled={deletingId === listing.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Удалить"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white py-20 px-4 text-center rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Edit2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">У вас пока нет объявлений</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Самое время что-нибудь продать! Нажмите кнопку ниже, чтобы начать.
          </p>
          <Link
            to="/listings/new"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Подать объявление
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyListings;
