import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Category, Listing } from '../types/database';
import { MapPin, AlertCircle, Loader2, Save, ArrowLeft, Camera, X, Trash2 } from 'lucide-react';
import { POPULAR_CITIES } from '../constants/data';
import { validateListingText, preventDoubleClick, validateImage } from '../utils/clientValidation';
import { logSecurityEvent } from '../utils/logger';

const EditListing = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Image states
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    city: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setFetchLoading(true);
      try {
        // 1. Fetch categories
        const { data: catData } = await supabase.from('categories').select('*').order('name');
        if (catData) setCategories(catData);

        // 2. Fetch listing
        const { data: listing, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single();

        if (listingError) throw listingError;
        
        const typedListing = listing as Listing;

        // 3. Security check: ownership
        if (typedListing.user_id !== user.id) {
          logSecurityEvent('edit_attempt_unauthorized', `User ${user.id} tried to edit listing ${id}`, user.id);
          navigate('/my-listings');
          return;
        }

        // 4. Fetch existing images
        const { data: imagesData } = await supabase
          .from('listing_images')
          .select('*')
          .eq('listing_id', id)
          .order('created_at', { ascending: true });

        if (imagesData) setExistingImages(imagesData);

        setFormData({
          title: typedListing.title,
          description: typedListing.description,
          price: String(typedListing.price),
          category_id: typedListing.category_id || '',
          city: typedListing.city,
        });
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Не удалось загрузить данные объявления.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const currentCount = existingImages.length - imagesToDelete.length + newImages.length;
      
      if (currentCount + files.length > 10) {
        alert('Максимум 10 изображений суммарно');
        return;
      }

      for (const file of files) {
        const err = validateImage(file);
        if (err) {
          alert(err);
          return;
        }
      }

      setNewImages([...newImages, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setNewPreviews([...newPreviews, ...previews]);
    }
  };

  const removeExistingImage = (imageId: string) => {
    setImagesToDelete([...imagesToDelete, imageId]);
  };

  const removeNewImage = (index: number) => {
    const images = [...newImages];
    const previews = [...newPreviews];
    
    URL.revokeObjectURL(previews[index]);
    images.splice(index, 1);
    previews.splice(index, 1);
    
    setNewImages(images);
    setNewPreviews(previews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    
    if (!preventDoubleClick('edit_listing', 3000)) {
      setError('Пожалуйста, подождите немного.');
      return;
    }

    const validationError = validateListingText(formData.title, formData.description);
    if (validationError) {
      setError(validationError);
      return;
    }

    const totalImagesAfterSave = (existingImages.length - imagesToDelete.length) + newImages.length;
    if (totalImagesAfterSave < 1) {
      setError('Добавьте хотя бы одно фото объявления');
      return;
    }

    if (totalImagesAfterSave > 10) {
      setError('Максимум 10 фотографий');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Update listing
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          city: formData.city,
          category_id: formData.category_id,
          status: 'moderation',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 2. Delete removed images
      if (imagesToDelete.length > 0) {
        const { error: delError } = await supabase
          .from('listing_images')
          .delete()
          .in('id', imagesToDelete);
        if (delError) throw delError;
      }

      // 3. Upload new images
      if (newImages.length > 0) {
        for (const file of newImages) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${id}/${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('listings')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('listings')
            .getPublicUrl(fileName);

          const { error: imgInsertError } = await supabase
            .from('listing_images')
            .insert({
              listing_id: id,
              user_id: user.id,
              url: publicUrl,
              is_main: false
            });

          if (imgInsertError) throw imgInsertError;
        }
      }

      navigate('/my-listings');
    } catch (err: any) {
      logSecurityEvent('listing_update_error', err.message, user.id);
      setError(err.message);
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-gray-500">Загрузка объявления...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <button 
        onClick={() => navigate('/my-listings')}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        К списку моих объявлений
      </button>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Редактирование объявления</h1>
      
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название*</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория*</label>
              <select
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white"
                value={formData.category_id}
                onChange={e => setFormData({...formData, category_id: e.target.value})}
              >
                <option value="">Выберите категорию</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цена (₽)*</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание*</label>
            <textarea
              required
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Город*</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white appearance-none"
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

        {/* Photo Section */}
        <div className="space-y-4 border-t dark:border-gray-800 pt-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Фотографии</h2>
          <p className="text-sm text-gray-500">Максимум 10 штук суммарно.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Existing Images */}
            {existingImages
              .filter(img => !imagesToDelete.includes(img.id))
              .map((img) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

            {/* New Previews */}
            {newPreviews.map((preview, index) => (
              <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-blue-200">
                <img src={preview} alt="New Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-[10px] text-white text-center py-0.5">Новое</div>
              </div>
            ))}
            
            {/* Add Button */}
            {(existingImages.length - imagesToDelete.length + newImages.length) < 10 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-gray-400 hover:text-blue-500">
                <Camera className="w-8 h-8" />
                <span className="text-xs font-medium">Добавить фото</span>
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

        <div className="border-t dark:border-gray-800 pt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            Сохранить изменения
          </button>
          <p className="text-center text-xs text-gray-500 mt-4">
            После сохранения объявление снова отправится на модерацию.
          </p>
        </div>
      </form>
    </div>
  );
};

export default EditListing;
