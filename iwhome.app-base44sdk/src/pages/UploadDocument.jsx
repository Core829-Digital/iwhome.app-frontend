import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
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
import VerticalMenu from '../components/dashboard/VerticalMenu';
import { Upload, FileText, Check, X } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function UploadDocument() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'altro',
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadData({ ...uploadData, file: e.dataTransfer.files[0] });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.title) return;

    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: uploadData.file
    });

    const doc = await base44.entities.Document.create({
      title: uploadData.title,
      description: uploadData.description,
      category: uploadData.category,
      file_url,
      file_name: uploadData.file.name,
      file_type: uploadData.file.type,
      file_size: uploadData.file.size,
      shared_with: [],
      is_public: false
    });

    // Notify if shared
    if (uploadData.shared_with?.length > 0) {
      for (const email of uploadData.shared_with) {
        await base44.entities.Notification.create({
          user_email: email,
          type: 'document',
          title: 'Nuovo Documento Condiviso',
          message: `${uploadData.title} è stato condiviso con te`,
          link: '/documents'
        });
      }
    }

    queryClient.invalidateQueries({ queryKey: ['documents'] });
    setIsUploading(false);
    navigate(createPageUrl('Documents'));
  };

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
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#f8f9fa] mb-1 sm:mb-2">Carica Documento</h1>
          <p className="text-xs sm:text-sm text-[#dee2e6]">Aggiungi un nuovo file</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#343a40]/30 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden hover:bg-[#343a40]/40 transition-all duration-300"
        >
          <form onSubmit={handleUpload} className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                dragActive 
                  ? 'border-[#f8f9fa] bg-[#f8f9fa]/10' 
                  : 'border-[#f8f9fa]/30 hover:border-[#f8f9fa]/50 hover:bg-[#f8f9fa]/5'
              }`}
            >
              <input
                type="file"
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload size={48} className="text-[#f8f9fa] mx-auto mb-4" />
              {uploadData.file ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[#f8f9fa]">
                    <FileText size={20} />
                    <span className="font-medium">{uploadData.file.name}</span>
                  </div>
                  <div className="text-sm text-[#adb5bd]">
                    {(uploadData.file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[#f8f9fa] mb-2">Trascina il file qui o clicca per selezionare</p>
                  <p className="text-sm text-[#adb5bd]">Tutti i formati sono supportati</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[#f8f9fa]">Titolo *</Label>
                <Input
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  required
                  placeholder="Nome del documento"
                  className="bg-[#495057]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:bg-[#495057]/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#f8f9fa]">Categoria</Label>
                <Select value={uploadData.category} onValueChange={(v) => setUploadData({ ...uploadData, category: v })}>
                  <SelectTrigger className="bg-[#495057]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] hover:bg-[#495057]/50 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#495057] border-[#f8f9fa]/20 backdrop-blur-xl">
                    <SelectItem value="preventivo">Preventivo</SelectItem>
                    <SelectItem value="contratto">Contratto</SelectItem>
                    <SelectItem value="fattura">Fattura</SelectItem>
                    <SelectItem value="progetto">Progetto</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#f8f9fa]">Descrizione</Label>
              <Textarea
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                placeholder="Aggiungi dettagli sul documento..."
                className="bg-[#495057]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:bg-[#495057]/50 transition-all min-h-[100px]"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl('Documents'))}
                className="flex-1 border-[#f8f9fa]/30 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 backdrop-blur-sm"
              >
                <X size={18} className="mr-2" />
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={isUploading || !uploadData.file || !uploadData.title}
                className="flex-1 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-xl disabled:opacity-50"
              >
                {isUploading ? (
                  'Caricamento...'
                ) : (
                  <>
                    <Check size={18} className="mr-2" />
                    Carica Documento
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
        </div>
      </div>
    </div>
  );
}