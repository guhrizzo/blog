"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Download,
  Loader2,
  RotateCcw,
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
  const certificadoRef = useRef<HTMLDivElement>(null);

  const formatarCPF = (value: string) =>
    value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "cpf") {
      setFormData((p) => ({ ...p, cpf: formatarCPF(value) }));
    } else if (name === "data") {
      setFormData((p) => ({ ...p, data: value }));
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
    { name: "data", label: "Data de Conclusão", placeholder: "", icon: Calendar, type: "date" },
  ];

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-slate-50 via-white to-slate-100">
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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-500">
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

                <div className="space-y-2 pt-4">
                  <button
                    onClick={gerarPDF}
                    disabled={loading || !isPreenchido}
                    className="w-full py-3 px-6 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> Gerando...</>
                    ) : !isPreenchido ? (
                      <><Download size={18} /> Preencha os campos</>
                    ) : (
                      <><Download size={18} /> Baixar PDF</>
                    )}
                  </button>
                  <button
                    onClick={limparFormulario}
                    disabled={!isPreenchido}
                    className="w-full py-3 px-6 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={16} /> Limpar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ====== PRÉVIA ====== */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl p-5 sticky top-24 bg-white border border-slate-200 shadow-lg">
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-600">
                Prévia do Certificado
              </p>

              <div className="overflow-hidden rounded-xl" style={{ background: "#e8e8e8" }}>
                <div style={{ width: "100%", paddingBottom: "70%", position: "relative", overflow: "hidden" }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0,
                    width: "1400px", height: "980px",
                    transform: "scale(var(--cert-scale, 0.46))",
                    transformOrigin: "top left",
                  }}>
                    <div ref={certificadoRef} style={{ width: 1400, height: 980, position: "relative" }}>
                      <CertificadoConteudo formData={formData} />
                    </div>
                  </div>
                </div>
              </div>

              <style>{`
                @media (min-width: 1280px) { :root { --cert-scale: 0.50; } }
                @media (max-width: 1279px) { :root { --cert-scale: 0.42; } }
                @media (max-width: 900px)  { :root { --cert-scale: 0.33; } }
              `}</style>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

