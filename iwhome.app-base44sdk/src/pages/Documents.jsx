import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';
import {
  FileText,
  Upload,
  Share2,
  Download,
  Trash2,
  Eye,
  Plus,
  Search,
  Filter
} from 'lucide-react';

export default function Documents() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'altro',
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);

  const documentsQuery = useQuery(api.documents.getByUser, { email: user?.primaryEmailAddress?.emailAddress || "" });
  const documents = documentsQuery || [];
  const isLoading = documentsQuery === undefined;
  const createDocument = useMutation(api.documents.create);
  const deleteDocument = useMutation(api.documents.deleteDocument);


  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title) return;

    setIsUploading(true);

    try {
      // 1. Get Upload URL
      const postUrl = await generateUploadUrl();

      // 2. Upload File
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": uploadData.file.type },
        body: uploadData.file,
      });

      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();

      // 3. Save Document Record
      // Note: In real Convex apps with Storage, you usually store the storageId.
      // But preserving `file_url` for now as per schema. In Convex, `getFileUrl` usually runs on backend or frontend query.
      // Let's store storageId in file_url for parsing later OR we should update schema to have storageId?
      // Schema has file_url: v.string().
      // For now, let's construct the URL manually or assume we get it. 
      // Actually convex cloud URLs are usually: https://<deployment>.convex.cloud/api/storage/<storageId>
      // We will construct it here for immediate display, but ideally usage should be storageId.
      // Let's assume we just store the generic URL format.

      const file_url = `${import.meta.env.VITE_CONVEX_URL.replace('.cloud', '.site')}/getImage?storageId=${storageId}`;
      // Wait, standard convex storage access is via `convex.site` or HTTP functions.
      // Simpler: Just store the storageId in a new field if possible, or put storageId in file_url if the app handles it?
      // The current app expects a clickable URL. 
      // Let's use the standard Convex HTTP action approach or just the raw URL if we knew the format.
      // The format is `https://${deploymentName}.convex.cloud/api/storage/${storageId}`

      const storageUrl = `${import.meta.env.VITE_CONVEX_URL}/api/storage/${storageId}`;

      if (user?.primaryEmailAddress?.emailAddress) {
        await createDocument({
          title: uploadData.title,
          description: uploadData.description,
          category: uploadData.category,
          file_url: storageUrl, // Storing queryable URL
          file_name: uploadData.file.name,
          file_type: uploadData.file.type,
          file_size: uploadData.file.size,
          is_public: "false",
          created_by: user.primaryEmailAddress.emailAddress,
          created_date: new Date().toISOString()
        });
      }

      setUploadModalOpen(false);
      setUploadData({ title: '', description: '', category: 'altro', file: null });

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Errore durante il caricamento del file.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#f8f9fa] mb-1">I Miei Documenti</h1>
              <p className="text-xs sm:text-sm text-[#dee2e6]">Gestisci e condividi i tuoi file</p>
            </div>

            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-xl">
                  <Plus size={18} className="mr-2" />
                  Carica Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20 text-[#f8f9fa]">
                <DialogHeader>
                  <DialogTitle className="text-[#f8f9fa]">Carica Nuovo Documento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-[#f8f9fa]">Titolo *</Label>
                    <Input
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#f8f9fa]">Descrizione</Label>
                    <Textarea
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#f8f9fa]">Categoria</Label>
                    <Select value={uploadData.category} onValueChange={(v) => setUploadData({ ...uploadData, category: v })}>
                      <SelectTrigger className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#495057] border-[#f8f9fa]/20">
                        <SelectItem value="preventivo">Preventivo</SelectItem>
                        <SelectItem value="contratto">Contratto</SelectItem>
                        <SelectItem value="fattura">Fattura</SelectItem>
                        <SelectItem value="progetto">Progetto</SelectItem>
                        <SelectItem value="altro">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[#f8f9fa]">File *</Label>
                    <Input
                      type="file"
                      onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                      className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] file:bg-[#f8f9fa]/10 file:text-[#f8f9fa]"
                    />
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !uploadData.file || !uploadData.title}
                    className="w-full bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529]"
                  >
                    {isUploading ? 'Caricamento...' : 'Carica'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="bg-[#343a40]/30 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 border border-[#f8f9fa]/20 hover:bg-[#343a40]/40 transition-all duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                <Input
                  placeholder="Cerca documenti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                  <Filter size={18} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#495057] border-[#f8f9fa]/20">
                  <SelectItem value="all">Tutte le Categorie</SelectItem>
                  <SelectItem value="preventivo">Preventivo</SelectItem>
                  <SelectItem value="contratto">Contratto</SelectItem>
                  <SelectItem value="fattura">Fattura</SelectItem>
                  <SelectItem value="progetto">Progetto</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="text-center py-12 text-[#dee2e6]">Caricamento...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={64} className="text-[#6c757d] mx-auto mb-4" />
              <p className="text-[#dee2e6] text-lg">Nessun documento trovato</p>
              <p className="text-[#adb5bd] text-sm mt-2">Carica il tuo primo documento per iniziare</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {filteredDocuments.map((doc) => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-[#343a40]/30 backdrop-blur-xl rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#f8f9fa]/20 shadow-xl hover:bg-[#343a40]/50 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 backdrop-blur-sm flex items-center justify-center">
                      <FileText size={24} className="text-[#f8f9fa]" />
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#f8f9fa]/10 text-[#f8f9fa]">
                      {doc.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-[#f8f9fa] mb-2">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-sm text-[#dee2e6] mb-4 line-clamp-2">{doc.description}</p>
                  )}
                  <div className="text-xs text-[#adb5bd] mb-4">
                    {doc.file_name} • {(doc.file_size / 1024).toFixed(1)} KB
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.file_url, '_blank')}
                      className="flex-1 border-[#f8f9fa]/30 text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                    >
                      <Eye size={14} className="mr-1" />
                      Vedi
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteDocument({ id: doc._id })}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}