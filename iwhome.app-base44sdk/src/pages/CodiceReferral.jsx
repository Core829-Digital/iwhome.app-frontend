import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Percent, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import useRBAC from '../hooks/useRBAC';

export default function CodiceReferral() {
    const { isAdmin } = useRBAC();

    const codes = useQuery(api.referralCodes.list) || [];
    const createCode = useMutation(api.referralCodes.create);
    const toggleActive = useMutation(api.referralCodes.toggleActive);
    const removeCode = useMutation(api.referralCodes.remove);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: '', description: '', discount_percent: '', max_uses: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Accesso non autorizzato.</p>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!form.code.trim()) return setError('Il codice è obbligatorio');
        const pct = parseFloat(form.discount_percent);
        if (isNaN(pct) || pct <= 0 || pct > 100) return setError('Sconto deve essere tra 1 e 100');

        setSaving(true);
        try {
            await createCode({
                code: form.code,
                description: form.description || undefined,
                discount_percent: pct,
                max_uses: form.max_uses ? parseInt(form.max_uses) : undefined,
            });
            setSuccess('Codice creato con successo!');
            setForm({ code: '', description: '', discount_percent: '', max_uses: '' });
            setShowForm(false);
        } catch (err) {
            setError(err.message || 'Errore durante la creazione');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await toggleActive({ id });
        } catch (err) {
            setError(err.message || 'Errore');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sei sicuro di voler eliminare questo codice?')) return;
        try {
            await removeCode({ id });
        } catch (err) {
            setError(err.message || 'Errore');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-6 lg:p-10">
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                            <Tag size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#212529]">Codici Referral</h1>
                            <p className="text-sm text-[#6c757d]">Gestisci i codici sconto per i clienti registrati</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg rounded-xl gap-2"
                    >
                        <Plus size={18} />
                        Nuovo Codice
                    </Button>
                </div>

                {/* Feedback */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
                        >
                            <AlertCircle size={16} /> {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm"
                        >
                            <CheckCircle2 size={16} /> {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-6"
                        >
                            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-[#dee2e6] p-6 space-y-4">
                                <h2 className="text-base font-semibold text-[#212529] mb-2">Crea Nuovo Codice</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-[#495057]">Codice *</Label>
                                        <Input
                                            value={form.code}
                                            onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                            placeholder="es. ESTATE25"
                                            className="rounded-xl uppercase"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-[#495057]">Sconto % *</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={form.discount_percent}
                                            onChange={e => setForm(p => ({ ...p, discount_percent: e.target.value }))}
                                            placeholder="es. 10"
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <Label className="text-xs font-medium text-[#495057]">Descrizione</Label>
                                        <Input
                                            value={form.description}
                                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                            placeholder="es. Sconto estivo per nuovi clienti"
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-[#495057]">Utilizzi massimi (opzionale)</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={form.max_uses}
                                            onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))}
                                            placeholder="Illimitati"
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="submit" disabled={saving}
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl"
                                    >
                                        {saving ? 'Creazione...' : 'Crea Codice'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">
                                        Annulla
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Codes Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#dee2e6] overflow-hidden">
                    {codes.length === 0 ? (
                        <div className="py-16 text-center text-[#6c757d]">
                            <Tag size={40} className="mx-auto mb-4 opacity-30" />
                            <p className="font-medium">Nessun codice referral</p>
                            <p className="text-sm mt-1">Crea il primo codice con il pulsante in alto.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#dee2e6] bg-[#f8f9fa]">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider">Codice</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider">Descrizione</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-[#6c757d] uppercase tracking-wider">Sconto</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-[#6c757d] uppercase tracking-wider">Utilizzi</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-[#6c757d] uppercase tracking-wider">Stato</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-[#6c757d] uppercase tracking-wider">Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {codes.map((c, i) => (
                                    <tr key={c._id} className={`border-b border-[#dee2e6] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#f8f9fa]/40'}`}>
                                        <td className="px-5 py-4">
                                            <span className="font-mono font-bold text-[#212529] bg-[#e9ecef] px-2 py-1 rounded-lg text-sm">{c.code}</span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-[#495057]">{c.description || '—'}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 font-semibold px-2 py-1 rounded-lg text-sm">
                                                <Percent size={13} />{c.discount_percent}%
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 text-sm text-[#495057]">
                                                <Users size={14} className="text-[#adb5bd]" />
                                                {c.uses_count}{c.max_uses !== undefined ? `/${c.max_uses}` : ''}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <button onClick={() => handleToggle(c._id)} className="inline-flex items-center gap-1.5 text-sm font-medium">
                                                {c.is_active
                                                    ? <><ToggleRight size={22} className="text-green-500" /><span className="text-green-600">Attivo</span></>
                                                    : <><ToggleLeft size={22} className="text-gray-400" /><span className="text-gray-400">Inattivo</span></>
                                                }
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(c._id)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-[#adb5bd] hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
