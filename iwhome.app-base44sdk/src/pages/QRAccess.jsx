import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from "../../../../Backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Loader2, CheckCircle, XCircle, User, Briefcase, Mail } from 'lucide-react';

export default function QRAccess() {
    const { token } = useParams();
    const accessQrLink = useMutation(api.collaborators.accessQrLink);
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [data, setData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('Token mancante');
            return;
        }

        accessQrLink({ token })
            .then((res) => {
                setData(res);
                setStatus('success');
            })
            .catch(err => {
                setStatus('error');
                setErrorMsg(err.message || 'Link non valido o scaduto');
            });
    }, [token, accessQrLink]);

    return (
        <div className="min-h-screen bg-[#212529] flex flex-col items-center justify-center p-4">
            <div className="bg-[#343a40] border border-[#495057] rounded-2xl w-full max-w-sm p-8 text-center shadow-xl">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                        <h2 className="text-[#f8f9fa] text-xl font-medium">Verifica in corso...</h2>
                        <p className="text-[#adb5bd] text-sm mt-2">Attendere prego</p>
                    </div>
                )}
                
                {status === 'success' && data && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                            <CheckCircle size={40} className="text-green-400" />
                        </div>
                        <h2 className="text-[#f8f9fa] text-2xl font-bold mb-1">Accesso Autorizzato</h2>
                        <p className="text-green-400 text-sm font-medium mb-8">QR Link Valido</p>
                        
                        <div className="bg-[#212529] w-full rounded-xl p-4 border border-[#495057] text-left">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-[#495057] rounded-full flex items-center justify-center text-[#f8f9fa]">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-[#f8f9fa] font-medium text-lg">{data.full_name}</h3>
                                    <p className="text-[#adb5bd] text-sm flex items-center gap-1">
                                        <Briefcase size={12} /> {data.job_title}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-[#343a40] p-2 rounded">
                                    <span className="text-[#6c757d] block mb-1">Tipo</span>
                                    <span className="text-[#dee2e6] capitalize">{data.type}</span>
                                </div>
                                <div className="bg-[#343a40] p-2 rounded">
                                    <span className="text-[#6c757d] block mb-1">Stato Operativo</span>
                                    <span className="text-[#dee2e6] capitalize">{data.live_status?.replace('_', ' ') || 'Sconosciuto'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                            <XCircle size={40} className="text-red-400" />
                        </div>
                        <h2 className="text-[#f8f9fa] text-2xl font-bold mb-2">Accesso Negato</h2>
                        <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
                    </div>
                )}
            </div>
            {/* Logo placeholder */}
            <div className="mt-8 opacity-50 text-[#adb5bd] text-sm font-medium tracking-widest flex items-center gap-2">
                IWHOME SISTEMA STAFF
            </div>
        </div>
    );
}