/* ================================================================
   CERTIFICADO CONTEÚDO — fiel à imagem de referência
   Escudo no topo | Cantos geométricos preto+dourado | Medalha no rodapé
================================================================ */
function CertificadoConteudo({ formData }: { formData: FormData }) {
  const gold = "#c8922a";
  const goldLight = "#e8b84b";
  const dark = "#111111";

  const formatarDataExtenso = (dataISO: string): string => {
    if (!dataISO) return "";
    const meses = [
      "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
      "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
    ];
    const [ano, mes, dia] = dataISO.split("-");
    return `BH, ${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${ano}`;
  };

  const nomeScale =
    formData.nome && formData.nome.length > 24
      ? Math.max(0.52, 24 / formData.nome.length)
      : 1;

  return (
    <div style={{
      width: 1400,
      height: 980,
      background: "#ffffff",
      position: "relative",
      overflow: "hidden",
      fontFamily: "Georgia, 'Times New Roman', serif",
    }}>

      {/* ══ BORDAS ══ */}
      {/* Externa preta */}
      <div style={{ position: "absolute", inset: 0, border: `8px solid ${dark}` }} />
      {/* Dourada */}
      <div style={{ position: "absolute", inset: 16, border: `3px solid ${gold}` }} />
      {/* Interna preta fina */}
      <div style={{ position: "absolute", inset: 26, border: `1px solid ${dark}`, opacity: 0.2 }} />

      {/* ══════════════════════════════════════════════
          CANTOS GEOMÉTRICOS — triângulos preto + dourado
      ══════════════════════════════════════════════ */}

      {/* Superior esquerdo */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: 180, height: 180 }} viewBox="0 0 180 180">
        <polygon points="0,0 110,0 0,110" fill={dark} />
        <polygon points="110,0 148,0 0,148 0,110" fill={gold} />
        <polygon points="148,0 180,0 0,180 0,148" fill={goldLight} opacity="0.8" />
      </svg>

      {/* Superior direito */}
      <svg style={{ position: "absolute", top: 0, right: 0, width: 180, height: 180 }} viewBox="0 0 180 180">
        <polygon points="180,0 70,0 180,110" fill={dark} />
        <polygon points="70,0 32,0 180,148 180,110" fill={gold} />
        <polygon points="32,0 0,0 180,180 180,148" fill={goldLight} opacity="0.8" />
      </svg>

      {/* Inferior esquerdo */}
      <svg style={{ position: "absolute", bottom: 0, left: 0, width: 180, height: 180 }} viewBox="0 0 180 180">
        <polygon points="0,180 110,180 0,70" fill={dark} />
        <polygon points="110,180 148,180 0,32 0,70" fill={gold} />
        <polygon points="148,180 180,180 0,0 0,32" fill={goldLight} opacity="0.8" />
      </svg>

      {/* Inferior direito */}
      <svg style={{ position: "absolute", bottom: 0, right: 0, width: 180, height: 180 }} viewBox="0 0 180 180">
        <polygon points="180,180 70,180 180,70" fill={dark} />
        <polygon points="70,180 32,180 180,32 180,70" fill={gold} />
        <polygon points="32,180 0,180 180,0 180,32" fill={goldLight} opacity="0.8" />
      </svg>

      {/* ══════════════════════════════════════════════
          ESCUDO / LOGO — topo centro
      ══════════════════════════════════════════════ */}
      <div style={{
        position: "absolute",
        top: 30,
        left: "50%",
        transform: "translateX(-50%)",
      }}>
        <svg width="100" height="112" viewBox="0 0 100 112">
          {/* Escudo fundo preto */}
          <path
            d="M50 4 L92 20 L92 56 C92 80 73 98 50 106 C27 98 8 80 8 56 L8 20 Z"
            fill={dark}
            stroke={gold}
            strokeWidth="3"
          />
          {/* Borda interna dourada */}
          <path
            d="M50 14 L82 28 L82 56 C82 76 66 92 50 100 C34 92 18 76 18 56 L18 28 Z"
            fill="none"
            stroke={gold}
            strokeWidth="1.5"
            opacity="0.5"
          />
          {/* Mira */}
          <circle cx="50" cy="56" r="16" fill="none" stroke={gold} strokeWidth="2.5" />
          <circle cx="50" cy="56" r="5" fill={gold} />
          <line x1="50" y1="33" x2="50" y2="43" stroke={gold} strokeWidth="2.5" />
          <line x1="50" y1="69" x2="50" y2="79" stroke={gold} strokeWidth="2.5" />
          <line x1="27" y1="56" x2="37" y2="56" stroke={gold} strokeWidth="2.5" />
          <line x1="63" y1="56" x2="73" y2="56" stroke={gold} strokeWidth="2.5" />
          {/* Ramos decorativos */}
          <text x="50" y="102" textAnchor="middle" fill={gold} fontSize="11" fontFamily="Arial">★ ★ ★</text>
        </svg>
      </div>

      {/* ══════════════════════════════════════════════
          CORPO PRINCIPAL
      ══════════════════════════════════════════════ */}
      <div style={{
        position: "absolute",
        top: 148,
        left: 185,
        right: 185,
        bottom: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>

        {/* CERTIFICADO */}
        <h1 style={{
          fontSize: 108,
          fontWeight: 800,
          letterSpacing: "0.1em",
          color: dark,
          margin: "0 0 0",
          lineHeight: 1,
        }}>
          CERTIFICADO
        </h1>

        {/* DE CONCLUSÃO */}
        <h2 style={{
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: "0.48em",
          color: "#444",
          margin: "6px 0 14px",
          fontFamily: "Georgia, serif",
        }}>
          DE CONCLUSÃO
        </h2>

        {/* Divisor */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 20px" }}>
          <div style={{ width: 130, height: 1, background: dark }} />
          <span style={{ color: gold, fontSize: 14 }}>◆</span>
          <div style={{ width: 130, height: 1, background: dark }} />
        </div>

        {/* CERTIFICAMOS QUE */}
        <p style={{
          fontSize: 15,
          letterSpacing: "0.34em",
          color: "#666",
          margin: "0 0 16px",
          fontFamily: "Arial, sans-serif",
          fontWeight: 600,
        }}>
          CERTIFICAMOS QUE
        </p>

        {/* ── Nome ── */}
        <div style={{
          width: "100%",
          maxWidth: 900,
          borderBottom: `2px solid ${dark}`,
          paddingBottom: 10,
          textAlign: "center",
          margin: "0 0 14px",
          overflow: "hidden",
        }}>
          <span style={{
            fontSize: 66,
            fontWeight: 700,
            color: dark,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            display: "inline-block",
            transformOrigin: "center center",
            transform: `scaleX(${nomeScale})`,
          }}>
            {formData.nome || "NOME DO PARTICIPANTE"}
          </span>
        </div>

        {/* CPF */}
        <p style={{
          fontSize: 16,
          color: "#666",
          letterSpacing: "0.14em",
          margin: "0 0 14px",
          fontFamily: "Arial, sans-serif",
        }}>
          CPF: &nbsp;{formData.cpf || "000.000.000-00"}
        </p>

        {/* Texto */}
        <p style={{
          fontSize: 19,
          lineHeight: 1.8,
          color: "#444",
          textAlign: "center",
          maxWidth: 760,
          margin: "0 0 auto",
          fontFamily: "Georgia, serif",
        }}>
          concluiu com êxito o treinamento teórico e prático do curso,<br />
          demonstrando conhecimento, habilidade e responsabilidade no<br />
          manuseio seguro de armas de fogo.
        </p>

        {/* ── Rodapé: INSTRUTOR | MEDALHA | DATA ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          width: "100%",
          paddingBottom: 8,
        }}>

          {/* Assinatura INSTRUTOR */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flex: 1 }}>
            <div style={{ width: 200, height: 1.5, background: dark }} />
            <span style={{
              fontSize: 12,
              letterSpacing: "0.32em",
              color: "#444",
              fontFamily: "Arial, sans-serif",
              fontWeight: 700,
            }}>
              INSTRUTOR
            </span>
          </div>

          {/* Medalha */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: 0 }}>
            <svg width="120" height="140" viewBox="0 0 120 140">
              {/* Fita */}
              <polygon points="35,0 60,22 85,0 76,55 60,44 44,55" fill={gold} />
              <line x1="52" y1="0" x2="60" y2="22" stroke={goldLight} strokeWidth="2" />
              <line x1="68" y1="0" x2="60" y2="22" stroke={goldLight} strokeWidth="2" />
              {/* Círculo borda dourada */}
              <circle cx="60" cy="95" r="43" fill={gold} />
              {/* Círculo interior preto */}
              <circle cx="60" cy="95" r="37" fill={dark} />
              {/* Anel dourado interno */}
              <circle cx="60" cy="95" r="33" fill="none" stroke={gold} strokeWidth="1.5" opacity="0.4" />
              {/* Estrelas */}
              <text x="60" y="103" textAnchor="middle" fill={gold} fontSize="22" fontFamily="Arial" letterSpacing="4">★★★</text>
            </svg>
          </div>

          {/* Assinatura DATA */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flex: 1 }}>
            <div style={{ width: 200, height: 1.5, background: dark }} />
            <span style={{
              fontSize: formData.data ? 11 : 12,
              letterSpacing: formData.data ? "0.08em" : "0.32em",
              color: "#444",
              fontFamily: "Arial, sans-serif",
              fontWeight: 700,
              textAlign: "center",
            }}>
              {formData.data ? formatarDataExtenso(formData.data) : "DATA"}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}