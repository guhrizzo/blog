"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [senhaVisivel, setSenhaVisivel] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setCarregando(true);
        setErro(null);

        try {
            await signInWithEmailAndPassword(auth, email, senha);
            router.push("/admin");
        } catch (error: any) {
            if (error.code === "auth/invalid-credential") {
                setErro("E-mail ou senha incorretos.");
            } else if (error.code === "auth/too-many-requests") {
                setErro("Muitas tentativas falhadas. Tente mais tarde.");
            } else {
                setErro("Erro ao aceder ao painel administrativo.");
            }
        } finally {
            setCarregando(false);
        }
    };

    const handleEsqueciSenha = async () => {
        if (!email) {
            setErro("Introduza o seu e-mail acima para verificar o cadastro.");
            return;
        }

        const toastId = toast.loading("Verificando cadastro no sistema...");

        try {
            const metodos = await fetchSignInMethodsForEmail(auth, email);

            if (metodos.length === 0) {
                toast.error("Este e-mail não está cadastrado no sistema.", { id: toastId });
                setErro("E-mail não encontrado.");
                return;
            }

            await sendPasswordResetEmail(auth, email);
            toast.success("E-mail de recuperação enviado com sucesso!", { id: toastId });
            setErro(null);
        } catch (error: any) {
            console.error("Erro ao recuperar:", error.code);
            toast.error("Não foi possível processar a recuperação agora.", { id: toastId });
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 px-6 font-sans">
            <Toaster position="top-center" richColors />
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 shadow-lg shadow-yellow-400/30">
                        <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Grupo <span className="text-yellow-500">Protect</span>
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-500">Painel Administrativo</p>
                </div>

                <div className="rounded-3xl border border-white/60 bg-white px-8 py-9 shadow-2xl shadow-slate-300/40">

                    {erro && (
                        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
                            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {erro}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* E-mail */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                E-mail Corporativo
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition"
                                required
                            />
                        </div>

                        {/* Senha */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-slate-700">Senha</label>
                                <button
                                    type="button"
                                    onClick={handleEsqueciSenha}
                                    className="text-xs font-semibold text-yellow-600 hover:text-yellow-700 cursor-pointer underline decoration-dotted transition"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={senhaVisivel ? "text" : "password"}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setSenhaVisivel((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                    tabIndex={-1}
                                    aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {senhaVisivel ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={carregando}
                            className={`w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all ${
                                carregando
                                    ? "bg-slate-300 cursor-not-allowed"
                                    : "bg-slate-900 hover:bg-yellow-500 active:scale-95 shadow-md cursor-pointer"
                            }`}
                        >
                            {carregando ? "Entrando..." : "Entrar no Painel"}
                        </button>
                    </form>

                    <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                        <Link
                            href="https://clube-de-tiro.vercel.app/home"
                            className="text-xs font-medium text-slate-400 hover:text-slate-600 transition"
                        >
                            ← Voltar para o site público
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}