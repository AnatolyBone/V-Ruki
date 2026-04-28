import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart } from 'lucide-react';
import { Listing } from '../types/database';

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const mainImage = listing.listing_images?.find(img => img.is_main)?.url || 
                    listing.listing_images?.[0]?.url || 
                    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md dark:hover:shadow-blue-900/10 transition-all group">
      <Link to={`/listing/${listing.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <img 
          src={mainImage} 
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button 
          onClick={(e) => {
            e.preventDefault();
          }}
          className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
        >
          <Heart className="w-5 h-5" />
        </button>
      </Link>
      <div className="p-4">
        <Link to={`/listing/${listing.id}`}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {listing.title}
          </h3>
        </Link>
        <p className="text-xl font-bold text-gray-900 dark:text-blue-400 mb-3">
          {listing.price.toLocaleString('ru-RU')} ₽
        </p>
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>{listing.city}</span>
        </div>
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {new Date(listing.created_at).toLocaleDateString('ru-RU')}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
