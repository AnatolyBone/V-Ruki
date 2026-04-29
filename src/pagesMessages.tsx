import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Conversation, Listing, Profile } from '../types/database';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, User, Loader2, ArrowRight } from 'lucide-react';

type ExtendedConversation = Conversation & {
  listings: Listing;
  other_party: Profile;
  last_message?: {
    content: string;
    created_at: string;
  };
};

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ExtendedConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            listings (*),
            buyer:buyer_id (*),
            seller:seller_id (*)
          `)
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map((conv: any) => {
          const other_party = conv.buyer_id === user.id ? conv.seller : conv.buyer;
          return {
            ...conv,
            other_party
          };
        });

        // Try to fetch last messages for each (in a real app, this should be part of the first query or a view)
        const conversationsWithMessages = await Promise.all(formatted.map(async (conv) => {
          const { data: msgData } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          return { ...conv, last_message: msgData || undefined };
        }));

        setConversations(conversationsWithMessages);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-gray-500">Загрузка сообщений...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Мои сообщения</h1>

      {conversations.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {conversations.map((conv) => (
              <Link 
                key={conv.id} 
                to={`/messages/${conv.id}`}
                className="flex items-center gap-4 p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden flex-shrink-0">
                  {conv.other_party.avatar_url ? (
                    <img src={conv.other_party.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {conv.other_party.full_name || 'Пользователь'}
                    </h3>
                    {conv.last_message && (
                      <span className="text-xs text-gray-400">
                        {new Date(conv.last_message.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 line-clamp-1">
                    Объявление: {conv.listings.title}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 italic">
                    {conv.last_message?.content || 'Сообщений пока нет...'}
                  </p>
                </div>
                
                <div className="p-2 text-gray-300 group-hover:text-blue-600 transition-colors">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 p-20 text-center rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <MessageSquare className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Диалогов пока нет</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Напишите продавцу по интересующему вас объявлению, чтобы начать общение.
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;
