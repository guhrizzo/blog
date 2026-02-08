"use client";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-2 bg-yellow-500 rounded-full" />
            <h1 className="text-xl font-bold text-slate-900">Grupo <span className="text-yellow-600">Protect</span></h1>
          </div>
          <button 
            onClick={() => signOut(auth).then(() => router.push("/login"))}
            className="text-sm font-semibold text-red-500 hover:text-red-700 cursor-pointer p-2 rounded-full w-16 bg-transparent hover:bg-red-200 border border-red-400 hover:border-red-400/50 transition-all"
          >
            Sair
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900">Bem-vindo ao <span className="text-yellow-500">Painel</span></h2>
          <p className="text-slate-500 mt-2 text-lg">O que deseja fazer hoje no portal do Grupo Protect?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card Criar */}
          <Link href="/admin/novo" className="group relative overflow-hidden bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Criar Notícia</h3>
              <p className="text-slate-500">Escreva e publique novos conteúdos com imagens e formatação.</p>
            </div>
            <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg className="w-24 h-24 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path></svg>
            </div>
          </Link>

          {/* Card Gerenciar */}
          <Link href="/admin/posts" className="group relative overflow-hidden bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className="relative z-10 text-white">
              <div className="w-14 h-14 bg-slate-800 text-yellow-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Gerenciar Posts</h3>
              <p className="text-slate-400">Edite notícias existentes ou remova publicações antigas.</p>
            </div>
            <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path></svg>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}