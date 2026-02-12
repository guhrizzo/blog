"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import { Loader2, Save, ArrowLeft, Image as ImageIcon } from "lucide-react";

// Firebase
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function EditarProduto() {
  const router = useRouter();
  const { id } = useParams();
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [novaImagem, setNovaImagem] = useState<File | null>(null);

  const [produto, setProduto] = useState({
    nome: "",
    preco: "",
    categoria: "",
    descricao: "",
    linkCompra: "",
    imagem_URL: "",
  });

  // Verifica Autenticação e Busca Dados do Produto
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      
      try {
        const docRef = doc(db, "produtos", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduto({
            nome: data.nome,
            preco: data.preco,
            categoria: data.categoria,
            descricao: data.descricao,
            linkCompra: data.linkCompra,
            imagem_URL: data.imagem_URL,
          });
          setPreview(data.imagem_URL);
        } else {
          toast.error("Produto não encontrado.");
          router.push("/admin/produtos");
        }
      } catch (error) {
        toast.error("Erro ao carregar dados.");
      } finally {
        setCarregando(false);
      }
    });

    return () => unsubscribe();
  }, [id, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const toastId = toast.loading("Atualizando produto...");

    try {
      let urlFinal = produto.imagem_URL;

      // Se o usuário selecionou uma nova imagem, faz o upload
      if (novaImagem) {
        const storageRef = ref(storage, `produtos/${Date.now()}_${novaImagem.name}`);
        const snapshot = await uploadBytes(storageRef, novaImagem);
        urlFinal = await getDownloadURL(snapshot.ref);
      }

      const docRef = doc(db, "produtos", id as string);
      await updateDoc(docRef, {
        nome: produto.nome,
        preco: produto.preco,
        categoria: produto.categoria,
        descricao: produto.descricao,
        linkCompra: produto.linkCompra,
        imagem_URL: urlFinal,
      });

      toast.success("Produto atualizado com sucesso!", { id: toastId });
      router.push("/admin/produtos");
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message, { id: toastId });
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-yellow-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Toaster richColors />
      
      <nav className="bg-white border-b border-slate-200 p-6 mb-10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/admin/produtos" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-yellow-600 transition-all">
            <ArrowLeft size={18} /> Voltar à lista
          </Link>
          <h1 className="font-black text-slate-800 tracking-tight">Editar <span className="text-blue-500">Produto</span></h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Foto do Produto */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            <label className="block text-sm font-bold text-slate-700 uppercase mb-4 tracking-wider">Imagem do Produto</label>
            <div className="relative group mx-auto w-64 h-64 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden hover:border-blue-500 transition-all bg-slate-50">
              {preview ? (
                <img src={preview} className="object-cover w-full h-full" alt="Preview" />
              ) : (
                <ImageIcon className="text-slate-300" size={48} />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-xs font-bold uppercase">Trocar Imagem</p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setNovaImagem(file);
                    setPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">Nome do Produto</label>
              <input 
                className="w-full p-3 bg-slate-50 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                type="text" 
                value={produto.nome}
                onChange={e => setProduto({...produto, nome: e.target.value})}
                required 
              />
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">Preço (R$)</label>
              <input 
                className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 text-slate-900 focus:ring-blue-500/20"
                type="text" 
                value={produto.preco}
                onChange={e => setProduto({...produto, preco: e.target.value})}
                required 
              />
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
              <select 
                className="w-full p-3 bg-slate-50 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                value={produto.categoria}
                onChange={e => setProduto({...produto, categoria: e.target.value})}
                required
              >
                <option value="Pistolas">Pistolas</option>
                <option value="Revólveres">Revólveres</option>
                <option value="Rifles e Carabinas">Rifles e Carabinas</option>
                <option value="Espingardas">Espingardas</option>
                <option value="Acessórios">Acessórios</option>
                <option value="Cursos">Cursos</option>
              </select>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
            <textarea 
              className="w-full p-3 bg-slate-50 rounded-xl text-slate-900 outline-none h-32 focus:ring-2 focus:ring-blue-500/20"
              value={produto.descricao}
              onChange={e => setProduto({...produto, descricao: e.target.value})}
              required
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={enviando}
            className="w-full py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-blue-600 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xl"
          >
            {enviando ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {enviando ? "Salvando Alterações..." : "Salvar Produto"}
          </button>
        </form>
      </main>
    </div>
  );
}