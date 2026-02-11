import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, AlertCircle, FileText } from 'lucide-react';

const UniversalPdfViewer = ({ url, title, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-4xl w-full h-[85vh] bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa] p-0 flex flex-col gap-0 [&>button]:hidden"
            >
                <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-[#f8f9fa]/10 space-y-0 bg-[#212529]">
                    <DialogTitle className="text-lg font-medium truncate flex-1 pr-4 flex items-center gap-2">
                        <FileText className="text-cyan-400" size={20} />
                        {title || 'Visualizzatore Documento'}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        {url && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#adb5bd] hover:text-white hover:bg-white/10 h-8 px-2"
                                onClick={() => window.open(url, '_blank')}
                                title="Apri in nuova scheda"
                            >
                                <ExternalLink size={18} className="mr-1" />
                                <span className="hidden sm:inline">Apri Esterno</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#adb5bd] hover:text-white hover:bg-white/10 h-8 w-8 ml-2"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-[#212529] w-full h-full relative overflow-hidden flex flex-col">
                    {url ? (
                        <iframe
                            src={url}
                            className="w-full h-full border-0 bg-white"
                            title={title || 'Documento PDF'}
                            allowFullScreen
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#adb5bd] p-8 text-center">
                            <AlertCircle size={48} className="mb-4 text-red-400" />
                            <h3 className="text-xl font-medium text-[#f8f9fa] mb-2">Documento non disponibile</h3>
                            <p className="max-w-md">
                                Impossibile visualizzare il documento. Il file potrebbe essere stato rimosso o il percorso non è valido.
                            </p>
                            <Button variant="outline" className="mt-6 border-[#f8f9fa]/20" onClick={onClose}>
                                Chiudi
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UniversalPdfViewer;
