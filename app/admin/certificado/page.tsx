"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Download,
  Loader2,
  RotateCcw,
  Eye,
  EyeOff,
  Award,
  User,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast, Toaster } from "sonner";

type FormData = {
  nome: string;
  cpf: string;
  data: string;
};

type Field = {
  name: keyof FormData;
  label: string;
  placeholder: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  type: string;
  maxLength?: number;
};

export default function GerarCertificado() {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    cpf: "",
    data: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const certificadoRef = useRef<HTMLDivElement>(null);

  const formatarCPF = (value: string) =>
    value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);

  const formatarData = (value: string) =>
    value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 10);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "cpf") {
      setFormData((p) => ({ ...p, cpf: formatarCPF(value) }));
    } else if (name === "data") {
      setFormData((p) => ({ ...p, data: formatarData(value) }));
    } else if (name === "nome") {
      setFormData((p) => ({ ...p, nome: value.toUpperCase() }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const validarFormulario = () => {
    if (!formData.nome.trim()) { toast.error("Preencha o nome"); return false; }
    if (formData.cpf.replace(/\D/g, "").length !== 11) { toast.error("CPF inválido"); return false; }
    if (!formData.data.trim()) { toast.error("Preencha a data"); return false; }
    return true;
  };

  const gerarPDF = async () => {
    if (!validarFormulario()) return;
    setLoading(true);
    try {
      if (!certificadoRef.current) return;
      const canvas = await html2canvas(certificadoRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      pdf.save(`Certificado_${formData.nome.replace(/\s+/g, "_")}.pdf`);
      toast.success("Certificado gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar o certificado");
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setFormData({ nome: "", cpf: "", data: "" });
    toast.success("Formulário limpo!");
  };

  const isPreenchido = formData.nome && formData.cpf && formData.data;

  const fields: Field[] = [
    { name: "nome", label: "Nome Completo", placeholder: "Ex: João Silva dos Santos", icon: User, type: "text" },
    { name: "cpf", label: "CPF", placeholder: "000.000.000-00", icon: User, type: "text", maxLength: 14 },
    { name: "data", label: "Data de Conclusão", placeholder: "DD/MM/AAAA", icon: Calendar, type: "text", maxLength: 10 },
  ];

  return (
    <div className="min-h-screen font-sans bg-linear-to-br from-slate-50 via-white to-slate-100">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <nav className="sticky top-0 z-50 px-4 md:px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-semibold flex items-center gap-1">
              ← Painel
            </Link>
            <div style={{ width: 1, height: 20, background: "rgba(71,85,105,0.2)" }} />
            <div className="flex items-center gap-2">
              <Award className="text-yellow-500" size={22} />
              <h1 className="text-slate-900 font-black text-lg tracking-tight">
                Gerar <span className="text-yellow-500">Certificado</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPreenchido && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 size={14} /> Pronto para gerar
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ====== FORMULÁRIO ====== */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl p-6 h-fit sticky top-24 bg-white border border-slate-200 shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-linear-to-br from-yellow-400 to-yellow-500">
                  <Award size={16} className="text-white" />
                </div>
                <h2 className="text-slate-900 font-black text-lg">Dados do Certificado</h2>
              </div>

              <div className="space-y-4">
                {fields.map(({ name, label, placeholder, icon: Icon, type, maxLength }) => (
                  <div key={name}>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest text-slate-700">
                      {label}
                    </label>
                    <div className="relative">
                      <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all border border-slate-200 bg-slate-50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                        onFocus={(e) => { e.target.style.borderColor = "#facc15"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}
                      />
                    </div>
                  </div>
                ))}

                {/* Botões */}
                <div className="space-y-2 pt-4">
                  <button
                    onClick={gerarPDF}
                    disabled={loading || !isPreenchido}
                    className="w-full py-3 px-6 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-linear-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-md hover:shadow-lg disabled:from-yellow-300 disabled:to-yellow-400"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Gerando...
                      </>
                    ) : !isPreenchido ? (
                      <>
                        <Download size={18} /> Preencha os campos
                      </>
                    ) : (
                      <>
                        <Download size={18} /> Baixar PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={limparFormulario}
                    disabled={!isPreenchido}
                    className="w-full py-3 px-6 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    <RotateCcw size={16} /> Limpar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ====== PRÉVIA ====== */}
          {showPreview && (
            <div className="lg:col-span-3">
              <div className="rounded-2xl p-5 sticky top-24 bg-white border border-slate-200 shadow-lg">
                <p className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-600">
                  Prévia do Certificado
                </p>

                {/* Container escalado do certificado */}
                <div className="overflow-hidden rounded-xl" style={{ background: "#f8f5ee" }}>
                  <div style={{ width: "100%", paddingBottom: "70%", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: "1400px", height: "980px", transform: "scale(var(--cert-scale,0.46))", transformOrigin: "top left" }}>
                      <div ref={certificadoRef} style={{ width: 1400, height: 980, position: "relative" }}>
                        <CertificadoConteudo formData={formData} />
                      </div>
                    </div>
                  </div>
                </div>

                <style>{`
                  @media (min-width: 1280px) { :root { --cert-scale: 0.5; } }
                  @media (max-width: 1279px) { :root { --cert-scale: 0.42; } }
                  @media (max-width: 900px)  { :root { --cert-scale: 0.33; } }
                `}</style>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CertificadoConteudo({ formData }: { formData: FormData }) {
  const gold = "#c9a84c";
  const darkGold = "#a07830";

  return (
    <div style={{ width: 1400, height: 980, background: "#faf6ef", position: "relative", overflow: "hidden", fontFamily: "Georgia, serif" }}>

      {/* Fundo texturizado */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.06) 0%, transparent 60%)`,
      }} />

      {/* Borda externa preta */}
      <div style={{ position: "absolute", inset: 0, border: "36px solid #1a1a1a" }} />

      {/* Borda dourada interna */}
      <div style={{ position: "absolute", inset: 44, border: `3px solid ${gold}` }} />

      {/* Segunda borda dourada */}
      <div style={{ position: "absolute", inset: 52, border: `1px solid ${gold}`, opacity: 0.5 }} />

      {/* Cantos decorativos */}
      {[
        { top: 44, left: 44 },
        { top: 44, right: 44 },
        { bottom: 44, left: 44 },
        { bottom: 44, right: 44 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", width: 80, height: 80,
          ...pos,
          borderTop: i < 2 ? `4px solid ${gold}` : undefined,
          borderBottom: i >= 2 ? `4px solid ${gold}` : undefined,
          borderLeft: (i === 0 || i === 2) ? `4px solid ${gold}` : undefined,
          borderRight: (i === 1 || i === 3) ? `4px solid ${gold}` : undefined,
        }} />
      ))}

      {/* Faixas centrais top/bottom */}
      <div style={{ position: "absolute", top: 36, left: "50%", transform: "translateX(-50%)", width: 320, height: 8, background: gold }} />
      <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", width: 320, height: 8, background: gold }} />

      {/* Conteúdo principal */}
      <div style={{ position: "absolute", inset: 55, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 30 }}>

        {/* Logo / Brasão */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <div style={{ width: 120, height: 2, background: `linear-gradient(to right, transparent, ${gold})` }} />
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#1a1a1a",
            border: `3px solid ${gold}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 20px rgba(201,168,76,0.3)`,
          }}>
            <span style={{ fontSize: 30 }}>★</span>
          </div>
          <div style={{ width: 120, height: 2, background: `linear-gradient(to left, transparent, ${gold})` }} />
        </div>

        {/* CERTIFICADO */}
        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 96, fontWeight: 700, letterSpacing: "0.18em",
          color: "#1a1a1a", margin: 0, lineHeight: 1,
        }}>
          CERTIFICADO
        </h1>

        {/* DE CONCLUSÃO */}
        <h2 style={{
          fontFamily: "Georgia, serif",
          fontSize: 28, fontWeight: 300, letterSpacing: "0.35em",
          color: "#444", margin: "6px 0 0",
        }}>
          DE CONCLUSÃO
        </h2>

        {/* Linha decorativa */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ width: 180, height: 1, background: gold }} />
          <span style={{ color: gold, fontSize: 18 }}>◆</span>
          <div style={{ width: 180, height: 1, background: gold }} />
        </div>

        {/* Certificamos que */}
        <p style={{ fontSize: 20, letterSpacing: "0.25em", color: "#555", margin: "4px 0 20px", fontFamily: "Georgia, serif" }}>
          CERTIFICAMOS QUE
        </p>

        {/* Nome */}
        <div style={{
          width: "100%",
          maxWidth: 900,
          borderBottom: `2px solid #333`,
          paddingBottom: 8,
          textAlign: "center",
          margin: "0 0 10px",
          overflow: "hidden",
        }}>
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 58,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
              display: "inline-block",
              maxWidth: "100%",
              transformOrigin: "center center",
              transform: formData.nome && formData.nome.length > 22
                ? `scaleX(${Math.max(0.6, 22 / formData.nome.length)})`
                : "scaleX(1)",
            }}
          >
            {formData.nome || "NOME DO PARTICIPANTE"}
          </span>
        </div>

        {/* CPF */}
        <p style={{ fontSize: 16, color: "#666", letterSpacing: "0.1em", margin: "0 0 14px" }}>
          CPF: {formData.cpf || "000.000.000-00"}
        </p>

        {/* Texto */}
        <p style={{ fontSize: 20, lineHeight: 1.8, color: "#444", textAlign: "center", maxWidth: 820, fontFamily: "Georgia, serif", margin: 0 }}>
          completou o curso com sucesso, demonstrando conhecimento e responsabilidade.
        </p>
      </div>

      {/* Rodapé: selo */}
      <div style={{
        position: "absolute", bottom: 68, left: "50%", transform: "translateX(-50%)",
        display: "flex", justifyContent: "center", alignItems: "flex-end",
      }}>
        {/* Selo central */}
        <div style={{
          width: 120, height: 120, borderRadius: "50%",
          background: "#1a1a1a",
          border: `5px solid ${gold}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 30px rgba(201,168,76,0.4)`,
        }}>
          <span style={{ color: gold, fontSize: 18, letterSpacing: 2 }}>★★★</span>
          <p style={{ color: gold, fontSize: 11, fontWeight: 700, letterSpacing: 3, marginTop: 4, fontFamily: "Arial, sans-serif" }}>APROVADO</p>
        </div>
      </div>
    </div>
  );
}