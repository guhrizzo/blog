"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [carregando, setCarregando] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setCarregando(true);

        try {
            await signInWithEmailAndPassword(auth, email, senha);
            router.push("/admin");
        } catch (error: any) {
            // Um erro mais amigável para o usuário
            const erroTraduzido = error.code === 'auth/invalid-credential'
                ? "E-mail ou senha incorretos."
                : "Ocorreu um erro ao acessar o painel.";
            alert(erroTraduzido);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 font-sans">
            <div className="w-full max-w-100">
                {/* Logo / Header */}
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 border border-yellow-600/20 shadow-lg ">
                        {/* Ícone de escudo para combinar com "Protect" */}
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Grupo <span className="text-yellow-500">Protect</span></h2>
                    <p className="mt-2 text-slate-500">Painel Administrativo</p>
                </div>

                {/* Card de Login */}
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">E-mail Corporativo</label>
                            <input
                                type="email"
                                placeholder="nome@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 text-slate-900 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">Sua Senha</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none text-slate-900 transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={carregando}
                            className={`
                group relative flex w-full items-center justify-center cursor-pointer rounded-2xl py-4 text-lg font-bold text-white transition-all duration-300 ease-in-out
                ${carregando
                                    ? "cursor-not-allowed bg-slate-400"
                                    : "bg-slate-900 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-200 active:scale-[0.98]"}
              `}
                        >
                            {carregando ? (
                                <div className="h-6 w-6 animate-spin rounded-full border-2  border-white border-t-transparent" />
                            ) : (
                                "Entrar no Painel"
                            )}
                        </button>
                    </form>

                    {/* Footer do Card */}
                    <div className="mt-8 text-center">
                        <Link
                            href="https://clube-de-tiro.vercel.app/home"
                            className="text-sm font-medium text-slate-400 transition hover:text-slate-600"
                        >
                            ← Voltar para o site público
                        </Link>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-slate-400">
                    © {new Date().getFullYear()} {` `}
                    <span className="font-semibold text-slate-500">Grupo Protect</span>.
                    Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}