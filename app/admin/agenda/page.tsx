"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { CalendarPlus, ArrowLeft, CheckCircle2, Tag, AlignLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const categorias = [
  { id: "provas", label: "Provas", color: "#fbbf24", bg: "bg-amber-400" }, // Amarela
  { id: "cursos", label: "Cursos", color: "#ef4444", bg: "bg-red-500" },    // Vermelha
  { id: "testes", label: "Testes", color: "#3b82f6", bg: "bg-blue-500" },   // Azul
  { id: "eventos", label: "Eventos", color: "#22c55e", bg: "bg-green-500" }, // Verde
];

export default function CriarEvento() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    category: "provas", // Valor padrão
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = `${formData.date}T${formData.time || "00:00"}:00`;
      
      // Encontra a cor baseada na categoria selecionada
      const selectedCat = categorias.find(c => c.id === formData.category);

      await addDoc(collection(db, "agenda"), {
        title: formData.title,
        start: startDateTime,
        allDay: !formData.time,
        description: formData.description,
        category: formData.category,
        color: selectedCat?.color || "#000000", // Salva a cor para o FullCalendar usar
        createdAt: new Date(),
      });

      toast.success("Evento criado com sucesso!");

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
          <div className="bg-slate-950 p-8 text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black">
              <CalendarPlus size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter">Novo Evento</h1>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Adicionar à Agenda Protect</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-6">
            
            {/* Campo Título */}
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

            {/* Campo Categoria */}
            <div>
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">
                <Tag size={14} /> Categoria 
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-[10px] uppercase tracking-tighter
                      ${formData.category === cat.id 
                        ? `border-slate-950 ${cat.bg} text-white shadow-md` 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${formData.category === cat.id ? 'bg-white' : cat.bg}`} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Data e Hora */}
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

            {/* Campo Descrição */}
            <div>
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                <AlignLeft size={14} /> Descrição Detalhada
              </label>
              <textarea
                rows={4}
                placeholder="Informações adicionais, valores ou requisitos..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Botão Salvar */}
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-slate-950 text-white rounded-2xl p-5 font-black uppercase tracking-[0.2em] text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center cursor-pointer gap-3 disabled:opacity-50"
            >
              {loading ? "A processar..." : (
                <div className="lg:text-[12px] text-[10px] flex items-center gap-2">
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