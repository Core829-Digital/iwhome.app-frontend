import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink } from 'lucide-react';

const PdfViewerModal = ({ url, title, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full h-[80vh] bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa] p-0 flex flex-col">
                <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-[#f8f9fa]/10 space-y-0">
                    <DialogTitle className="text-lg font-medium truncate flex-1 pr-4">
                        {title || 'Visualizzatore Documento'}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#adb5bd] hover:text-white hover:bg-white/10"
                            onClick={() => window.open(url, '_blank')}
                            title="Apri in nuova scheda"
                        >
                            <ExternalLink size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#adb5bd] hover:text-white hover:bg-white/10"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-white/5 w-full h-full relative overflow-hidden">
                    {/* Fallback/Loading info could go here behind the iframe */}
                    <iframe
                        src={url}
                        className="w-full h-full border-0"
                        title={title || 'Documento PDF'}
                        allowFullScreen
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PdfViewerModal;
