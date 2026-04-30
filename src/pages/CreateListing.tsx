import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Category } from '../types/database';
import { Camera, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { validateListingText, validateImage, preventDoubleClick } from '../utils/clientValidation';
import { logSecurityEvent } from '../utils/logger';

const DRAFT_KEY = 'vruki_create_listing_draft';

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catLoading, setCatLoading] = useState(true);

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      title: '',
      description: '',
      price: '',
      category_id: '',
      city: '',
      region: '',
      address: '',
    };
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchCategories = async () => {
      setCatLoading(true);
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategories(data);
      setCatLoading(false);
    };

    fetchCategories();
  }, [user, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

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
    setPreviews([...previews, ...newFiles.map(file => URL.createObjectURL(file))]);
  };

  const removeImage = (index: number) => {
    const newImgs = [...images];
    newImgs.splice(index, 1);
    setImages(newImgs);

    const newPrev = [...previews];
    URL.revokeObjectURL(newPrev[index]);
    newPrev.splice(index, 1);
    setPreviews(newPrev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!preventDoubleClick('create_listing', 5000)) {
      setError('Подождите перед повторной попыткой');
      return;
    }

    const textError = validateListingText(formData.title, formData.description);
    if (textError) {
      setError(textError);
      return;
    }

    if (!formData.city.trim()) {
      setError('Укажите город');
      return;
    }

    if (images.length < 1) {
      setError('Добавьте хотя бы одно фото');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: listing, error } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category_id: formData.category_id,
          city: formData.city.trim(),
          region: formData.region.trim(),
          address: formData.address.trim(),
          status: 'moderation'
        })
        .select()
        .single();

      if (error) throw error;

      // Upload images
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const ext = file.name.split('.').pop();
        const fileName = `${listing.id}/${Math.random()}.${ext}`;

        await supabase.storage.from('listings').upload(fileName, file);

        const { data: { publicUrl } } = supabase
          .storage
          .from('listings')
          .getPublicUrl(fileName);

        await supabase.from('listing_images').insert({
          listing_id: listing.id,
          user_id: user.id,
          url: publicUrl,
          is_main: i === 0
        });
      }

      localStorage.removeItem(DRAFT_KEY);
      navigate('/my-listings');

    } catch (err: any) {
      logSecurityEvent('listing_creation', err.message, user.id);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Новое объявление</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-red-600">
          <AlertCircle /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <input
          type="text"
          placeholder="Название"
          required
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-3 border rounded-xl"
        />

        <textarea
          placeholder="Описание"
          required
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-3 border rounded-xl"
        />

        <input
          type="number"
          placeholder="Цена"
          required
          value={formData.price}
          onChange={e => setFormData({ ...formData, price: e.target.value })}
          className="w-full p-3 border rounded-xl"
        />

        <select
          required
          value={formData.category_id}
          onChange={e => setFormData({ ...formData, category_id: e.target.value })}
          className="w-full p-3 border rounded-xl"
        >
          <option value="">Категория</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="grid grid-cols-3 gap-3">
          <input
            placeholder="Город"
            required
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
            className="p-3 border rounded-xl"
          />
          <input
            placeholder="Регион"
            value={formData.region}
            onChange={e => setFormData({ ...formData, region: e.target.value })}
            className="p-3 border rounded-xl"
          />
          <input
            placeholder="Адрес"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            className="p-3 border rounded-xl"
          />
        </div>

        <input type="file" multiple onChange={handleImageChange} />

        <div className="grid grid-cols-4 gap-2">
          {previews.map((p, i) => (
            <img key={i} src={p} onClick={() => removeImage(i)} className="cursor-pointer rounded" />
          ))}
        </div>

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl"
        >
          {loading ? 'Загрузка...' : 'Создать'}
        </button>

      </form>
    </div>
  );
};

export default CreateListing;
