"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { CalendarPlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // 1. Importar o toast

export default function CriarEvento() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = `${formData.date}T${formData.time || "00:00"}:00`;

      await addDoc(collection(db, "agenda"), {
        title: formData.title,
        start: startDateTime,
        allDay: !formData.time,
        createdAt: new Date(),
      });

      toast.success("Evento criado com sucesso!");

      // Tenta o router primeiro, se falhar, usa o window.location
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/admin"; 
        }
      }, 800);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 font-bold text-sm transition-all">
          <ArrowLeft size={16} /> Voltar ao Painel
        </Link>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-amber-500 p-8 text-black flex items-center gap-4">
            <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center">
              <CalendarPlus size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-950">Novo Evento</h1>
              <p className="text-black/60 text-xs font-bold uppercase tracking-widest">Adicionar à Agenda Protect</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Título do Evento</label>
              <input
                required
                type="text"
                placeholder="Ex: Curso de Tiro Tático Nível 1"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Data</label>
                <input
                  required
                  type="date"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Horário (Opcional)</label>
                <input
                  type="time"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-slate-950 text-white rounded-2xl p-5 font-black uppercase tracking-[0.2em] text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center cursor-pointer gap-3 disabled:opacity-50"
            >
              {loading ? "A processar..." : (
                <div className="text-[12px] flex  items-center gap-2">
                  <CheckCircle2 size={20} className="text-amber-500" />
                  Confirmar Agendamento
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}