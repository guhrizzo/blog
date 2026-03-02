"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Settings,
  PackagePlus,
  Video,
  Camera,
  CalendarDays,
  LayoutDashboard,
  FileText,
  Boxes,
  MessageSquare // <-- Adicionado
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Administrador");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const name = user.displayName || user.email?.split('@')[0] || "Administrador";
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="text-yellow-500" size={24} />
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">PROTECT <span className="text-yellow-600 font-black">ADMIN</span></h1>
          </div>
          <button onClick={() => signOut(auth).then(() => router.push("/login"))} className="text-sm font-bold text-red-500 hover:bg-red-50 cursor-pointer border px-4 py-2 border-red-500/30 rounded-xl transition-all">Sair</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <header className="mb-16">
          <h2 className="text-4xl font-black text-slate-900 mb-2">Painel de Gestão</h2>
          <p className="text-slate-500 italic">Olá, <span className="text-slate-900 font-bold not-italic">{userName}</span>. O que vamos atualizar hoje?</p>
        </header>

        {/* --- SEÇÃO 01: OPERACIONAL --- */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4">
            <FileText className="text-slate-400" size={20} />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Operacional e Conteúdo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AdminBlock title="Blog e Notícias" color="yellow" icon={<PlusCircle />} manageHref="/admin/posts" addHref="/admin/novo" />
            <AdminBlock title="Catálogo / Loja" color="blue" icon={<PackagePlus />} manageHref="/admin/produtos" addHref="/admin/produtos/novo" />
            <AdminBlock title="Calendário de Eventos" color="amber" icon={<CalendarDays />} manageHref="/admin/agenda/gerenciar" addHref="/admin/agenda" />
          </div>
        </section>

        {/* --- NOVA SEÇÃO 02: INTERATIVIDADE --- */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4">
            <MessageSquare className="text-slate-400" size={20} />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Interação com Usuários</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CARD DE COMENTÁRIOS */}
            <AdminBlock 
              title="Comentários" 
              color="rose" 
              icon={<MessageSquare />} 
              manageHref="/admin/comentarios" 
              addHref="/admin/comentarios" // No caso de comentários, ambos podem levar à mesma lista
            />
          </div>
        </section>

        {/* --- SEÇÃO 03: MÍDIA --- */}
        <section>
          <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4">
            <Boxes className="text-slate-400" size={20} />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Mídia e Galeria Visual</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AdminBlock title="Central de Vídeos" color="purple" icon={<Video />} manageHref="/admin/videos/gerenciar" addHref="/admin/videos" />
            <AdminBlock title="Galeria de Fotos" color="emerald" icon={<Camera />} manageHref="/admin/galeria/gerenciar" addHref="/admin/galeria" />
          </div>
        </section>
      </main>
    </div>
  );
}

function AdminBlock({ title, color, icon, manageHref, addHref }: any) {
  const colors: any = {
    yellow: "bg-yellow-50 text-yellow-600 hover:bg-yellow-500 border-yellow-300/50",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-600 border-blue-300/50",
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-500 border-amber-300/50",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-600 border-purple-300/50",
    emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 border-emerald-300/50",
    rose: "bg-rose-50 text-rose-600 hover:bg-rose-600 border-rose-300/50" // <-- Adicionado
  };

  return (
    <div className="bg-white rounded-4xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors border duration-300 ${colors[color]?.split(' ').slice(0,2).join(' ')}`}>
          {icon}
        </div>
        <h4 className="text-xl font-black text-slate-800">{title}</h4>
      </div>

      <div className="flex flex-col gap-3">
        <Link href={addHref} className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all text-sm uppercase tracking-widest">
          {title === "Comentários" ? <MessageSquare size={18} /> : <PlusCircle size={18} />} 
          {title === "Comentários" ? "Ver Recentes" : "Novo Registro"}
        </Link>
        <Link href={manageHref} className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-400 border border-slate-300 rounded-2xl font-bold hover:border-slate-500 duration-200 ease-in-out hover:text-slate-600 transition-all hover:bg-slate-400/10 text-sm uppercase tracking-widest">
          <Settings size={18} /> Gerenciar
        </Link>
      </div>
    </div>
  );
}