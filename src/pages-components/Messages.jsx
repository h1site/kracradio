'use client';
// src/pages/Messages.jsx
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';
import Seo from '../seo/Seo';
import FollowButton from '../components/community/FollowButton';

const STRINGS = {
  fr: {
    title: 'Messages',
    noMessages: 'Aucun message',
    noMessagesDesc: 'Commencez une conversation en visitant le profil d\'un artiste',
    browseArtists: 'Parcourir les artistes',
    typeMessage: 'Écrivez un message...',
    send: 'Envoyer',
    you: 'Vous',
    online: 'En ligne',
    lastSeen: 'Vu récemment',
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    loginRequired: 'Connexion requise',
    loginMessage: 'Connectez-vous pour accéder à vos messages',
    login: 'Se connecter',
    selectConversation: 'Sélectionnez une conversation',
    newMessage: 'Nouveau message',
    newFollowers: 'Nouveaux abonnés',
    followedYou: 'vous suit maintenant',
    viewProfile: 'Voir le profil',
  },
  en: {
    title: 'Messages',
    noMessages: 'No messages',
    noMessagesDesc: 'Start a conversation by visiting an artist\'s profile',
    browseArtists: 'Browse artists',
    typeMessage: 'Type a message...',
    send: 'Send',
    you: 'You',
    online: 'Online',
    lastSeen: 'Recently seen',
    today: 'Today',
    yesterday: 'Yesterday',
    loginRequired: 'Login Required',
    loginMessage: 'Log in to access your messages',
    login: 'Log In',
    selectConversation: 'Select a conversation',
    newMessage: 'New message',
    newFollowers: 'New followers',
    followedYou: 'started following you',
    viewProfile: 'View profile',
  },
  es: {
    title: 'Mensajes',
    noMessages: 'Sin mensajes',
    noMessagesDesc: 'Comienza una conversación visitando el perfil de un artista',
    browseArtists: 'Explorar artistas',
    typeMessage: 'Escribe un mensaje...',
    send: 'Enviar',
    you: 'Tú',
    online: 'En línea',
    lastSeen: 'Visto recientemente',
    today: 'Hoy',
    yesterday: 'Ayer',
    loginRequired: 'Inicio de sesión requerido',
    loginMessage: 'Inicia sesión para acceder a tus mensajes',
    login: 'Iniciar sesión',
    selectConversation: 'Selecciona una conversación',
    newMessage: 'Nuevo mensaje',
    newFollowers: 'Nuevos seguidores',
    followedYou: 'te sigue ahora',
    viewProfile: 'Ver perfil',
  },
};

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const L = STRINGS[lang] || STRINGS.fr;
  const router = useRouter();
  const { oderId } = useParams(); // For direct conversation view
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [followNotifications, setFollowNotifications] = useState([]);

  // Load follow notifications
  useEffect(() => {
    if (!user) return;

    const loadFollowNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:profiles!notifications_actor_id_fkey(id, username, avatar_url, artist_slug)
          `)
          .eq('user_id', user.id)
          .eq('type', 'follow')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setFollowNotifications(data || []);
      } catch (error) {
        console.error('Error loading follow notifications:', error);
      }
    };

    loadFollowNotifications();

    // Subscribe to new follow notifications
    const notifChannel = supabase
      .channel('follow-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.type === 'follow') {
            loadFollowNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [user]);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      setLoading(true);
      try {
        // Get all messages involving the user
        const { data: allMessages, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, username, avatar_url, artist_slug),
            recipient:profiles!messages_recipient_id_fkey(id, username, avatar_url, artist_slug)
          `)
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by conversation partner
        const conversationMap = new Map();
        allMessages?.forEach(msg => {
          const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
          const partner = msg.sender_id === user.id ? msg.recipient : msg.sender;

          if (!conversationMap.has(partnerId)) {
            conversationMap.set(partnerId, {
              partnerId,
              partner,
              lastMessage: msg,
              unreadCount: 0,
            });
          }

          // Count unread messages
          if (msg.recipient_id === user.id && !msg.read_at) {
            const conv = conversationMap.get(partnerId);
            conv.unreadCount++;
          }
        });

        setConversations(Array.from(conversationMap.values()));
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          loadConversations();
          // If viewing the conversation, add the message
          if (selectedConversation?.partnerId === payload.new.sender_id) {
            loadMessages(selectedConversation.partnerId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load messages for selected conversation
  const loadMessages = async (partnerId) => {
    if (!user || !partnerId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', partnerId)
        .eq('recipient_id', user.id)
        .is('read_at', null);

      // Scroll to bottom - block: 'nearest' prevents page scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.partnerId);
    }
  }, [selectedConversation]);

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation.partnerId,
          content: newMessage.trim(),
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url)
        `)
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');

      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return L.yesterday;
    } else if (days < 7) {
      return date.toLocaleDateString(lang, { weekday: 'short' });
    }
    return date.toLocaleDateString(lang, { month: 'short', day: 'numeric' });
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-600 rounded-full"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center px-4">
        <Seo lang={lang} title={L.title} description={L.loginMessage} path="/messages" />
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{L.loginRequired}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{L.loginMessage}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
          >
            {L.login}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <Seo lang={lang} title={L.title} description="Vos messages privés" path="/messages" />

      <div className="max-w-6xl mx-auto h-[calc(100vh-80px)]">
        <div className="flex h-full bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 m-4">
          {/* Conversations sidebar */}
          <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{L.title}</h1>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {/* Follow notifications section */}
              {followNotifications.length > 0 && (
                <div className="border-b border-gray-200 dark:border-gray-800">
                  <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20">
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <span>👥</span>
                      {L.newFollowers}
                    </h3>
                  </div>
                  {followNotifications.slice(0, 5).map(notif => (
                    <Link
                      key={notif.id}
                      href={`/profile/${notif.actor?.artist_slug || notif.actor_id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800"
                    >
                      {notif.actor?.avatar_url ? (
                        <img
                          src={notif.actor.avatar_url}
                          alt={notif.actor.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-semibold">{notif.actor?.username || 'Utilisateur'}</span>
                          {' '}{L.followedYou}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(notif.created_at)}
                        </p>
                      </div>
                      <span className="text-blue-500 text-xs">→</span>
                    </Link>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-600 rounded-full"></div>
                </div>
              ) : conversations.length === 0 && followNotifications.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{L.noMessages}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">{L.noMessagesDesc}</p>
                  <Link
                    href="/artists"
                    className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                  >
                    {L.browseArtists}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 ${
                      selectedConversation?.partnerId === conv.partnerId ? 'bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conv.partner?.avatar_url ? (
                        <img
                          src={conv.partner.avatar_url}
                          alt={conv.partner.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {conv.partner?.username || 'Utilisateur'}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatDate(conv.lastMessage.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${
                        conv.unreadCount > 0
                          ? 'text-gray-900 dark:text-white font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {conv.lastMessage.sender_id === user.id ? `${L.you}: ` : ''}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <Link
                    href={`/profile/${selectedConversation.partner?.artist_slug || selectedConversation.partnerId}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1"
                  >
                    {selectedConversation.partner?.avatar_url ? (
                      <img
                        src={selectedConversation.partner.avatar_url}
                        alt={selectedConversation.partner.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white">
                        {selectedConversation.partner?.username || 'Utilisateur'}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{selectedConversation.partner?.artist_slug || 'user'}
                      </p>
                    </div>
                  </Link>
                  {/* Follow button */}
                  <FollowButton userId={selectedConversation.partnerId} />
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-red-600 text-white rounded-br-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {formatDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={L.typeMessage}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="p-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>{L.selectConversation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
