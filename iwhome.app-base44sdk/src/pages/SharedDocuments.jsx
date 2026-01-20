import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import { FileText, Download, Eye, Share2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SharedDocuments() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['shared-documents', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const allDocs = await base44.entities.Document.list();
      return allDocs.filter(doc => 
        doc.shared_with?.includes(user.email) || doc.is_public
      );
    },
    enabled: !!user,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-[#f8f9fa]">Caricamento...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-[#e9ecef]/10 to-transparent rounded-full blur-3xl"
        />
      </div>

      <VerticalMenu />

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#f8f9fa] mb-1 sm:mb-2">Condivisi con Me</h1>
            <p className="text-xs sm:text-sm text-[#dee2e6]">Documenti condivisi</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
            <Input
              placeholder="Cerca documenti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#343a40]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] focus:bg-[#343a40]/50 transition-all"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-[#dee2e6]">Caricamento...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <Share2 size={64} className="text-[#6c757d] mx-auto mb-4" />
            <p className="text-[#dee2e6] text-lg">Nessun documento condiviso</p>
            <p className="text-[#adb5bd] text-sm mt-2">I documenti condivisi appariranno qui</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {filteredDocuments.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="bg-[#343a40]/30 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl hover:bg-[#343a40]/50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 backdrop-blur-sm flex items-center justify-center">
                    <FileText size={24} className="text-[#f8f9fa]" />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#f8f9fa]/10 text-[#f8f9fa] backdrop-blur-sm">
                    {doc.category}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-[#f8f9fa] mb-2">{doc.title}</h3>
                {doc.description && (
                  <p className="text-sm text-[#dee2e6] mb-4 line-clamp-2">{doc.description}</p>
                )}
                <div className="text-xs text-[#adb5bd] mb-4">
                  Condiviso da: {doc.created_by}
                </div>
                <Button
                  size="sm"
                  onClick={() => window.open(doc.file_url, '_blank')}
                  className="w-full bg-[#495057]/50 backdrop-blur-sm border border-[#f8f9fa]/20 text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                >
                  <Eye size={14} className="mr-2" />
                  Visualizza
                </Button>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}