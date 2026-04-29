import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Profile, Listing, Review } from '../types/database';
import { User, Star, MapPin, Calendar, Loader2 } from 'lucide-react';
import ListingCard from '../components/ListingCard';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        // Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (profileData) setProfile(profileData);

        // Fetch Listings
        const { data: listingsData } = await supabase
          .from('listings')
          .select('*, listing_images(*)')
          .eq('user_id', id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (listingsData) setListings(listingsData as Listing[]);

        // Fetch Reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*, reviewer:reviewer_id(*)')
          .eq('reviewed_id', id)
          .order('created_at', { ascending: false });

        if (reviewsData) setReviews(reviewsData as any);
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-gray-500">Загрузка профиля...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Пользователь не найден</h1>
        <Link to="/" className="text-blue-600 hover:underline">Вернуться на главную</Link>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm text-center sticky top-24">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-lg">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="w-16 h-16" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {profile.full_name || 'Частное лицо'}
            </h1>
            
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-4">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-bold text-lg">{averageRating}</span>
              <span className="text-gray-400 text-sm">({reviews.length} отзывов)</span>
            </div>

            <div className="space-y-3 text-left border-t dark:border-gray-800 pt-6 mt-6">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <MapPin className="w-5 h-5" />
                <span>{profile.city || 'Город не указан'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Calendar className="w-5 h-5" />
                <span>На ВРуки с {new Date(profile.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-12">
          {/* Active Listings */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Активные объявления <span className="text-gray-400 font-normal ml-2">{listings.length}</span>
            </h2>
            {listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="p-12 bg-gray-50 dark:bg-gray-800/50 rounded-3xl text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-700">
                У пользователя нет активных объявлений
              </div>
            )}
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Отзывы <span className="text-gray-400 font-normal ml-2">{reviews.length}</span>
            </h2>
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          {review.reviewer?.avatar_url ? (
                            <img src={review.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{review.reviewer?.full_name || 'Покупатель'}</div>
                          <div className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString('ru-RU')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200 dark:text-gray-700'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 bg-gray-50 dark:bg-gray-800/50 rounded-3xl text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-700">
                Пока отзывов нет
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
