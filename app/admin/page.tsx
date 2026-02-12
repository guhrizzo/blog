"use client";

import { useState, useEffect } from "react"; // Adicionado useEffect e useState
import Link from "next/link";
import { signOut, onAuthStateChanged } from "firebase/auth"; // Adicionado onAuthStateChanged
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { 
  PlusCircle, 
  Settings, 
  PackagePlus, 
  LayoutList, 
  LogOut,
  ShieldCheck
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Administrador");

  // Lógica para pegar o nome do usuário logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Se o usuário tiver um nome cadastrado (displayName), usamos ele.
        // Caso contrário, pegamos a parte antes do @ no e-mail.
        const name = user.displayName || user.email?.split('@')[0] || "Administrador";
        
        // Formata para a primeira letra ser maiúscula
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        setUserName(formattedName);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = () => {
    signOut(auth).then(() => router.push("/login"));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-2 bg-yellow-500 rounded-full" />
            <h1 className="text-xl font-bold text-slate-900">Grupo <span className="text-yellow-600">Protect</span></h1>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 cursor-pointer p-2 px-4 rounded-xl bg-transparent hover:bg-red-50 border border-red-200 transition-all"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
             <ShieldCheck className="text-yellow-500" size={32} />
             <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
               Painel de <span className="text-yellow-500">Controle</span>
             </h2>
          </div>
          {/* Nome dinâmico aplicado aqui */}
          <p className="text-slate-500 text-lg italic">
            Bem-vindo, <span className="text-slate-900 font-bold not-italic">{userName}</span>. Gerencie o conteúdo do portal do Grupo Protect.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          
          {/* SEÇÃO DE NOTÍCIAS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-2">Blog e Notícias</h3>
            <div className="grid gap-4">
              <Link href="/admin/novo" className="group flex items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                  <PlusCircle size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Nova Notícia</h4>
                  <p className="text-slate-500 text-sm">Publicar avisos e artigos</p>
                </div>
              </Link>

              <Link href="/admin/posts" className="group flex items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Settings size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Editar Notícias</h4>
                  <p className="text-slate-500 text-sm">Gerenciar postagens do blog</p>
                </div>
              </Link>
            </div>
          </div>

          {/* SEÇÃO DE PRODUTOS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-2">Catálogo de Produtos</h3>
            <div className="grid gap-4">
              <Link href="/admin/produtos/novo" className="group flex items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <PackagePlus size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Add Produto</h4>
                  <p className="text-slate-500 text-sm">Cadastrar item no inventário</p>
                </div>
              </Link>

              <Link href="/admin/produtos" className="group flex items-center gap-6 bg-white p-6 shadow-sm rounded-3xl border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-slate-800 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <LayoutList size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Gerenciar Catálogo</h4>
                  <p className="text-slate-400 text-sm">Editar preços e remover itens</p>
                </div>
              </Link>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}