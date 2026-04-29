import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Listing } from '../types/database';
import { MapPin, Calendar, User, Phone, MessageCircle, Flag, Heart, Share2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const ListingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_user_id_fkey (*),
          categories (*),
          listing_images (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
      } else {
        setListing(data as any);
        
        // Check if favorite
        if (user) {
          const { data: favData } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('listing_id', id)
            .maybeSingle();
          
          setIsFavorite(!!favData);
        }
      }
      setLoading(false);
    };

    fetchListing();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!listing) return;

    setFavLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listing.id);
        setIsFavorite(false);
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            listing_id: listing.id
          });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleMessageClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!listing || !seller) return;

    if (user.id === listing.user_id) {
      alert('Вы не можете написать самому себе');
      return;
    }

    try {
      // Find or create conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', listing.user_id)
        .maybeSingle();

      if (existingConv) {
        navigate(`/messages/${existingConv.id}`);
      } else {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing.id,
            buyer_id: user.id,
            seller_id: listing.user_id
          })
          .select()
          .single();

        if (createError) throw createError;
        navigate(`/messages/${newConv.id}`);
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert('Ошибка при начале диалога');
    }
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-12 animate-pulse">
      <div className="h-96 bg-gray-200 rounded-3xl mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="h-48 bg-gray-200 rounded-3xl"></div>
      </div>
    </div>
  );

  if (!listing) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Объявление не найдено</h1>
      <Link to="/" className="text-blue-600 hover:underline">Вернуться на главную</Link>
    </div>
  );

  const images = listing.listing_images || [];
  const seller = (listing as any).profiles;
  
  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-blue-600">Главная</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/category/${listing.categories?.slug}`} className="hover:text-blue-600">{listing.categories?.name}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 dark:text-gray-100 truncate">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          <div className="relative bg-black rounded-3xl overflow-hidden aspect-video group">
            {images.length > 0 ? (
              <>
                <img 
                  src={images[currentImageIndex].url} 
                  alt={listing.title}
                  className="w-full h-full object-contain"
                />
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 dark:bg-gray-800">
                Нет фотографий
              </div>
            )}
          </div>

          {/* Listing Info */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{listing.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 text-gray-500 dark:text-gray-400 mb-8 border-b border-gray-100 dark:border-gray-800 pb-8">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{listing.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>Опубликовано {new Date(listing.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
              <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <Share2 className="w-5 h-5" />
                <span>Поделиться</span>
              </button>
              <button className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors ml-auto">
                <Flag className="w-5 h-5" />
                <span>Пожаловаться</span>
              </button>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-xl font-bold mb-4">Описание</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 sticky top-24">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {listing.price.toLocaleString('ru-RU')} ₽
            </div>
            
            <div className="space-y-3 mb-8">
              {seller?.phone ? (
                <button 
                  onClick={() => setShowPhone(!showPhone)}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 text-lg"
                >
                  <Phone className="w-6 h-6" />
                  {showPhone ? seller.phone : 'Показать телефон'}
                </button>
              ) : (
                <div className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-sm text-center px-4">
                  <Phone className="w-5 h-5" />
                  Продавец пока не указал номер телефона
                </div>
              )}
              
              <button 
                onClick={handleMessageClick}
                className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-4 rounded-2xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-3 text-lg"
              >
                <MessageCircle className="w-6 h-6" />
                Написать сообщение
              </button>

              <button 
                onClick={toggleFavorite}
                disabled={favLoading}
                className={`w-full border py-4 rounded-2xl font-bold transition-colors flex items-center justify-center gap-3 text-lg ${
                  isFavorite 
                    ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/10 dark:border-red-900/30' 
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {favLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                )}
                {isFavorite ? 'В избранном' : 'В избранное'}
              </button>
            </div>

            <hr className="my-6 border-gray-100 dark:border-gray-800" />

            <Link to={`/user/${seller?.id}`} className="flex items-center gap-4 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded-2xl transition-colors">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex-shrink-0">
                {seller?.avatar_url ? (
                  <img src={seller.avatar_url} alt={seller.full_name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                  {seller?.full_name || 'Частное лицо'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  На ВРуки с {new Date(seller?.created_at || Date.now()).toLocaleDateString('ru-RU')}
                </div>
                <div className="text-blue-600 dark:text-blue-400 text-xs font-medium mt-1">Перейти в профиль</div>
              </div>
            </Link>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 transition-colors">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Безопасные покупки
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
              Никогда не переводите деньги заранее. Встречайтесь в людных местах и проверяйте товар перед оплатой.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for Shield icon
const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default ListingDetails;
