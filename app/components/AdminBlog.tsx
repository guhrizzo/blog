"use client";

import React, { useState, useEffect, FormEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link"; // Importante para o botão de retorno
import Button from "./Button";
import { Toaster, toast } from "sonner";

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
    if (!post.imagem) {
      return toast.warning("Quase lá! Selecione uma imagem de capa.");
    }
    setEnviando(true);
    // Inicia um toast de carregamento
    const toastId = toast.loading("Publicando sua notícia...");

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

      // Atualiza o toast para sucesso
      toast.success("Sucesso! Notícia publicada no portal.", { id: toastId });
      setPost({ titulo: "", categoria: "", data: "", conteudo: "", imagem: null });
      router.push("/admin/posts"); // Redireciona para a lista após publicar
    } catch (error: any) {
      toast.error("Ops! Erro ao publicar: " + error.message, { id: toastId });
    } finally {
      setEnviando(false);
    }
  };

  if (!isClient || verificandoAcesso) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="animate-pulse font-medium text-lg italic">Grupo Protect: Autenticando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50  font-sans text-slate-900">
      <Toaster position="top-right" richColors closeButton />
      {/* Navbar Interna */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-2 bg-yellow-500 rounded-full" />
            <h1 className="text-xl font-bold tracking-tight">Grupo <span className="text-yellow-600">Protect</span></h1>
          </div>
          <button
            onClick={() => {
              toast.promise(signOut(auth), {
                loading: 'Saindo...',
                success: 'Até logo!',
                error: 'Erro ao sair',
              });
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm"
          >
            Sair do Painel
          </button>
        </div>
      </nav>

      <main className="mx-auto mt-10 max-w-4xl px-6">

        {/* BOTÃO DE RETORNO E HEADER */}
        <div className="mb-10 flex flex-col gap-6">
          <Link
            href="/admin"
            className="group flex w-fit items-center gap-3 text-sm font-bold text-slate-500 transition-all hover:text-yellow-600"
          >

            ← Voltar ao Dashboard
          </Link>

          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Nova <span className="text-yellow-500">Notícia</span></h2>
            <p className="text-slate-500 text-lg">Crie conteúdos exclusivos para o portal do Grupo Protect.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card de Informações */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700 uppercase tracking-wider">Título do Post</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10"
                  type="text"
                  placeholder="Título aqui..."
                  value={post.titulo}
                  onChange={e => setPost({ ...post, titulo: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 uppercase tracking-wider">Categoria</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10"
                  type="text"
                  placeholder="Ex: Treinamentos, Segurança..."
                  value={post.categoria}
                  onChange={e => setPost({ ...post, categoria: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 uppercase tracking-wider">Data</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10"
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
            <label className="mb-4 block text-sm font-bold text-slate-700 uppercase tracking-wider">Imagem de Capa</label>
            <div className="group relative flex min-h-60 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-yellow-400 hover:bg-yellow-50/20">

              {preview ? (
                <div className="relative h-full w-full p-4">
                  <img src={preview} alt="Preview" className="max-h-80 w-full rounded-2xl object-cover shadow-2xl" />
                  <button
                    type="button"
                    onClick={() => setPost({ ...post, imagem: null })}
                    className="absolute top-8 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-10">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400 group-hover:text-yellow-500 group-hover:scale-110 transition-all">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <p className="text-base font-bold text-slate-700">Clique para selecionar</p>
                  <p className="text-sm text-slate-400">Arraste a foto da notícia aqui</p>
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

          {/* Editor de Conteúdo */}
          {/* Editor de Conteúdo */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <label className="mb-4 block text-sm font-bold text-slate-700 uppercase tracking-wider">
              Conteúdo
            </label>
            {/* Removido o overflow-hidden daqui para não cortar o menu de link */}
            <div className="quill-wrapper rounded-2xl border border-slate-200 bg-white">
              <ReactQuill
                theme="snow"
                value={post.conteudo}
                onChange={(content) => setPost({ ...post, conteudo: content })}
                modules={modules}
                placeholder="Escreva os detalhes da notícia..."
                className="min-h-75" // Use colchetes para valores customizados no Tailwind
              />
            </div>
          </div>

          {/* Botão Glow Dourado que criamos */}
          <div className="flex justify-end pb-10">
            <Button type="submit" loading={enviando}>
              Publicar notícia
            </Button>
          </div>
        </form>
      </main>

      {/* Footer Dinâmico Grupo Protect */}
      <footer className="max-w-screen text-center text-sm text-slate-400 border-t border-slate-200 py-10 ">
        <p>© {new Date().getFullYear()} <span className="font-bold text-slate-600">Grupo Protect</span>. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}