"use client";

import React from "react";

interface ButtonProps {
  children?: React.ReactNode;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
}

export default function Button({
  children = "Publicar notícia",
  loading = false,
  type = "button",
  onClick,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`
        group relative overflow-hidden flex items-center justify-center gap-3
        rounded-xl cursor-pointer px-12 py-4 text-lg font-semibold tracking-wide
        transition-all duration-300 ease-out
        ${loading
          ? "cursor-not-allowed bg-slate-300 text-slate-600"
          : "bg-slate-900 text-white hover:-translate-y-0.5 hover:shadow-xl hover:shadow-yellow-500/20 active:translate-y-0"}
        ${className}
      `}
    >
      {/* Energy sweep */}
      {!loading && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-linear-to-r from-transparent via-white/20 to-transparent" />
      )}

      {loading ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
          Enviando...
        </>
      ) : (
        <>
          <span className="relative z-10">{children}</span>
          <svg
            className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </>
      )}
    </button>
  );
}
