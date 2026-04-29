import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Listing, Profile, SupportTicket } from '../types/database';
import { 
  Shield, Check, X, ExternalLink, 
  Users, Package, MessageSquare, BarChart3, 
  Search, Ban, Unlock, Clock, Archive, Save
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Tab = 'overview' | 'moderation' | 'users' | 'listings' | 'support';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    activeListings: 0,
    moderationListings: 0,
    supportTickets: 0
  });
  const [moderationListings, setModerationListings] = useState<Listing[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState<string>('all');

  const canAdmin = ['owner', 'admin', 'moderator'].includes(profile?.role || '');

  useEffect(() => {
    if (canAdmin) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [canAdmin, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [usersCount, listingsCount, activeCount, modCount, ticketsCount] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('listings').select('*', { count: 'exact', head: true }),
          supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'moderation'),
          supabase.from('support_tickets').select('*', { count: 'exact', head: true })
        ]);
        setStats({
          totalUsers: usersCount.count || 0,
          totalListings: listingsCount.count || 0,
          activeListings: activeCount.count || 0,
          moderationListings: modCount.count || 0,
          supportTickets: ticketsCount.count || 0
        });
      } else if (activeTab === 'moderation') {
        const { data } = await supabase
          .from('listings')
          .select('*, profiles!listings_user_id_fkey (*), listing_images (*)')
          .eq('status', 'moderation')
          .order('created_at', { ascending: true });
        if (data) setModerationListings(data as any);
      } else if (activeTab === 'users') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setAllUsers(data);
      } else if (activeTab === 'listings') {
        let query = supabase.from('listings').select('*, profiles!listings_user_id_fkey (*)');
        if (listingStatusFilter !== 'all') {
          query = query.eq('status', listingStatusFilter);
        }
        const { data } = await query.order('created_at', { ascending: false });
        if (data) setAllListings(data as any);
      } else if (activeTab === 'support') {
        const { data } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setTickets(data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateListingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('listings').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  const toggleUserBlock = async (user: Profile) => {
    if (user.role === 'owner') return;
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_blocked: !user.is_blocked,
        blocked_at: !user.is_blocked ? new Date().toISOString() : null,
        blocked_reason: !user.is_blocked ? 'Нарушение правил сервиса' : null
      })
      .eq('id', user.id);
    if (error) alert(error.message);
    else fetchData();
  };

  const updateTicketStatus = async (id: string, status: string, reply?: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, admin_reply: reply })
      .eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  if (!canAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Доступ запрещен</h1>
        <p className="text-gray-500">У вас нет прав для доступа к этому разделу.</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">Вернуться на главную</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Панель управления</h1>
            <p className="text-gray-500 dark:text-gray-400">Роль: {profile?.role}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
        {[
          { id: 'overview', label: 'Обзор', icon: BarChart3 },
          { id: 'moderation', label: 'Модерация', icon: Clock },
          { id: 'users', label: 'Пользователи', icon: Users },
          { id: 'listings', label: 'Объявления', icon: Package },
          { id: 'support', label: 'Поддержка', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' 
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка данных...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {[
                { label: 'Пользователей', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
                { label: 'Всего объявлений', value: stats.totalListings, icon: Package, color: 'bg-purple-500' },
                { label: 'Активных', value: stats.activeListings, icon: Check, color: 'bg-green-500' },
                { label: 'На модерации', value: stats.moderationListings, icon: Clock, color: 'bg-amber-500' },
                { label: 'Поддержка', value: stats.supportTickets, icon: MessageSquare, color: 'bg-red-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'moderation' && (
            moderationListings.length > 0 ? (
              <div className="grid gap-6">
                {moderationListings.map((listing: any) => (
                  <div key={listing.id} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/4">
                      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group">
                        {listing.listing_images?.[0] ? (
                          <img src={listing.listing_images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">Нет фото</div>
                        )}
                        <Link to={`/listing/${listing.id}`} target="_blank" className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-6 h-6" />
                        </Link>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{listing.title}</h3>
                          <div className="text-2xl font-black text-blue-600">{listing.price.toLocaleString()} ₽</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{listing.profiles?.full_name}</div>
                          <div className="text-xs text-gray-500">{listing.profiles?.email}</div>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl italic">"{listing.description}"</p>
                      <div className="flex gap-4 mt-auto">
                        <button onClick={() => updateListingStatus(listing.id, 'active')} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                          <Check className="w-5 h-5" /> Одобрить
                        </button>
                        <button onClick={() => updateListingStatus(listing.id, 'rejected')} className="flex-1 border-2 border-red-600 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                          <X className="w-5 h-5" /> Отклонить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-20 text-center rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Очередь пуста</h2>
                <p className="text-gray-500">Все объявления проверены.</p>
              </div>
            )
          )}

          {activeTab === 'users' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b dark:border-gray-800 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Поиск по email или имени..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                      <th className="px-6 py-4">Пользователь</th>
                      <th className="px-6 py-4">Роль</th>
                      <th className="px-6 py-4">Город</th>
                      <th className="px-6 py-4">Статус</th>
                      <th className="px-6 py-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-800">
                    {allUsers.filter(u => u.email.includes(userSearch) || u.full_name?.includes(userSearch)).map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 dark:text-white">{user.full_name || 'Не указано'}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            user.role === 'owner' ? 'bg-red-100 text-red-700' : 
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.city || '—'}</td>
                        <td className="px-6 py-4">
                          {user.is_blocked ? (
                            <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                              <Ban className="w-3 h-3" /> Заблокирован
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                              <Check className="w-3 h-3" /> Активен
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.role !== 'owner' && (
                            <button 
                              onClick={() => toggleUserBlock(user)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.is_blocked 
                                  ? 'text-green-600 hover:bg-green-50' 
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              {user.is_blocked ? <Unlock className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white">Все объявления</h3>
                <select 
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 outline-none dark:text-white"
                  value={listingStatusFilter}
                  onChange={(e) => setListingStatusFilter(e.target.value)}
                >
                  <option value="all">Все статусы</option>
                  <option value="active">Активные</option>
                  <option value="moderation">Модерация</option>
                  <option value="rejected">Отклоненные</option>
                  <option value="archived">Архив</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                      <th className="px-6 py-4">Товар</th>
                      <th className="px-6 py-4">Продавец</th>
                      <th className="px-6 py-4">Цена</th>
                      <th className="px-6 py-4">Статус</th>
                      <th className="px-6 py-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-800">
                    {allListings.map((listing: any) => (
                      <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/listing/${listing.id}`} target="_blank" className="font-bold text-blue-600 hover:underline">
                            {listing.title}
                          </Link>
                          <div className="text-xs text-gray-400">{new Date(listing.created_at).toLocaleDateString('ru-RU')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{listing.profiles?.full_name}</div>
                        </td>
                        <td className="px-6 py-4 font-black">{listing.price.toLocaleString()} ₽</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            listing.status === 'active' ? 'bg-green-100 text-green-700' :
                            listing.status === 'moderation' ? 'bg-amber-100 text-amber-700' :
                            listing.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => updateListingStatus(listing.id, 'active')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-5 h-5" /></button>
                            <button onClick={() => updateListingStatus(listing.id, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><X className="w-5 h-5" /></button>
                            <button onClick={() => updateListingStatus(listing.id, 'archived')} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><Archive className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="grid gap-6">
              {tickets.length > 0 ? tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase mb-2 inline-block ${
                        ticket.status === 'new' ? 'bg-red-100 text-red-700' : 
                        ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {ticket.status}
                      </span>
                      <h3 className="text-xl font-bold dark:text-white">{ticket.subject}</h3>
                      <p className="text-sm text-gray-400">{ticket.email} · {new Date(ticket.created_at).toLocaleString('ru-RU')}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl italic text-gray-600 dark:text-gray-400 mb-6 border-l-4 border-blue-500">
                    "{ticket.message}"
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Ответ администратора:</label>
                    <textarea 
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Введите ваш ответ..."
                      defaultValue={ticket.admin_reply || ''}
                      id={`reply-${ticket.id}`}
                    />
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          const reply = (document.getElementById(`reply-${ticket.id}`) as HTMLTextAreaElement).value;
                          updateTicketStatus(ticket.id, 'closed', reply);
                        }}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" /> Сохранить и закрыть
                      </button>
                      <button 
                        onClick={() => {
                          const reply = (document.getElementById(`reply-${ticket.id}`) as HTMLTextAreaElement).value;
                          updateTicketStatus(ticket.id, 'in_progress', reply);
                        }}
                        className="flex-1 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        В работу
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="bg-white dark:bg-gray-900 p-20 text-center rounded-3xl border border-gray-100 dark:border-gray-800">
                  <p className="text-gray-500">Обращений в поддержку пока нет.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
