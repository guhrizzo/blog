"use client";

import React, { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import Image from "next/image";
import Link from "next/link";

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
            console.error("Erro ao buscar:", error);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => { fetchPosts(); }, []);

    const handleExcluir = async (id: string, imagemURL: string) => {
        if (!confirm("Deseja realmente excluir esta notícia? Esta ação é permanente.")) return;

        try {
            await deleteDoc(doc(db, "noticias", id));
            if (imagemURL) {
                const imagemRef = ref(storage, imagemURL);
                await deleteObject(imagemRef).catch(e => console.log("Erro ao deletar imagem"));
            }
            setPosts(posts.filter(p => p.id !== id));
            alert("Post removido com sucesso!");
        } catch (error) {
            alert("Erro ao excluir post.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* CONTAINER CENTRALIZADO */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                
                {/* HEADER COM POSICIONAMENTO CORRIGIDO */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div className="flex items-center gap-5">
                        {/* Botão de Voltar Quadrado e Moderno */}
                        <Link
                            href="/admin"
                            className="group flex items-center justify-center w-12 h-12 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-yellow-600 hover:border-yellow-200 transition-all shadow-sm hover:shadow-md"
                            title="Voltar ao Painel"
                        >
                            <svg className="w-6 h-6 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>

                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
                                Gerenciar <span className="text-yellow-500">Posts</span>
                            </h1>
                            <p className="text-slate-500 font-medium">Controle de publicações Grupo Protect</p>
                        </div>
                    </div>

                    <Link
                        href="/admin/novo"
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-yellow-500 hover:shadow-xl hover:shadow-yellow-200 transition-all active:scale-95 whitespace-nowrap"
                    >
                        + Novo Post
                    </Link>
                </header>

                {/* LISTAGEM */}
                {carregando ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <div key={post.id} className="group bg-white border border-slate-200 p-4 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-xl hover:border-yellow-100 transition-all duration-300">
                                    <div className="flex items-center gap-5">
                                        <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                                            <Image src={post.imagem_URL} alt={post.titulo} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-black uppercase tracking-widest mb-1 inline-block">
                                                {post.categoria}
                                            </span>
                                            <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-yellow-600 transition-colors">
                                                {post.titulo}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pr-2">
                                        <Link
                                            href={`/admin/editar/${post.id}`}
                                            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Link>

                                        <button
                                            onClick={() => handleExcluir(post.id, post.imagem_URL)}
                                            className="p-3 text-slate-400 hover:text-red-600 cursor-pointer hover:bg-red-50 rounded-2xl transition-all"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                                <p className="text-slate-400">Nenhuma notícia publicada ainda.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}