"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Edit, Plus, Package, Loader2, ExternalLink } from "lucide-react";
import { toast, Toaster } from "sonner";

type Produto = {
    id: string;
    nome: string;
    preco: string;
    categoria: string;
    imagem_URL: string;
};

export default function GerenciarProdutos() {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "produtos"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Produto[];
            setProdutos(pData);
            setCarregando(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Tem certeza que deseja excluir o produto "${nome}"?`)) return;

        try {
            await deleteDoc(doc(db, "produtos", id));
            toast.success("Produto removido com sucesso!");
        } catch (error) {
            toast.error("Erro ao remover produto.");
        }
    };

    return (
  <div className="min-h-screen bg-slate-50 font-sans pb-20">
    <Toaster richColors />

    {/* Header */}
    <nav className="bg-white border-b border-slate-200 p-4 md:p-6 mb-6 md:mb-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
          >
            ← Voltar ao Painel
          </Link>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
            Gerenciar <span className="text-blue-500">Produtos</span>
          </h1>
        </div>

        <Link
          href="/admin/produtos/novo"
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 w-full md:w-auto"
        >
          <Plus size={20} /> Add Novo Item
        </Link>
      </div>
    </nav>

    <main className="max-w-6xl mx-auto px-4 md:px-6">
      {carregando ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-yellow-500" size={40} />
        </div>
      ) : produtos.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 md:p-20 text-center border border-slate-200">
          <Package className="mx-auto text-slate-200 mb-4" size={64} />
          <p className="text-slate-500 font-medium text-lg">
            Nenhum produto cadastrado no catálogo.
          </p>
        </div>
      ) : (
        <>
          {/* ================= DESKTOP (TABELA) ================= */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Produto
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Categoria
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Preço
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {produtos.map((produto) => (
                  <tr
                    key={produto.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <Image
                            src={produto.imagem_URL}
                            alt={produto.nome}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="font-bold text-slate-800 group-hover:text-yellow-600 transition-colors">
                          {produto.nome}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        {produto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                      R$ {produto.preco}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Link
                          href={`/admin/produtos/editar/${produto.id}`}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(produto.id, produto.nome)
                          }
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= MOBILE (CARDS) ================= */}
          <div className="md:hidden space-y-4">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <Image
                      src={produto.imagem_URL}
                      alt={produto.nome}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">
                      {produto.nome}
                    </h3>
                    <span className="inline-block mt-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                      {produto.categoria}
                    </span>
                    <p className="mt-2 font-mono font-bold text-slate-700">
                      R$ {produto.preco}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 border-t pt-3">
                  <Link
                    href={`/admin/produtos/editar/${produto.id}`}
                    className="flex items-center gap-1 text-sm px-3 py-2 bg-blue-50 text-blue-600 rounded-lg"
                  >
                    <Edit size={16} /> Editar
                  </Link>
                  <button
                    onClick={() =>
                      handleDelete(produto.id, produto.nome)
                    }
                    className="flex items-center gap-1 text-sm px-3 py-2 bg-red-50 text-red-600 rounded-lg"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  </div>
);

}