"use client";

import React, { useState, useEffect, FormEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "./Button";

// Imports do Firebase
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, signOut } from "firebase/auth";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

type PostForm = {
  titulo: string;
  categoria: string;
  data: string;
  conteudo: string;
  imagem: File | null;
};

export default function AdminBlog() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const [post, setPost] = useState<PostForm>({
    titulo: "",
    categoria: "",
    data: "",
    conteudo: "",
    imagem: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setVerificandoAcesso(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Preview da imagem
  useEffect(() => {
    if (!post.imagem) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(post.imagem);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [post.imagem]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "blockquote", "code-block"],
      ["clean"],
    ],
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!post.imagem) return alert("Selecione uma imagem de capa!");
    setEnviando(true);

    try {
      const file = post.imagem;
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `noticias/${fileName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const urlDaImagem = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "noticias"), {
        titulo: post.titulo,
        categoria: post.categoria,
        data: post.data,
        conteudo: post.conteudo,
        imagem_URL: urlDaImagem,
        createdAt: serverTimestamp(),
      });

      alert("Publicado com sucesso!");
      setPost({ titulo: "", categoria: "", data: "", conteudo: "", imagem: null });
      router.refresh();
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (!isClient || verificandoAcesso) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="animate-pulse font-medium">Autenticando administrador...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      {/* Navbar Interna */}
      <nav className="sticky top-0 z-1000 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-2 bg-yellow-500 rounded-full" />
            <h1 className="text-xl font-bold tracking-tight">Portal <span className="text-yellow-600">Admin</span></h1>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 cursor-pointer transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            Sair do Painel
          </button>
        </div>
      </nav>

      <main className="mx-auto mt-10 max-w-4xl px-6">
        {/* Header do Formulário */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">Nova Notícia</h2>
          <p className="text-slate-500">Preencha os campos abaixo para publicar no blog.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card Principal */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* Input Titulo - Span full width */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Título do Post</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  type="text"
                  placeholder="Ex: Novo lançamento da Taurus 2026"
                  value={post.titulo}
                  onChange={e => setPost({ ...post, titulo: e.target.value })}
                  required
                />
              </div>

              {/* Input Categoria */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Categoria</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  type="text"
                  placeholder="Eventos, Produtos..."
                  value={post.categoria}
                  onChange={e => setPost({ ...post, categoria: e.target.value })}
                  required
                />
              </div>

              {/* Input Data */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Data de Exibição</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition cursor-pointerfocus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  type="date"
                  value={post.data}
                  onChange={e => setPost({ ...post, data: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Card de Imagem */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <label className="mb-4 block text-sm font-bold text-slate-700">Imagem de Capa</label>
            <div className="group relative flex min-h-50 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-yellow-400 hover:bg-yellow-50/30">

              {preview ? (
                <div className="relative h-full w-full p-4">
                  <img src={preview} alt="Preview" className="max-h-64 w-full rounded-xl object-cover shadow-lg" />
                  <button
                    type="button"
                    onClick={() => setPost({ ...post, imagem: null })}
                    className="absolute top-6 right-6 rounded-full bg-red-500 p-2 w-10 text-white transition-all ease-in-out duration-200 cursor-pointer shadow-xl z-99 hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6">
                  <svg className="mb-3 h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p className="text-sm font-medium text-slate-600">Clique para selecionar ou arraste a foto</p>
                  <p className="text-xs text-slate-400">PNG, JPG ou WEBP (Max. 5MB)</p>
                </div>
              )}

              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="image/*"
                onChange={e => setPost({ ...post, imagem: e.target.files ? e.target.files[0] : null })}
                required={!preview}
              />
            </div>
          </div>

          {/* Editor de Texto */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <label className="mb-4 block text-sm font-bold text-slate-700">Conteúdo da Notícia</label>
            <div className="min-h-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <ReactQuill
                theme="snow"
                value={post.conteudo}
                onChange={(content) => setPost({ ...post, conteudo: content })}
                modules={modules}
                placeholder="Conte a história completa aqui..."
              />
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="flex justify-end">
            <Button type="submit" loading={enviando}>
              Publicar notícia
            </Button>

          </div>
        </form>
      </main>
    </div>
  );
}