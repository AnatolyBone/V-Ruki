import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Category } from '../types/database';
import { Camera, MapPin, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
import { DEFAULT_CATEGORIES, POPULAR_CITIES } from '../constants/data';
import { validateListingText, validateImage, preventDoubleClick } from '../utils/clientValidation';
import { logSecurityEvent } from '../utils/logger';

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catLoading, setCatLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    city: 'Москва', // Default city
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchCategories = async () => {
      setCatLoading(true);
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
        if (data && data.length > 0) {
          setCategories(data);
        } else {
          setCategories([]);
          console.warn('Categories table is empty in Supabase');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setCatLoading(false);
      }
    };

    fetchCategories();
  }, [user, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      if (images.length + newFiles.length > 10) {
        alert('Максимум 10 изображений');
        return;
      }

      for (const file of newFiles) {
        const error = validateImage(file);
        if (error) {
          alert(error);
          return;
        }
      }

      setImages([...images, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // 1. UI Debounce Check
    if (!preventDoubleClick('create_listing', 5000)) {
      setError('Пожалуйста, подождите немного перед следующей попыткой.');
      return;
    }

    // 2. Text Validation
    const validationError = validateListingText(formData.title, formData.description);
    if (validationError) {
      setError(validationError);
      return;
    }

    // 2.1 Photo Validation
    if (images.length < 1) {
      setError('Добавьте хотя бы одно фото объявления');
      return;
    }

    setLoading(true);
    setError(null);

    let createdListingId: string | null = null;

    try {
      // 3. Check Account Limits (Max 20 total)
      const { count: totalCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (totalCount !== null && totalCount >= 20) {
        throw new Error('Вы достигли лимита в 20 объявлений на один аккаунт.');
      }

      // 4. Check Daily Limits (Max 3 per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (todayCount !== null && todayCount >= 3) {
        throw new Error('Вы достигли лимита в 3 объявления в день. Попробуйте завтра.');
      }

      // 5. Create Listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category_id: formData.category_id,
          city: formData.city,
          status: 'moderation'
        })
        .select()
        .single();

      if (listingError) throw listingError;
      createdListingId = listing.id;

      // 2. Upload Images
      if (images.length > 0) {
        try {
          for (let i = 0; i < images.length; i++) {
            const file = images[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${listing.id}/${Math.random()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('listings')
              .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('listings')
              .getPublicUrl(fileName);

            const { error: imgInsertError } = await supabase.from('listing_images').insert({
              listing_id: listing.id,
              url: publicUrl,
              is_main: i === 0
            });

            if (imgInsertError) throw imgInsertError;
          }
        } catch (imgErr) {
          // If image logic fails, delete the partially created listing to avoid ghost listings/duplicates
          if (createdListingId) {
            await supabase.from('listings').delete().eq('id', createdListingId).eq('user_id', user.id);
          }
          throw new Error('Не удалось загрузить фото. Объявление не создано, попробуйте ещё раз.');
        }
      }

      navigate('/my-listings');
    } catch (err: any) {
      logSecurityEvent('listing_creation', err.message, user.id);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Новое объявление</h1>
      
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Общая информация</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название объявления*</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Например, iPhone 13 128GB"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Категория*</label>
              <select
                required
                disabled={catLoading || categories.length === 0}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white dark:bg-gray-800 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-900 transition-colors"
                value={formData.category_id}
                onChange={e => setFormData({...formData, category_id: e.target.value})}
              >
                {catLoading ? (
                  <option value="">Загрузка категорий...</option>
                ) : categories.length === 0 ? (
                  <option value="">⚠️ Категории не загружены в БД</option>
                ) : (
                  <>
                    <option value="">Выберите категорию</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </>
                )}
              </select>
              {!catLoading && categories.length === 0 && (
                <p className="mt-1 text-xs text-red-500">Пожалуйста, добавьте категории в таблицу public.categories через Supabase SQL Editor.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)*</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание*</label>
            <textarea
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Опишите ваш товар или услугу..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Город*</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
              >
                {POPULAR_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-8">
<h2 className="text-xl font-semibold text-gray-800">Фотографии*</h2>
<p className="text-sm text-gray-500">
  Добавьте хотя бы одно фото. Первое фото будет на обложке. Максимум 10 штук.
</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] text-center py-1">
                    Главное
                  </div>
                )}
              </div>
            ))}
            
            {previews.length < 10 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-500">
                <Camera className="w-8 h-8" />
                <span className="text-xs font-medium">Добавить фото*</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </div>

        <div className="border-t pt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Публикация...
              </>
            ) : 'Разместить объявление'}
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">
            После публикации объявление отправится на модерацию.
          </p>
        </div>
      </form>
    </div>
  );
};

export default CreateListing;
