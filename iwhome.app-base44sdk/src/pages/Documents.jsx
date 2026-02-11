/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Plus,
  Search,
  X,
  Download,
  Loader2
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

  // PDF Viewer State
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);
  const [selectedDocTitle, setSelectedDocTitle] = useState('');

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
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": uploadData.file.type },
        body: uploadData.file,
      });

      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      // Store ONLY the storageId, let the backend generate the signed URL
      const storageUrl = storageId;

      if (user?.primaryEmailAddress?.emailAddress) {
        await createDocument({
          title: uploadData.title,
          description: uploadData.description,
          category: uploadData.category,
          file_url: storageUrl,
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
    return <div className="min-h-screen flex items-center justify-center bg-[#212529]">
      <div className="text-[#f8f9fa]">Caricamento...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      <AnimatedBackground />
      <VerticalMenu />

      {/* Universal PDF Viewer */}
      <UniversalPdfViewer
        isOpen={!!selectedDocUrl}
        onClose={() => setSelectedDocUrl(null)}
        url={selectedDocUrl}
        title={selectedDocTitle}
      />

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#f8f9fa] mb-1">I Miei Documenti</h1>
              <p className="text-xs sm:text-sm text-[#dee2e6]">Gestisci preventivi, contratti e documenti</p>
            </div>
            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] shadow-lg hover:shadow-xl transition-all">
                  <Plus size={16} className="mr-2" />
                  Carica Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa]">
                <DialogHeader>
                  <DialogTitle>Carica Nuovo Documento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[#f8f9fa]">Titolo</Label>
                    <Input
                      value={uploadData.title}
                      onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                      className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#f8f9fa]">Descrizione</Label>
                    <Input
                      value={uploadData.description}
                      onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                      className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#f8f9fa]">Categoria</Label>
                    <Select value={uploadData.category} onValueChange={v => setUploadData({ ...uploadData, category: v })}>
                      <SelectTrigger className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#343a40] border-[#f8f9fa]/20">
                        <SelectItem value="preventivo" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Preventivo</SelectItem>
                        <SelectItem value="contratto" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Contratto</SelectItem>
                        <SelectItem value="fattura" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Fattura</SelectItem>
                        <SelectItem value="progetto" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Progetto</SelectItem>
                        <SelectItem value="altro" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#f8f9fa]">File</Label>
                    <Input
                      type="file"
                      onChange={e => setUploadData({ ...uploadData, file: e.target.files[0] })}
                      className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] file:bg-[#f8f9fa] file:text-[#212529] file:border-0 file:rounded file:mr-4"
                    />
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !uploadData.file || !uploadData.title}
                    className="w-full bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef]"
                  >
                    {isUploading ? 'Caricamento...' : 'Carica'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
              <Input
                placeholder="Cerca documenti..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#343a40]/50 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#6c757d]"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-[#343a40] border-[#f8f9fa]/20">
                <SelectItem value="all" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Tutte le Categorie</SelectItem>
                <SelectItem value="preventivo" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Preventivo</SelectItem>
                <SelectItem value="contratto" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Contratto</SelectItem>
                <SelectItem value="fattura" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Fattura</SelectItem>
                <SelectItem value="progetto" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Progetto</SelectItem>
                <SelectItem value="altro" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-white cursor-pointer">Altro</SelectItem>
              </SelectContent>
            </Select>
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
                      onClick={() => {
                        setSelectedDocUrl(doc.file_url);
                        setSelectedDocTitle(doc.title);
                      }}
                      className="flex-1 bg-[#495057] text-[#f8f9fa] hover:bg-[#6c757d] transition-colors font-medium border border-[#f8f9fa]/20"
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