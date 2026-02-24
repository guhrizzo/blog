"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, deleteDoc, doc } from "firebase/firestore";
import { CalendarClock, Trash2, ArrowLeft, Loader2, Edit2 } from "lucide-react";
import Link from "next/link";

export default function GerenciarAgenda() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "agenda"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(eventData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Deseja realmente excluir o evento "${title}"?`)) {
            try {
                await deleteDoc(doc(db, "agenda", id));
                alert("Evento removido!");
            } catch (error) {
                alert("Erro ao remover evento.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-bold text-sm">
                    <ArrowLeft size={16} /> Voltar ao Painel
                </Link>

                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center border border-amber-600/30 justify-center">
                            <CalendarClock size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase">Gerenciar Eventos</h1>
                            <p className="text-slate-500 text-sm">Visualize e remova compromissos da agenda</p>
                        </div>
                    </div>
                    <span className="bg-slate-200 text-slate-700 px-4 py-1 rounded-full text-xs font-bold">
                        {events.length} Eventos
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={40} /></div>
                ) : (
                    <div className="bg-white rounded-4xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Evento</th>
                                    <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Data</th>
                                    <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {events.map((event) => (
                                    <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6">
                                            <p className="font-bold text-slate-900">{event.title}</p>
                                        </td>
                                        <td className="p-6 text-slate-500 text-sm">
                                            {new Date(event.start).toLocaleDateString('pt-BR')}
                                        </td>

                                        <td className="p-6 text-right flex justify-end gap-2">
                                            {/* Botão Editar */}
                                            <Link
                                                href={`/admin/agenda/editar/${event.id}`}
                                                className="p-3 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </Link>

                                            {/* Botão Excluir */}
                                            <button
                                                onClick={() => handleDelete(event.id, event.title)}
                                                className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {events.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-20 text-center text-slate-400 italic">Nenhum evento cadastrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}