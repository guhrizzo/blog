"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Edit3, ArrowLeft, Save, Loader2, Tag, AlignLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

// Configuração das categorias para o Select
const categorias = [
  { id: "provas", label: "Provas", color: "#fbbf24" },
  { id: "cursos", label: "Cursos", color: "#ef4444" },
  { id: "testes", label: "Testes", color: "#3b82f6" },
  { id: "eventos", label: "Eventos", color: "#22c55e" },
];

export default function EditarEvento() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    category: "eventos",
    description: "",
  });

  // 1. Carregar dados atuais do evento
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "agenda", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Divide a string "2026-02-23T15:00:00"
          const [date, fullTime] = data.start.split("T");
          
          setFormData({
            title: data.title,
            date: date,
            time: fullTime ? fullTime.substring(0, 5) : "",
            category: data.category || "eventos",
            description: data.description || "",
          });
        } else {
          toast.error("Evento não encontrado");
          router.push("/admin/agenda/gerenciar");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar evento");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const selectedCat = categorias.find(c => c.id === formData.category);
      const startDateTime = `${formData.date}T${formData.time || "00:00"}:00`;
      const docRef = doc(db, "agenda", id as string);

      await updateDoc(docRef, {
        title: formData.title,
        start: startDateTime,
        allDay: !formData.time,
        category: formData.category,
        description: formData.description,
        backgroundColor: selectedCat?.color, // Cor para o FullCalendar
        borderColor: selectedCat?.color,
      });

      toast.success("Evento atualizado com sucesso!");
      
      setTimeout(() => {
        router.push("/admin/agenda/gerenciar");
      }, 800);
    } catch (error) {
      toast.error("Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-12">
      <div className="max-w-2xl mx-auto">
        <Link 
          href="/admin/agenda/gerenciar" 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 font-bold text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Voltar para Gestão
        </Link>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          {/* HEADER */}
          <div className="bg-slate-900 p-8 text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg">
              <Edit3 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter">Editar Evento</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Refinar compromisso na agenda</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="p-8 md:p-12 space-y-6">
            {/* TÍTULO */}
            <div>
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Título do Evento
              </label>
              <input
                required
                type="text"
                placeholder="Ex: Campeonato de IPSC"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* CATEGORIA */}
            <div>
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                <Tag size={14} /> Categoria
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 outline-none appearance-none cursor-pointer"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* DATA E HORA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Data</label>
                <input
                  required
                  type="date"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Horário (Opcional)</label>
                <input
                  type="time"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            {/* DESCRIÇÃO */}
            <div>
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                <AlignLeft size={14} /> Descrição / Detalhes
              </label>
              <textarea
                rows={4}
                placeholder="Detalhes adicionais sobre o evento..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* BOTÃO SALVAR */}
            <button
              disabled={saving}
              type="submit"
              className="w-full bg-amber-500 text-slate-950 rounded-2xl p-5 font-black uppercase tracking-[0.2em] text-sm hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}