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
    if (!formData.nome.trim()) {
      toast.error("Preencha o nome");
      return false;
    }
    if (formData.cpf.replace(/\D/g, "").length !== 11) {
      toast.error("CPF inválido");
      return false;
    }
    if (!formData.data.trim()) {
      toast.error("Preencha a data");
      return false;
    }
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
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      pdf.save(
        `Certificado_${formData.nome.replace(/\s+/g, "_")}.pdf`
      );
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
    {
      name: "nome",
      label: "Nome Completo",
      placeholder: "Ex: João Silva dos Santos",
      icon: User,
      type: "text",
    },
    {
      name: "cpf",
      label: "CPF",
      placeholder: "000.000.000-00",
      icon: User,
      type: "text",
      maxLength: 14,
    },
    {
      name: "data",
      label: "Data de Conclusão",
      placeholder: "",
      icon: Calendar,
      type: "date",
    },
  ];

  return (
    <div className="min-h-screen font-sans bg-linear-to-br from-slate-50 via-white to-slate-100">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <nav className="sticky top-0 z-50 px-4 md:px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-semibold flex items-center gap-1"
            >
              ← Painel
            </Link>
            <div
              style={{
                width: 1,
                height: 20,
                background: "rgba(71,85,105,0.2)",
              }}
            />
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
                <h2 className="text-slate-900 font-black text-lg">
                  Dados do Certificado
                </h2>
              </div>

              <div className="space-y-4">
                {fields.map(
                  ({
                    name,
                    label,
                    placeholder,
                    icon: Icon,
                    type,
                    maxLength,
                  }) => (
                    <div key={name}>
                      <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest text-slate-700">
                        {label}
                      </label>
                      <div className="relative">
                        <Icon
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type={type}
                          name={name}
                          value={formData[name]}
                          onChange={handleChange}
                          placeholder={placeholder}
                          maxLength={maxLength}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all border border-slate-200 bg-slate-50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                          onFocus={(e) => {
                            e.target.style.borderColor = "#facc15";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                          }}
                        />
                      </div>
                    </div>
                  )
                )}

                <div className="space-y-2 pt-4">
                  <button
                    onClick={gerarPDF}
                    disabled={loading || !isPreenchido}
                    className="w-full py-3 px-6 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-linear-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />{" "}
                        Gerando...
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

              <div
                className="overflow-hidden rounded-xl"
                style={{ background: "#e8e8e8" }}
              >
                <div
                  style={{
                    width: "100%",
                    paddingBottom: "70%",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "1400px",
                      height: "980px",
                      transform: "scale(var(--cert-scale, 0.46))",
                      transformOrigin: "top left",
                    }}
                  >
                    <div
                      ref={certificadoRef}
                      style={{
                        width: 1400,
                        height: 980,
                        position: "relative",
                      }}
                    >
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
   CERTIFICADO CONTEÚDO — Layout simples sem flexbox
================================================================ */
function CertificadoConteudo({ formData }: { formData: FormData }) {
  const gold = "#c8922a";
  const dark = "#111111";

  const formatarDataExtenso = (dataISO: string): string => {
    if (!dataISO) return "";
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    const [ano, mes, dia] = dataISO.split("-");
    return `BH, ${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${ano}`;
  };

  const nomeScale =
    formData.nome && formData.nome.length > 24
      ? Math.max(0.52, 24 / formData.nome.length)
      : 1;

  return (
    <div
      style={{
        width: 1400,
        height: 980,
        background: "#ffffff",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Georgia, 'Times New Roman', serif",
        textAlign: "center",
      }}
    >
      {/* ══ BORDAS ══ */}
      <div
        style={{ position: "absolute", inset: 0, border: `8px solid ${dark}` }}
      />
      <div
        style={{ position: "absolute", inset: 16, border: `3px solid ${gold}` }}
      />
      <div
        style={{
          position: "absolute",
          inset: 26,
          border: `1px solid ${dark}`,
          opacity: 0.2,
        }}
      />

      {/* ══════════════════════════════════════════════
          CANTOS GEOMÉTRICOS
      ══════════════════════════════════════════════ */}

      {/* Superior esquerdo */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 180,
          height: 180,
          zIndex: 10,
        }}
        viewBox="0 0 180 180"
      >
        <polygon points="0,0 110,0 0,110" fill={dark} />
        <polygon points="110,0 148,0 0,148 0,110" fill={gold} />
        <polygon
          points="148,0 180,0 0,180 0,148"
          fill={gold}
          opacity="0.5"
        />
      </svg>

      {/* Superior direito */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 180,
          height: 180,
          zIndex: 10,
        }}
        viewBox="0 0 180 180"
      >
        <polygon points="180,0 70,0 180,110" fill={dark} />
        <polygon points="70,0 32,0 180,148 180,110" fill={gold} />
        <polygon
          points="32,0 0,0 180,180 180,148"
          fill={gold}
          opacity="0.5"
        />
      </svg>

      {/* Inferior esquerdo */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 180,
          height: 180,
          zIndex: 10,
        }}
        viewBox="0 0 180 180"
      >
        <polygon points="0,180 110,180 0,70" fill={dark} />
        <polygon points="110,180 148,180 0,32 0,70" fill={gold} />
        <polygon
          points="148,180 180,180 0,0 0,32"
          fill={gold}
          opacity="0.5"
        />
      </svg>

      {/* Inferior direito */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 180,
          height: 180,
          zIndex: 10,
        }}
        viewBox="0 0 180 180"
      >
        <polygon points="180,180 70,180 180,70" fill={dark} />
        <polygon points="70,180 32,180 180,32 180,70" fill={gold} />
        <polygon
          points="32,180 0,180 180,0 180,32"
          fill={gold}
          opacity="0.5"
        />
      </svg>

      {/* ══════════════════════════════════════════════
          CONTEÚDO — Posicionamento Absoluto
      ══════════════════════════════════════════════ */}

      {/* Logo Grupo Protect - Topo */}
      <img
        src="/grupoprotect.png"
        alt="Grupo Protect"
        style={{
          position: "absolute",
          top: 50,
          left: "50%",
          transform: "translateX(-50%)",
          width: 90,
          height: "auto",
          objectFit: "contain",
          maxHeight: 70,
          zIndex: 20,
        }}
      />

      {/* CERTIFICADO - Título */}
      <h1
        style={{
          position: "absolute",
          top: 140,
          left: 80,
          right: 80,
          fontSize: 110,
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: dark,
          margin: 0,
          lineHeight: 0.9,
          zIndex: 20,
        }}
      >
        CERTIFICADO
      </h1>

      {/* DE CONCLUSÃO */}
      <h2
        style={{
          position: "absolute",
          top: 270,
          left: 80,
          right: 80,
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: "0.1em",
          color: "#666",
          margin: 0,
          fontFamily: "Georgia, serif",
          zIndex: 20,
        }}
      >
        DE CONCLUSÃO
      </h2>

      {/* Divisor */}
      <div
        style={{
          position: "absolute",
          top: 320,
          left: "50%",
          transform: "translateX(-50%)",
          width: 260,
          height: 1.5,
          background: dark,
          zIndex: 20,
        }}
      />

      {/* CERTIFICAMOS QUE */}
      <p
        style={{
          position: "absolute",
          top: 355,
          left: 80,
          right: 80,
          fontSize: 13,
          letterSpacing: "0.08em",
          color: "#666",
          margin: 0,
          fontFamily: "Arial, sans-serif",
          fontWeight: 600,
          zIndex: 20,
        }}
      >
        CERTIFICAMOS QUE
      </p>

      {/* NOME */}
      <div
        style={{
          position: "absolute",
          top: 400,
          left: 150,
          right: 150,
          borderBottom: `2px solid ${dark}`,
          paddingBottom: 10,
          zIndex: 20,
        }}
      >
        <span
          style={{
            fontSize: 66,
            fontWeight: 700,
            color: dark,
            letterSpacing: "0.02em",
            display: "inline-block",
            transformOrigin: "center center",
            transform: `scaleX(${nomeScale})`,
            whiteSpace: "nowrap",
          }}
        >
          {formData.nome || "NOME DO PARTICIPANTE"}
        </span>
      </div>

      {/* CPF */}
      <p
        style={{
          position: "absolute",
          top: 495,
          left: 80,
          right: 80,
          fontSize: 13,
          color: "#666",
          letterSpacing: "0.06em",
          margin: 0,
          fontFamily: "Arial, sans-serif",
          zIndex: 20,
        }}
      >
        CPF: {formData.cpf || "000.000.000-00"}
      </p>

      {/* Texto descritivo */}
      <p
        style={{
          position: "absolute",
          top: 535,
          left: 120,
          right: 120,
          fontSize: 15,
          lineHeight: 1.5,
          color: "#555",
          margin: 0,
          fontFamily: "Georgia, serif",
          zIndex: 20,
        }}
      >
        concluiu com êxito o treinamento teórico e prático do curso,
        <br />
        demonstrando conhecimento, habilidade e responsabilidade no
        <br />
        manuseio seguro de armas de fogo.
      </p>

      {/* ═══════════════════════════════════════════
          RODAPÉ - 3 Colunas
      ═══════════════════════════════════════════ */}

      {/* Coluna Esquerda - INSTRUTOR */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 80,
          width: 280,
          textAlign: "center",
          zIndex: 20,
        }}
      >
        <div
          style={{
            borderTop: `1.5px solid ${dark}`,
            marginBottom: 8,
            height: 0,
          }}
        />
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "#444",
            fontFamily: "Arial, sans-serif",
            fontWeight: 700,
            margin: 0,
          }}
        >
          INSTRUTOR
        </p>
      </div>

      {/* Coluna Central - LOGO */}
      <img
        src="/protectclubedetiro.png"
        alt="Protect Clube de Tiro"
        style={{
          position: "absolute",
          bottom: 50,
          left: "50%",
          transform: "translateX(-50%)",
          width: 100,
          height: "auto",
          objectFit: "contain",
          maxHeight: 110,
          zIndex: 20,
        }}
      />

      {/* Coluna Direita - DATA */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 80,
          width: 280,
          textAlign: "center",
          zIndex: 20,
        }}
      >
        <div
          style={{
            borderTop: `1.5px solid ${dark}`,
            marginBottom: 8,
            height: 0,
          }}
        />
        <p
          style={{
            fontSize: formData.data ? 10 : 11,
            letterSpacing: "0.06em",
            color: "#444",
            fontFamily: "Arial, sans-serif",
            fontWeight: 700,
            margin: 0,
          }}
        >
          {formData.data ? formatarDataExtenso(formData.data) : "DATA"}
        </p>
      </div>
    </div>
  );
}