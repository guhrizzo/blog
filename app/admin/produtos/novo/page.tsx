"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Toaster, toast } from "sonner";

// Firebase
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function NovoProduto() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);

  const [produto, setProduto] = useState({
    nome: "",
    preco: "",
    categoria: "",
    descricao: "",
    linkCompra: "",
    imagem: null as File | null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else setVerificandoAcesso(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!produto.imagem) { setPreview(null); return; }
    const url = URL.createObjectURL(produto.imagem);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [produto.imagem]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!produto.imagem) return toast.warning("Adicione uma foto do produto.");
    
    setEnviando(true);
    const toastId = toast.loading("Cadastrando produto...");

    try {
      const file = produto.imagem;
      const storageRef = ref(storage, `produtos/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const urlImagem = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "produtos"), {
        nome: produto.nome,
        preco: produto.preco,
        categoria: produto.categoria,
        descricao: produto.descricao,
        linkCompra: produto.linkCompra,
        imagem_URL: urlImagem,
        createdAt: serverTimestamp(),
      });

      toast.success("Produto adicionado ao catálogo!", { id: toastId });
      router.push("/admin");
    } catch (error: any) {
      toast.error("Erro: " + error.message, { id: toastId });
    } finally {
      setEnviando(false);
    }
  };

  if (verificandoAcesso) return <div className="p-20 text-center italic">Verificando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Toaster richColors />
      
      <nav className="bg-white border-b border-slate-200 p-4 mb-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/admin" className="text-sm font-bold text-slate-500 hover:text-blue-600">← Voltar</Link>
          <h1 className="font-bold text-slate-800">Novo Produto</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Foto do Produto */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            <label className="block text-sm font-bold text-slate-700 uppercase mb-4">Imagem do Produto</label>
            <div className="relative group mx-auto w-64 h-64 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden hover:border-blue-500 transition-all">
              {preview ? (
                <img src={preview} className="object-cover w-full h-full" alt="Preview" />
              ) : (
                <span className="text-slate-400 text-sm">Clique para subir</span>
              )}
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={e => setProduto({...produto, imagem: e.target.files?.[0] || null})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {/* Nome */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">Nome do Produto</label>
              <input 
                className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 text-slate-900 focus:ring-blue-500/20"
                type="text" 
                placeholder="Ex: Coldre Kydex G19"
                value={produto.nome}
                onChange={e => setProduto({...produto, nome: e.target.value})}
                required 
              />
            </div>

            {/* Preço */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">Preço (R$)</label>
              <input 
                className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 text-slate-900 focus:ring-blue-500/20"
                type="text" 
                placeholder="Ex: 250,00 ou Sob Consulta"
                value={produto.preco}
                onChange={e => setProduto({...produto, preco: e.target.value})}
                required 
              />
            </div>

            {/* Categoria */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
              <select 
                className="w-full p-3 bg-slate-50 rounded-xl text-slate-900 border-none outline-none focus:ring-2 focus:ring-blue-500/20"
                value={produto.categoria}
                onChange={e => setProduto({...produto, categoria: e.target.value})}
                required
              >
                <option value="">Selecione...</option>
                <option value="Pistolas">Pistolas</option>
                <option value="Revólveress">Revólveres</option>
                <option value="Rifles-e-Carabinas">Rifles e Carabinas</option>
                <option value="Espingardas">Espingardas</option>
              </select>
            </div>

            
          </div>

          {/* Descrição */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">Descrição Curta</label>
            <textarea 
              className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none h-32 focus:ring-2 text-slate-900 focus:ring-blue-500/20"
              placeholder="Descreva as especificações do produto..."
              value={produto.descricao}
              onChange={e => setProduto({...produto, descricao: e.target.value})}
              required
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={enviando}
            className={`w-full py-4 rounded-2xl font-bold text-white cursor-pointer transition-all ${enviando ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
          >
            {enviando ? "Salvando..." : "Confirmar Cadastro"}
          </button>
        </form>
      </main>
    </div>
  );
}