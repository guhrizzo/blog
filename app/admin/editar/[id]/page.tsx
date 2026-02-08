"use client";

import React, { useState, useEffect, FormEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
        }
      } catch (error) {
        console.error("Erro ao carregar:", error);
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, [id]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEnviando(true);

    try {
      let finalURL = post.imagem_URL;

      // Se o usuário escolheu uma nova imagem, faz upload dela
      if (imagemNova) {
        const storageRef = ref(storage, `noticias/${Date.now()}_${imagemNova.name}`);
        const snapshot = await uploadBytes(storageRef, imagemNova);
        finalURL = await getDownloadURL(snapshot.ref);
      }

      // Atualiza o documento no Firestore
      const docRef = doc(db, "noticias", id as string);
      await updateDoc(docRef, {
        titulo: post.titulo,
        categoria: post.categoria,
        data: post.data,
        conteudo: post.conteudo,
        imagem_URL: finalURL,
      });

      alert("Post atualizado com sucesso!");
      router.push("/admin/posts"); // Volta para a lista de gerenciamento
    } catch (error: any) {
      alert("Erro ao atualizar: " + error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) return <div className="p-20 text-center">Carregando dados...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <nav className="border-b bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl flex justify-between items-center">
           <h1 className="text-xl text-slate-900 font-bold">Editar Notícia <span className="text-yellow-500">#GrupoProtect</span></h1>
           <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 text-sm font-medium cursor-pointer border border-slate-400 p-2 px-4 transition-all ease-in-out duration-200 bg-transparent hover:bg-slate-700/20 rounded-full italic">← Cancelar e Voltar</button>
        </div>
      </nav>

      <main className="mx-auto mt-10 max-w-4xl px-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Inputs Básicos */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Título</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 text-slate-900 bg-slate-50 px-4 py-3 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition"
                  type="text"
                  value={post.titulo}
                  onChange={e => setPost({ ...post, titulo: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Categoria</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 text-slate-900 bg-slate-50 px-4 py-3 outline-none focus:border-yellow-500 transition"
                  type="text"
                  value={post.categoria}
                  onChange={e => setPost({ ...post, categoria: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Data</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none text-slate-900 focus:border-yellow-500 transition"
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
             <label className="mb-4 block text-sm font-bold text-slate-700">Imagem de Capa (Clique para trocar)</label>
             <div className="relative group h-64 w-full rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 hover:border-yellow-500 transition">
                <img src={preview || ""} alt="Preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                   <span className="text-white font-bold uppercase tracking-wider">Alterar Foto</span>
                </div>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImagemNova(file);
                      setPreview(URL.createObjectURL(file));
                    }
                  }}
                />
             </div>
          </div>

          {/* Editor Quill */}
          <div className="rounded-3xl border border-slate-200 bg-white text-slate-900 p-8 shadow-sm">
            <ReactQuill
              theme="snow"
              value={post.conteudo}
              onChange={(content) => setPost({ ...post, conteudo: content })}
            />
          </div>

          {/* BOTÃO GLOW DOURADO FUNCIONAL */}
          <div className="flex justify-end">
            <div className="relative group">
              <button 
                type="submit"
                disabled={enviando}
                className="relative inline-block p-px font-semibold cursor-pointer leading-6 text-white bg-slate-800 rounded-xl transition-transform duration-300 active:scale-95 disabled:opacity-50"
              >
                <span className={`absolute inset-0 rounded-xl bg-linear-to-r from-yellow-400 via-amber-500 to-yellow-600 p-0.5 transition-opacity duration-500 ${enviando ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'}`} />
                <span className="relative z-10 block px-10 py-4 rounded-xl bg-slate-950">
                  <span className="flex items-center space-x-3">
                    <span className="text-lg font-bold">{enviando ? "Salvando..." : "Salvar Alterações"}</span>
                    {enviando && <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />}
                  </span>
                </span>
              </button>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}