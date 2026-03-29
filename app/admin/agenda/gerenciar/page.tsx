"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, deleteDoc, doc, orderBy } from "firebase/firestore";
import { CalendarClock, Trash2, ArrowLeft, Loader2, Edit2, Tag, AlignLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Mapeamento para exibição das tags
const categoriaStyles: any = {
  provas: { label: "Provas", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-400" },
  cursos: { label: "Cursos", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  testes: { label: "Testes", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  eventos: { label: "Eventos", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
};

export default function GerenciarAgenda() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ordenando por data de início (mais recentes primeiro)
    const q = query(collection(db, "agenda"), orderBy("start", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
        toast.success("Evento removido com sucesso!");
      } catch {
        toast.error("Erro ao remover evento.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* VOLTAR */}
        <Link
          href="/admin"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-bold text-sm transition-all"
        >
          <ArrowLeft size={16} /> Voltar ao Painel
        </Link>

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CalendarClock size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
                Gerenciar Agenda
              </h1>
              <p className="text-slate-500 text-sm font-medium">Controle total dos compromissos Protect</p>
            </div>
          </div>

          <Link 
            href="/admin/agenda" 
            className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
          >
            + Novo Evento
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-amber-500" size={40} />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Carregando Agenda...</p>
          </div>
        ) : (
          <>
            {/* ================= DESKTOP TABLE ================= */}
            <div className="hidden md:block bg-white rounded-4xl border border-slate-200 overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900">
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Evento</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Categoria</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data/Hora</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((event) => {
                    const style = categoriaStyles[event.category] || categoriaStyles.eventos;
                    return (
                      <tr key={event.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-6">
                          <p className="font-black text-slate-900 uppercase text-sm mb-1">{event.title}</p>
                          {event.description && (
                            <p className="text-slate-400 text-xs line-clamp-1 max-w-62.5 italic">
                              {event.description}
                            </p>
                          )}
                        </td>
                        <td className="p-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${style.bg} ${style.text} text-[10px] font-black uppercase tracking-wider`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {style.label}
                          </span>
                        </td>
                        <td className="p-6">
                          <p className="text-slate-700 font-bold text-sm">
                            {new Date(event.start).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-slate-400 text-[10px] font-bold">
                            {event.allDay ? "DIA TODO" : new Date(event.start).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/agenda/editar/${event.id}`}
                              className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                              <Edit2 size={18} />
                            </Link>
                            <button
                              onClick={() => handleDelete(event.id, event.title)}
                              className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE CARDS ================= */}
            <div className="md:hidden space-y-4">
              {events.map((event) => {
                const style = categoriaStyles[event.category] || categoriaStyles.eventos;
                return (
                  <div key={event.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md relative overflow-hidden">
                    {/* Barra lateral de cor */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.dot}`} />
                    
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${style.bg} ${style.text} text-[9px] font-black uppercase`}>
                        {style.label}
                      </span>
                      <div className="flex gap-1">
                        <Link href={`/admin/agenda/editar/${event.id}`} className="p-2 text-blue-500">
                          <Edit2 size={16} />
                        </Link>
                        <button onClick={() => handleDelete(event.id, event.title)} className="p-2 text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-black text-slate-900 uppercase text-lg leading-tight mb-2">
                      {event.title}
                    </h3>

                    {event.description && (
                      <div className="flex items-start gap-2 text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl">
                        <AlignLeft size={14} className="shrink-0 mt-0.5" />
                        <p className="text-xs italic line-clamp-2">{event.description}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                         {new Date(event.start).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {event.allDay ? "Dia Todo" : new Date(event.start).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* EMPTY STATE */}
            {events.length === 0 && (
              <div className="bg-white rounded-4xl border border-dashed border-slate-300 p-20 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhum compromisso agendado.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}