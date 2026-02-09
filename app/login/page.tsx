"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setCarregando(true);
        setErro(null);

        try {
            await signInWithEmailAndPassword(auth, email, senha);
            router.push("/admin");
        } catch (error: any) {
            if (error.code === 'auth/invalid-credential') {
                setErro("E-mail ou senha incorretos.");
            } else if (error.code === 'auth/too-many-requests') {
                setErro("Muitas tentativas falhadas. Tente mais tarde.");
            } else {
                setErro("Erro ao aceder ao painel administrativo.");
            }
        } finally {
            setCarregando(false);
        }
    };

    // Função para Recuperação de Senha com Verificação de Cadastro
    const handleEsqueciSenha = async () => {
        if (!email) {
            setErro("Introduza o seu e-mail acima para verificar o cadastro.");
            return;
        }

        const toastId = toast.loading("Verificando cadastro no sistema...");
        
        try {
            // Verifica se o e-mail existe no Firebase Auth
            const metodos = await fetchSignInMethodsForEmail(auth, email);

            if (metodos.length === 0) {
                toast.error("Este e-mail não está cadastrado no sistema.", { id: toastId });
                setErro("E-mail não encontrado.");
                return;
            }

            // Se existir, envia o reset
            await sendPasswordResetEmail(auth, email);
            toast.success("E-mail de recuperação enviado com sucesso!", { id: toastId });
            setErro(null);
            
        } catch (error: any) {
            console.error("Erro ao recuperar:", error.code);
            // Se a proteção contra enumeração estiver ativa no Firebase, ele cai aqui ou retorna lista vazia
            toast.error("Não foi possível processar a recuperação agora.", { id: toastId });
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 font-sans">
            <Toaster position="top-center" richColors />
            <div className="w-full max-w-100">
                
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 border border-yellow-600/20 shadow-lg">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Grupo <span className="text-yellow-500">Protect</span></h2>
                    <p className="mt-2 text-slate-500">Painel Administrativo</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
                    
                    {erro && (
                        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
                            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {erro}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">E-mail Corporativo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-bold text-slate-700">Sua Senha</label>
                                <button 
                                    type="button"
                                    onClick={handleEsqueciSenha}
                                    className="text-xs font-semibold text-yellow-600 hover:text-yellow-700 cursor-pointer underline decoration-dotted"
                                >
                                    Esqueceu-se da senha?
                                </button>
                            </div>
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={carregando}
                            className={`w-full rounded-2xl py-4 text-lg font-bold text-white transition-all ${
                                carregando ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-yellow-500 active:scale-95 shadow-md"
                            }`}
                        >
                            {carregando ? "A carregar..." : "Entrar no Painel"}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-slate-100 pt-6">
                        <Link href="https://clube-de-tiro.vercel.app/home" className="text-sm font-medium text-slate-400 hover:text-slate-600 transition">
                            ← Voltar para o site público
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}