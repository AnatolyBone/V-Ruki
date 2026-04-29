import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Conversation, Message, Profile, Listing, Deal } from '../types/database';
import { Send, ArrowLeft, Loader2, CheckCircle2, User, Star } from 'lucide-react';

const ConversationPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<(Conversation & { listings: Listing, buyer: Profile, seller: Profile }) | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch conversation with related data
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select(`
            *,
            listings (*),
            buyer:buyer_id (*),
            seller:seller_id (*)
          `)
          .eq('id', conversationId)
          .single();

        if (convError) throw convError;
        setConversation(convData as any);

        // Fetch messages
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;
        setMessages(msgData || []);

        // Fetch deal status
        const { data: dealData } = await supabase
          .from('deals')
          .select('*')
          .eq('listing_id', convData.listing_id)
          .eq('buyer_id', convData.buyer_id)
          .maybeSingle();
        
        if (dealData) setDeal(dealData);

        scrollToBottom();
      } catch (err) {
        console.error('Error fetching conversation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        setTimeout(scrollToBottom, 100);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, user, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!conversation || !user) return;
    if (user.id !== conversation.seller_id) return;

    try {
      const { data, error } = await supabase
        .from('deals')
        .insert({
          listing_id: conversation.listing_id,
          buyer_id: conversation.buyer_id,
          seller_id: conversation.seller_id,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;
      setDeal(data);
    } catch (err) {
      console.error('Error completing deal:', err);
      alert('Ошибка при оформлении сделки');
    }
  };

  const handleSubmitReview = async () => {
    if (!deal || !user) return;
    
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          deal_id: deal.id,
          reviewer_id: user.id,
          reviewed_id: user.id === deal.buyer_id ? deal.seller_id : deal.buyer_id,
          rating: reviewRating,
          comment: reviewComment.trim() || null
        });

      if (error) throw error;
      setShowReviewModal(false);
      alert('Отзыв успешно оставлен!');
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Вы уже оставили отзыв для этой сделки');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  if (!conversation) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Диалог не найден</h1>
      <Link to="/messages" className="text-blue-600 hover:underline">Вернуться к сообщениям</Link>
    </div>
  );

  const otherParty = user?.id === conversation.buyer_id ? conversation.seller : conversation.buyer;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => navigate('/messages')} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          {otherParty.avatar_url ? (
            <img src={otherParty.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User className="w-6 h-6" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 dark:text-white truncate">{otherParty.full_name || 'Пользователь'}</h2>
          <Link to={`/listing/${conversation.listing_id}`} className="text-xs text-blue-600 hover:underline line-clamp-1">
            Объявление: {conversation.listings.title}
          </Link>
        </div>
        
        {user?.id === conversation.seller_id && !deal && (
          <button 
            onClick={handleMarkAsCompleted}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Сделка состоялась
          </button>
        )}
        
        {deal && user?.id === deal.buyer_id && (
          <button 
            onClick={() => setShowReviewModal(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors"
          >
            <Star className="w-4 h-4" /> Оставить отзыв
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.sender_id === user?.id 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div className={`text-[10px] mt-1 opacity-70 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="container mx-auto max-w-4xl flex gap-2">
          <input 
            type="text" 
            placeholder="Напишите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>
      </form>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold mb-6 dark:text-white">Оставьте отзыв</h3>
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setReviewRating(star)}
                  className={`p-1 transition-all ${reviewRating >= star ? 'text-amber-500 scale-110' : 'text-gray-300 dark:text-gray-700'}`}
                >
                  <Star className="w-10 h-10 fill-current" />
                </button>
              ))}
            </div>
            <textarea 
              rows={4}
              placeholder="Что вам понравилось? (необязательно)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none mb-6 resize-none"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleSubmitReview}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationPage;
