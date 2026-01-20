import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';

import {
  MessageSquare,
  Send,
  Paperclip,
  Image as ImageIcon,
  Video,
  Mic,
  Smile,
  BarChart3,
  Calendar,
  ThumbsUp,
  Reply,
  Camera,
  Plus,
  X,
  Check,
  CheckCheck,
  UserPlus,
  Clock
} from 'lucide-react';

export default function Messages() {
  const [user, setUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showContactsList, setShowContactsList] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState('file');
  const [isEphemeral, setIsEphemeral] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Conversation.filter({
        participants: { $contains: user.email }
      }, '-last_message_date');
    },
    enabled: !!user,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      return await base44.entities.User.list();
    },
    enabled: !!user,
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const msgs = await base44.entities.Message.filter({
        conversation_id: selectedConversation.id
      }, 'created_date');
      return msgs;
    },
    enabled: !!selectedConversation,
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    keepPreviousData: true
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const newMessage = await base44.entities.Message.create(data);
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: data.content || 'File allegato',
        last_message_date: new Date().toISOString()
      });
      
      // Send notification to other participants
      const otherParticipants = selectedConversation.participants.filter(
        p => p !== user.email
      );
      for (const participant of otherParticipants) {
        await base44.entities.Notification.create({
          user_email: participant,
          type: 'message',
          title: 'Nuovo Messaggio',
          message: `${user.full_name || user.email} ti ha inviato un messaggio`,
          link: '/messages',
          sender_email: user.email,
          priority: 'normal'
        });
      }
      
      return newMessage;
    },
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', selectedConversation.id] });
      
      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['messages', selectedConversation.id]);
      
      // Optimistically update
      queryClient.setQueryData(['messages', selectedConversation.id], (old = []) => [
        ...old,
        { ...newMessage, id: 'temp-' + Date.now(), created_date: new Date().toISOString() }
      ]);
      
      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(['messages', selectedConversation.id], context.previousMessages);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageText('');
      setIsEphemeral(false);
      scrollToBottom();
    }
  });

  const likeMutation = useMutation({
    mutationFn: async ({ messageId, likes }) => {
      await base44.entities.Message.update(messageId, { likes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  const startNewConversation = async (otherUserEmail) => {
    // Check if conversation already exists
    const existing = conversations.find(c => 
      c.participants.length === 2 && 
      c.participants.includes(otherUserEmail) && 
      c.participants.includes(user.email)
    );

    if (existing) {
      setSelectedConversation(existing);
      setShowContactsList(false);
      return;
    }

    // Create new conversation
    const newConv = await base44.entities.Conversation.create({
      participants: [user.email, otherUserEmail],
      is_group: false,
      title: allUsers.find(u => u.email === otherUserEmail)?.full_name || otherUserEmail,
      last_message: '',
      last_message_date: new Date().toISOString()
    });

    // Optimistically update conversations list
    queryClient.setQueryData(['conversations', user.email], (old = []) => [newConv, ...old]);
    
    // Set the new conversation as selected
    setSelectedConversation(newConv);
    setShowContactsList(false);
    
    // Refetch in background
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const handleSend = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    const ephemeralExpiresAt = isEphemeral 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
      : null;
    
    sendMessageMutation.mutate({
      conversation_id: selectedConversation.id,
      sender_email: user.email,
      content: messageText,
      message_type: 'text',
      is_ephemeral: isEphemeral,
      ephemeral_expires_at: ephemeralExpiresAt
    });
  };

  const handleFileUpload = async (file, type = 'file') => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    sendMessageMutation.mutate({
      conversation_id: selectedConversation.id,
      sender_email: user.email,
      content: '',
      message_type: type,
      file_url,
      file_name: file.name
    });
    
    setUploadModalOpen(false);
  };

  const handleLike = (message) => {
    const likes = message.likes || [];
    const hasLiked = likes.includes(user.email);
    
    const newLikes = hasLiked
      ? likes.filter(email => email !== user.email)
      : [...likes, user.email];
    
    likeMutation.mutate({ messageId: message.id, likes: newLikes });
  };

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '👏', '🙌', '💯'];

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-[#f8f9fa]">Caricamento...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      <AnimatedBackground />

      <VerticalMenu />

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 xl:px-6 py-2 sm:py-3 lg:py-4 xl:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 xl:gap-6" style={{ height: 'calc(100vh - 100px)' }}>
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-[#343a40]/30 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-[#f8f9fa]/20 overflow-hidden flex flex-col max-h-full">
            <div className="p-3 sm:p-4 lg:p-6 border-b border-[#f8f9fa]/10 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base sm:text-lg lg:text-xl font-medium text-[#f8f9fa]">Conversazioni</h2>
              <button
                onClick={() => setShowContactsList(true)}
                className="p-2 rounded-lg hover:bg-[#f8f9fa]/10 transition-all"
              >
                <UserPlus size={20} className="text-[#f8f9fa]" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {conversations.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-[#adb5bd]">
                  <MessageSquare size={32} sm:size={48} className="mx-auto mb-2 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Nessuna conversazione</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-3 sm:p-4 border-b border-[#f8f9fa]/5 cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-[#f8f9fa]/10'
                        : 'hover:bg-[#f8f9fa]/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm sm:text-base flex-shrink-0">
                        {conv.title?.[0] || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#f8f9fa] truncate text-sm sm:text-base">
                          {conv.title || 'Conversazione'}
                        </div>
                        <div className="text-xs sm:text-sm text-[#adb5bd] truncate">
                          {conv.last_message || 'Inizia una conversazione'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-[#343a40]/30 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-[#f8f9fa]/20 flex flex-col overflow-hidden max-h-full">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-[#adb5bd] p-4">
                <div className="text-center">
                  <MessageSquare size={40} sm:size={64} className="mx-auto mb-2 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base lg:text-lg">Seleziona una conversazione</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-3 sm:p-4 lg:p-6 border-b border-[#f8f9fa]/10 flex-shrink-0">
                  <h3 className="text-base sm:text-lg lg:text-xl font-medium text-[#f8f9fa] truncate">
                    {selectedConversation.title || 'Conversazione'}
                  </h3>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_email === user.email;
                    const hasLiked = msg.likes?.includes(user.email);
                    const isSystemMsg = msg.message_type === 'system';
                    
                    if (isSystemMsg) {
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-center my-4"
                        >
                          <div className="bg-[#495057]/50 border border-[#f8f9fa]/10 rounded-full px-4 py-2 text-xs text-[#adb5bd]">
                            {msg.content}
                          </div>
                        </motion.div>
                      );
                    }
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                          {msg.sender_email[0].toUpperCase()}
                        </div>
                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                          <div className={`rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-[#343a40] text-[#f8f9fa]'
                          } ${msg.is_ephemeral ? 'opacity-75 border border-yellow-500/30' : ''}`}>
                            {msg.content && <p className="text-sm">{msg.content}</p>}
                            {msg.file_url && (
                              <div className="mt-2">
                                {msg.message_type === 'image' && (
                                  <img src={msg.file_url} alt="Image" className="rounded-lg max-w-full" />
                                )}
                                {msg.message_type === 'video' && (
                                  <video src={msg.file_url} controls className="rounded-lg max-w-full" />
                                )}
                                {msg.message_type === 'file' && (
                                  <a href={msg.file_url} target="_blank" className="flex items-center gap-2 text-sm">
                                    <Paperclip size={14} />
                                    {msg.file_name}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => handleLike(msg)}
                              className={`flex items-center gap-1 text-xs ${
                                hasLiked ? 'text-red-400' : 'text-[#adb5bd]'
                              } hover:text-red-400 transition-colors`}
                            >
                              <ThumbsUp size={12} fill={hasLiked ? 'currentColor' : 'none'} />
                              {msg.likes?.length > 0 && msg.likes.length}
                            </button>
                            {msg.is_ephemeral && (
                              <span className="text-xs text-yellow-500" title="Messaggio effimero - sparirà dopo 7 giorni">
                                ⏱️
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-2 sm:p-3 lg:p-4 border-t border-[#f8f9fa]/10 flex-shrink-0">
                  {isEphemeral && (
                    <div className="mb-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-500 flex items-center gap-2">
                      ⏱️ Messaggio effimero - sparirà dopo 7 giorni
                      <button 
                        onClick={() => setIsEphemeral(false)}
                        className="ml-auto hover:text-yellow-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="text-[#dee2e6] hover:text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                      >
                        <Plus size={20} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-[#dee2e6] hover:text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                      >
                        <Smile size={20} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsEphemeral(!isEphemeral)}
                        className={`${isEphemeral ? 'text-yellow-500' : 'text-[#dee2e6]'} hover:text-[#f8f9fa] hover:bg-[#f8f9fa]/10`}
                        title="Messaggio effimero (7 giorni)"
                      >
                        <Clock size={20} />
                      </Button>
                    </div>
                    
                    <div className="flex-1 relative">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Scrivi un messaggio..."
                        className="bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa] pr-12"
                      />
                      
                      {/* Emoji Picker */}
                      <AnimatePresence>
                        {showEmojiPicker && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 bg-[#495057] border border-[#f8f9fa]/20 rounded-xl p-3 grid grid-cols-5 gap-2 shadow-xl"
                          >
                            {emojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  setMessageText(messageText + emoji);
                                  setShowEmojiPicker(false);
                                }}
                                className="text-2xl hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Attach Menu */}
                      <AnimatePresence>
                        {showAttachMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 mb-2 bg-[#495057] border border-[#f8f9fa]/20 rounded-xl overflow-hidden shadow-xl"
                          >
                            <button
                              onClick={() => {
                                setUploadType('file');
                                setUploadModalOpen(true);
                                setShowAttachMenu(false);
                              }}
                              className="flex items-center gap-3 px-4 py-3 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 w-full transition-colors"
                            >
                              <Paperclip size={18} />
                              File
                            </button>
                            <button
                              onClick={() => {
                                setUploadType('image');
                                setUploadModalOpen(true);
                                setShowAttachMenu(false);
                              }}
                              className="flex items-center gap-3 px-4 py-3 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 w-full transition-colors"
                            >
                              <ImageIcon size={18} />
                              Foto
                            </button>
                            <button
                              onClick={() => {
                                setUploadType('video');
                                setUploadModalOpen(true);
                                setShowAttachMenu(false);
                              }}
                              className="flex items-center gap-3 px-4 py-3 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 w-full transition-colors"
                            >
                              <Video size={18} />
                              Video
                            </button>
                            <button
                              onClick={() => {
                                setUploadType('camera');
                                setUploadModalOpen(true);
                                setShowAttachMenu(false);
                              }}
                              className="flex items-center gap-3 px-4 py-3 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 w-full transition-colors"
                            >
                              <Camera size={18} />
                              Camera
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <Button
                      onClick={handleSend}
                      disabled={!messageText.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contacts List Modal */}
      <AnimatePresence>
        {showContactsList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowContactsList(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#343a40]/95 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-3xl p-6 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-[#f8f9fa]">Seleziona Contatto</h3>
                <button
                  onClick={() => setShowContactsList(false)}
                  className="p-2 rounded-lg hover:bg-[#f8f9fa]/10 transition-all"
                >
                  <X size={20} className="text-[#f8f9fa]" />
                </button>
              </div>

              <div className="space-y-2">
                {allUsers
                  .filter(u => u.email !== user?.email)
                  .map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => startNewConversation(contact.email)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#495057]/50 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {contact.full_name?.[0] || contact.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#f8f9fa] truncate">
                          {contact.full_name || contact.email}
                        </div>
                        <div className="text-xs text-[#adb5bd] truncate">{contact.email}</div>
                      </div>
                    </button>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20 text-[#f8f9fa]">
          <DialogHeader>
            <DialogTitle className="text-[#f8f9fa]">
              Carica {uploadType === 'camera' ? 'dalla Camera' : uploadType === 'image' ? 'Foto' : uploadType === 'video' ? 'Video' : 'File'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Input
              type="file"
              ref={fileInputRef}
              accept={uploadType === 'image' ? 'image/*' : uploadType === 'video' ? 'video/*' : '*'}
              capture={uploadType === 'camera' ? 'environment' : undefined}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleFileUpload(file, uploadType === 'camera' ? 'image' : uploadType);
                }
              }}
              className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] file:bg-[#f8f9fa]/10 file:text-[#f8f9fa]"
            />
          </div>
        </DialogContent>
        </Dialog>
        </div>
        </div>
        );
        }