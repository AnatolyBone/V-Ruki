import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Camera, Save, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setSuccess(false);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        city: formData.city,
      })
      .eq('id', user.id);

    if (error) {
      alert(error.message);
    } else {
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Настройки профиля</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 bg-gray-100 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User className="w-16 h-16" />
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Пользователь'}</h2>
            <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
            <div className="pt-4 border-t border-gray-100 mt-4 text-left">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Статус аккаунта</div>
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Активен
              </div>
            </div>
          </div>
        </div>

        {/* Form Main */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none cursor-not-allowed"
                    value={user?.email || ''}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+7 (___) ___-__-__"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Сохранить изменения
              </button>
              
              {success && (
                <div className="text-green-600 font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Сохранено!
                </div>
              )}
            </div>
          </form>

          <div className="mt-8 bg-red-50 p-6 rounded-3xl border border-red-100">
            <h3 className="text-red-900 font-bold mb-2">Опасная зона</h3>
            <p className="text-sm text-red-700 mb-4">Удаление аккаунта приведет к потере всех ваших объявлений и сообщений. Это действие необратимо.</p>
            <button className="text-red-600 font-bold text-sm hover:underline">Удалить мой аккаунт</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for check icon
const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default Profile;
