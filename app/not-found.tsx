"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center font-sans">
      {/* Ícone de Alerta Animado */}
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-yellow-200 opacity-20"></div>
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl shadow-slate-200">
          <svg
            className="h-12 w-12 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>

      {/* Texto de Erro */}
      <h1 className="text-8xl font-black text-slate-300">404</h1>
      <h2 className="mt-4 text-3xl font-extrabold text-slate-900">
        Página não encontrada
      </h2>
      <p className="mt-4 max-w-md text-lg text-slate-500">
        O conteúdo que você está procurando não existe ou foi movido para um novo endereço.
      </p>

      {/* Botões de Ação */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center gap-2 cursor-pointer rounded-2xl bg-white border border-slate-200 px-8 py-4 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-yellow-500 active:scale-95"
        >
          Ir para o Início
        </Link>
      </div>

      {/* Rodapé */}
      <div className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-400">
        © {new Date().getFullYear()} Grupo Protect. Segurança em primeiro lugar.
      </div>
    </div>
  );
}