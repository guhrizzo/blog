"use client";

import React, { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

import Image from "next/image";
import Link from "next/link";

// Importando Toasts Profissionais
import { Toaster, toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";

type Noticia = {
    id: string;
    titulo: string;
    categoria: string;
    imagem_URL: string;
};

export default function GerenciarPosts() {
    const [posts, setPosts] = useState<Noticia[]>([]);
    const [carregando, setCarregando] = useState(true);

    const fetchPosts = async () => {
        setCarregando(true);
        try {
            const q = query(collection(db, "noticias"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Noticia[];
            setPosts(lista);
        } catch (error) {
            toast.error("Erro ao carregar as notícias.");
            console.error("Erro ao buscar:", error);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => { fetchPosts(); }, []);

    const handleExcluir = async (id: string, imagemURL: string) => {
        // Substituímos o confirm() nativo por um Toast de confirmação profissional
        toast("Deseja realmente excluir esta notícia?", {
            action: {
                label: "Excluir Agora",
                onClick: () => executarExclusao(id, imagemURL),
            },
            cancel: {
                label: "Cancelar",
                onClick: () => toast.dismiss(),
            },
            duration: 5000,
        });
    };

    const executarExclusao = async (id: string, imagemURL: string) => {
        const toastId = toast.loading("Removendo post...");

        try {
            // 1. Deletar do Firestore
            await deleteDoc(doc(db, "noticias", id));

            // 2. Deletar do Storage (se houver imagem)
            if (imagemURL) {
                try {
                    const imagemRef = ref(storage, imagemURL);
                    await deleteObject(imagemRef);
                } catch (e) {
                    console.warn("A imagem já não existia ou houve erro no Storage.");
                }
            }

            // 3. Atualizar UI
            setPosts(posts.filter(p => p.id !== id));
            toast.success("Post removido permanentemente!", { id: toastId });
        } catch (error) {
            toast.error("Erro técnico ao excluir post.", { id: toastId });
        }
    };

    return (
  <div className="min-h-screen bg-slate-50 font-sans">
    <Toaster position="top-center" richColors />

    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-6">

        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="group flex items-center justify-center w-11 h-11 md:w-12 md:h-12 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-yellow-600 transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              Gerenciar <span className="text-yellow-500">Posts</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest">
              Grupo Protect
            </p>
          </div>
        </div>

        <Link
          href="/admin/novo"
          className="w-full md:w-auto text-center bg-slate-900 text-white px-6 md:px-8 py-4 rounded-2xl font-bold hover:bg-yellow-500 hover:shadow-xl hover:shadow-yellow-500/20 transition-all active:scale-95"
        >
          + Novo Post
        </Link>
      </header>

      {/* LISTAGEM */}
      {carregando ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-yellow-500"></div>
          <p className="text-slate-400 font-medium animate-pulse">
            Sincronizando portal...
          </p>
        </div>
      ) : posts.length > 0 ? (

        /* ===== MOBILE & DESKTOP GRID ===== */
        <div className="grid gap-4 md:gap-5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group bg-white border border-slate-200 p-4 md:p-5 rounded-3xl shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                {/* Conteúdo */}
                <div className="flex gap-4 items-start md:items-center">
                  <div className="relative h-20 w-20 md:h-20 md:w-20 rounded-2xl overflow-hidden border border-slate-100 shadow-inner shrink-0">
                    <Image
                      src={post.imagem_URL}
                      alt={post.titulo}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md font-black uppercase tracking-wider inline-block mb-1">
                      {post.categoria}
                    </span>

                    <h3 className="font-bold text-slate-800 text-base md:text-lg line-clamp-2 md:line-clamp-1">
                      {post.titulo}
                    </h3>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3 pt-2 md:pt-0 border-t md:border-0 md:justify-end">

                  <Link
                    href={`/admin/editar/${post.id}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:p-3 text-sm md:text-base text-slate-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-2xl transition-all active:scale-95"
                  >
                    <Edit size={16} />Editar
                  </Link>

                  <button
                    onClick={() => handleExcluir(post.id, post.imagem_URL)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:p-3 text-sm md:text-base text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer rounded-2xl transition-all active:scale-95"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>

                </div>
              </div>
            </div>
          ))}
        </div>

      ) : (
        <div className="text-center py-16 md:py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 3v5h5" />
            </svg>
          </div>
          <p className="text-slate-400 font-bold">
            O portal está vazio por enquanto.
          </p>
          <p className="text-slate-300 text-sm">
            Clique em "+ Novo Post" para começar.
          </p>
        </div>
      )}
    </div>
  </div>
);

}