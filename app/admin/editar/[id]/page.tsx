"use client";

import React, { useState, useEffect, FormEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";

// Notificações Profissionais
import { Toaster, toast } from "sonner";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

export default function EditarPost() {
  const router = useRouter();
  const { id } = useParams();
  
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [imagemNova, setImagemNova] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [post, setPost] = useState({
    titulo: "",
    categoria: "",
    data: "",
    conteudo: "",
    imagem_URL: "",
  });

  // 1. Carregar os dados atuais do Post
  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "noticias", id as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const dados = snap.data();
          setPost({
            titulo: dados.titulo,
            categoria: dados.categoria,
            data: dados.data,
            conteudo: dados.conteudo,
            imagem_URL: dados.imagem_URL,
          });
          setPreview(dados.imagem_URL);
        } else {
          toast.error("Post não encontrado.");
          router.push("/admin/posts");
        }
      } catch (error) {
        toast.error("Erro ao carregar dados do post.");
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, [id, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEnviando(true);
    const toastId = toast.loading("Atualizando publicação...");

    try {
      let finalURL = post.imagem_URL;

      if (imagemNova) {
        const storageRef = ref(storage, `noticias/${Date.now()}_${imagemNova.name}`);
        const snapshot = await uploadBytes(storageRef, imagemNova);
        finalURL = await getDownloadURL(snapshot.ref);
      }

      const docRef = doc(db, "noticias", id as string);
      await updateDoc(docRef, {
        titulo: post.titulo,
        categoria: post.categoria,
        data: post.data,
        conteudo: post.conteudo,
        imagem_URL: finalURL,
      });

      toast.success("Alterações salvas com sucesso!", { id: toastId });
      
      // Pequeno delay para o usuário ver o feedback antes de voltar
      setTimeout(() => router.push("/admin/posts"), 1000);
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message, { id: toastId });
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-yellow-500 mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Buscando informações do post...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      <Toaster position="top-right" richColors />

      {/* Navbar Interna */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-2 bg-yellow-500 rounded-full" />
            <h1 className="text-xl font-bold tracking-tight">Grupo <span className="text-yellow-600">Protect</span></h1>
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 cursor-pointer transition hover:bg-slate-50 hover:text-slate-800 shadow-sm"
          >
            Cancelar Edição
          </button>
        </div>
      </nav>

      <main className="mx-auto mt-10 max-w-4xl px-6">
        
        {/* HEADER */}
        <div className="mb-10 flex flex-col gap-6">
          <Link
            href="/admin/posts"
            className="group flex w-fit items-center gap-2 text-sm font-bold text-slate-400 transition-all hover:text-yellow-600"
          >
            <span className="flex h-8  items-center justify-center rounded-lg group-hover:border-yellow-200 transition-all">
                ← Voltar para a Lista
            </span>
            
          </Link>

          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Editar <span className="text-yellow-500">Notícia</span></h2>
            <p className="text-slate-500 text-lg italic opacity-80">Atualize as informações do conteúdo selecionado.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card de Informações */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black text-slate-400 uppercase tracking-widest">Título da Publicação</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-yellow-500 focus:bg-white focus:ring-4 focus:ring-yellow-500/10"
                  type="text"
                  value={post.titulo}
                  onChange={e => setPost({ ...post, titulo: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-yellow-500 focus:bg-white focus:ring-4 focus:ring-yellow-500/10"
                  type="text"
                  value={post.categoria}
                  onChange={e => setPost({ ...post, categoria: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black text-slate-400 uppercase tracking-widest">Data Publicada</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-yellow-500 focus:bg-white focus:ring-4 focus:ring-yellow-500/10"
                  type="date"
                  value={post.data}
                  onChange={e => setPost({ ...post, data: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Área da Imagem */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
             <label className="mb-4 block text-xs font-black text-slate-400 uppercase tracking-widest">Imagem de Capa (Clique para trocar)</label>
             <div className="relative group h-72 w-full rounded-3xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 hover:border-yellow-500 transition-all duration-300">
                <img src={preview || ""} alt="Preview" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all backdrop-blur-[2px]">
                   <div className="bg-white p-3 rounded-full shadow-xl mb-2">
                     <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                   </div>
                   <span className="text-white font-bold text-sm uppercase tracking-tighter">Substituir Imagem Atual</span>
                </div>

                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImagemNova(file);
                      setPreview(URL.createObjectURL(file));
                      toast.info("Nova imagem selecionada!");
                    }
                  }}
                />
             </div>
          </div>

          {/* Editor Quill */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <label className="mb-4 block text-xs font-black text-slate-400 uppercase tracking-widest">Corpo da Matéria</label>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <ReactQuill
                theme="snow"
                value={post.conteudo}
                onChange={(content) => setPost({ ...post, conteudo: content })}
                className="bg-white min-h-[300px]"
              />
            </div>
          </div>

          {/* BOTÃO SALVAR */}
          <div className="flex justify-end pb-12">
            <button 
              type="submit"
              disabled={enviando}
              className="group relative inline-flex items-center cursor-pointer justify-center px-12 py-4 font-bold text-white transition-all duration-200 bg-slate-900 font-pj rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 hover:bg-yellow-500 hover:shadow-xl hover:shadow-yellow-500/20 active:scale-95"
            >
              {enviando ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Salvando...
                </span>
              ) : "Salvar Alterações"}
            </button>
          </div>

        </form>
      </main>

      <footer className="w-full text-center text-xs text-slate-400 border-t border-slate-200 py-10 mt-10">
        <p>© {new Date().getFullYear()} <span className="font-bold text-slate-600 uppercase tracking-widest">Grupo Protect</span></p>
      </footer>
    </div>
  );
}