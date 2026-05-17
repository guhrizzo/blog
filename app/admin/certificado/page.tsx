"use client";

import React, { useState } from "react";
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
  Printer,
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

  const [loadingDownload, setLoadingDownload] = useState(false);
  const [loadingPrint, setLoadingPrint] = useState(false);

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

  const formatarDataParaAPI = (dataISO: string): string => {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const limparNomeArquivo = (nome: string): string => {
    return nome
      .toLowerCase()
      .trim()
      .substring(0, 50)
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  };

  const buscarHTMLDaAPI = async (): Promise<string> => {
    const params = new URLSearchParams({
      nome: formData.nome,
      cpf: formData.cpf,
      data: formatarDataParaAPI(formData.data),
    });

    const response = await fetch(`/api/certificado?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar o certificado da API");
    }

    return await response.text();
  };

  const gerarCanvas = async (): Promise<string> => {
    const htmlString = await buscarHTMLDaAPI();
  
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 1122px;
      height: 794px;
      border: none;
      visibility: hidden;
    `;
  
    document.body.appendChild(iframe);
  
    await new Promise((resolve) => setTimeout(resolve, 500));
  
    const iframeDoc = iframe.contentDocument!;
    iframeDoc.open();
    iframeDoc.write(htmlString);
    iframeDoc.close();
  
    await new Promise((resolve) => setTimeout(resolve, 1000));
  
    const body = iframeDoc.body;
    const html = iframeDoc.documentElement;
  
    const fullWidth = Math.max(
      body.scrollWidth, body.offsetWidth,
      html.clientWidth, html.scrollWidth, html.offsetWidth
    );
    const fullHeight = Math.max(
      body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight
    );
  
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: fullWidth,
      height: fullHeight,
      windowWidth: fullWidth,
      windowHeight: fullHeight,
    });
  
    document.body.removeChild(iframe);
  
    return canvas.toDataURL("image/png");
  };

  const baixarPDF = async () => {
    if (!validarFormulario()) return;
    setLoadingDownload(true);
    try {
      const imgData = await gerarCanvas();
  
      // Pega dimensões reais da imagem gerada
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => (img.onload = resolve));
  
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
  
      // Mantém aspect ratio dentro do A4
      const pageW = 297;
      const pageH = 210;
      const imgRatio = img.width / img.height;
      const pageRatio = pageW / pageH;
  
      let w = pageW;
      let h = pageH;
      if (imgRatio > pageRatio) {
        h = pageW / imgRatio;
      } else {
        w = pageH * imgRatio;
      }
  
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
  
      pdf.addImage(imgData, "PNG", x, y, w, h);
      pdf.save(`Certificado_${limparNomeArquivo(formData.nome)}.pdf`);
  
      toast.success("Certificado baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao baixar o certificado");
      console.error(error);
    } finally {
      setLoadingDownload(false);
    }
  };

  const imprimirPDF = async () => {
  if (!validarFormulario()) return;
  setLoadingPrint(true);
  try {
    const imgData = await gerarCanvas();

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    pdf.addImage(imgData, "PNG", 0, 0, 297, 210);

    const pdfBlob = pdf.output("blob");
    const url = window.URL.createObjectURL(pdfBlob);

    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      toast.error("Popup bloqueado — libere popups para este site");
      return;
    }

    toast.success("Abrindo janela de impressão...");

    // Não espera onload — só abre e deixa o browser lidar
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        // PDF viewer nativo bloqueia print() programático — usuário printa manualmente
      }
    }, 1500);

  } catch (error) {
    toast.error("Erro ao imprimir o certificado");
    console.error(error);
  } finally {
    setLoadingPrint(false); // garante que sempre reseta
  }
};

  const limparFormulario = () => {
    setFormData({ nome: "", cpf: "", data: "" });
    toast.success("Formulário limpo!");
  };

  const isPreenchido = formData.nome && formData.cpf && formData.data;
  const anyLoading = loadingDownload || loadingPrint;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="lg:col-span-3">
            <div className="rounded-2xl p-8 bg-white border border-slate-200 shadow-lg">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-linear-to-br from-yellow-400 to-yellow-500">
                  <Award size={16} className="text-white" />
                </div>
                <h2 className="text-slate-900 font-black text-lg">
                  Dados do Certificado
                </h2>
              </div>

              <div className="space-y-5">
                {fields.map(({ name, label, placeholder, icon: Icon, type, maxLength }) => (
                  <div key={name}>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-widest text-slate-700">
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
                        className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all border border-slate-200 bg-slate-50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                        onFocus={(e) => { e.target.style.borderColor = "#facc15"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}
                      />
                    </div>
                    {name === "nome" && formData.nome.length > 40 && (
                      <p className="text-xs text-amber-500 mt-1">
                        ⚠️ Nome longo — fonte será reduzida no certificado
                      </p>
                    )}
                  </div>
                ))}

                <div className="space-y-3 pt-6">
                  <button
                    onClick={baixarPDF}
                    disabled={anyLoading || !isPreenchido}
                    className="w-full h-12 py-3 px-6 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-linear-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-md hover:shadow-lg"
                  >
                    {loadingDownload ? (
                      <><Loader2 size={18} className="animate-spin" /> Gerando...</>
                    ) : (
                      <><Download size={18} /> {isPreenchido ? "Baixar PDF" : "Preencha os campos"}</>
                    )}
                  </button>

                  <button
                    onClick={imprimirPDF}
                    disabled={anyLoading || !isPreenchido}
                    className="w-full h-12 py-3 px-6 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-linear-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 shadow-md hover:shadow-lg"
                  >
                    {loadingPrint ? (
                      <><Loader2 size={18} className="animate-spin" /> Abrindo...</>
                    ) : (
                      <><Printer size={18} /> {isPreenchido ? "Imprimir" : "Preencha os campos"}</>
                    )}
                  </button>

                  <button
                    onClick={limparFormulario}
                    disabled={anyLoading || !isPreenchido}
                    className="w-full h-12 py-3 px-6 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={16} /> Limpar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}