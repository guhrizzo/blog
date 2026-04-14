// app/admin/contratos/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    collection,
    query,
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc,
    Timestamp,
    limit
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    ArrowLeft, Search, Trash2, Eye, X,
    AlertCircle, RefreshCw, ShieldCheck, Bug, Edit3, Printer, Mail, CheckCircle
} from "lucide-react";
import jsPDF from "jspdf";

const COLLECTION_NAME = "assinaturas_contrato";

interface Contract {
    id: string;
    nome?: string;
    email?: string;
    cpf?: string;
    rg?: string;
    profissao?: string;
    naturalidade?: string;
    nascimento?: string;
    dataAssinatura?: Timestamp;
    dataAssinaturaString?: string;
    versaoContrato?: string;
    status?: string;
    hash?: string;
    emailEnviado?: boolean;
    dataEnvioEmail?: Timestamp;
    createdAt?: Timestamp;
}

// ─── Carrega imagem como base64 via canvas ─────────────────────────────────────
const loadImageAsBase64 = (src: string): Promise<string> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext("2d")!.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = src;
    });

export default function ContractsPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "pendente" | "assinado" | "cancelado">("todos");
    const [user, setUser] = useState<any>(null);
    const [viewingContract, setViewingContract] = useState<Contract | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contractToDelete, setContractToDelete] = useState<string | null>(null);
    const [editingStatus, setEditingStatus] = useState<string | null>(null);
    const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);
    const [emailSentIds, setEmailSentIds] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Cache das assinaturas em base64 — carregadas uma única vez
    const signaturesRef = useRef<{ s1: string; s2: string; s3: string } | null>(null);

    const knownIds = useRef<Set<string>>(new Set());
    const isFirstLoad = useRef(true);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const getSignatures = async () => {
        if (signaturesRef.current) return signaturesRef.current;
        const [s1, s2, s3] = await Promise.all([
            loadImageAsBase64("/assinatura1.png"),
            loadImageAsBase64("/assinatura2.png"),
            loadImageAsBase64("/assinatura3.png"),
        ]);
        signaturesRef.current = { s1, s2, s3 };
        return signaturesRef.current;
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) { router.push("/login"); return; }
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, COLLECTION_NAME), limit(100));

        const unsubscribe = onSnapshot(q,
            async (snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Contract[];
                data.sort((a, b) => {
                    const ta = a.createdAt?.toMillis() ?? 0;
                    const tb = b.createdAt?.toMillis() ?? 0;
                    return tb - ta;
                });
                setContracts(data);
                setLoading(false);

                // Carregar IDs de emails já enviados
                const emailsEnviados = new Set<string>();
                data.forEach(contract => {
                    if (contract.emailEnviado) {
                        emailsEnviados.add(contract.id);
                    }
                });
                setEmailSentIds(emailsEnviados);

                if (isFirstLoad.current) {
                    snapshot.docs.forEach(d => knownIds.current.add(d.id));
                    isFirstLoad.current = false;
                    return;
                }

                const newContracts = snapshot.docChanges()
                    .filter(change => change.type === "added" && !knownIds.current.has(change.doc.id))
                    .map(change => ({ id: change.doc.id, ...change.doc.data() } as Contract));

                for (const contract of newContracts) {
                    knownIds.current.add(contract.id);
                    // Verificar se email já foi enviado
                    if (!contract.email || contract.emailEnviado) continue;
                    try {
                        const pdfBase64 = await generateContractPDFBase64(contract);
                        const res = await fetch("/api/send-contract", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                nome: contract.nome,
                                email: contract.email,
                                cpf: contract.cpf,
                                pdfBase64,
                                cc: "clube@grupoprotect.com.br",
                            }),
                        });
                        if (res.ok) {
                            // Marcar email como enviado no Firebase
                            await updateDoc(doc(db, COLLECTION_NAME, contract.id), {
                                emailEnviado: true,
                                dataEnvioEmail: Timestamp.now()
                            });
                            setEmailSentIds(prev => new Set([...prev, contract.id]));
                            showToast(`Email enviado para ${contract.nome}`, "success");
                        } else {
                            const err = await res.json();
                            showToast(`Erro ao enviar email: ${err.error}`, "error");
                        }
                    } catch (err: any) {
                        console.error("Erro ao enviar email para", contract.email, err);
                        showToast(`Erro ao enviar email para ${contract.nome}`, "error");
                    }
                }
            },
            (err) => { setError(err.message); setLoading(false); }
        );
        return () => unsubscribe();
    }, [user]);

    // ─── Helpers de data ───────────────────────────────────────────────────────

    const getContractDate = (contract: Contract): Date | null => {
        if (contract.dataAssinatura?.toDate) return contract.dataAssinatura.toDate();
        if (contract.dataAssinaturaString) return new Date(contract.dataAssinaturaString);
        return null;
    };

    // ─── PDF ───────────────────────────────────────────────────────────────────

    const generateContractPDFBase64 = async (contract: Contract): Promise<string> => {
        const sigs = await getSignatures();
        const pdf = new jsPDF("p", "mm", "a4");
        buildPDFContent(pdf, contract, sigs);
        return pdf.output("datauristring").split(",")[1];
    };

    const generateContractPDF = async (contract: Contract) => {
        setGeneratingPDF(contract.id);
        try {
            const sigs = await getSignatures();
            const pdf = new jsPDF("p", "mm", "a4");
            buildPDFContent(pdf, contract, sigs);
            const fileName = `contrato_${contract.nome?.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`;
            pdf.save(fileName);
        } catch (err: any) {
            alert("Erro ao gerar PDF: " + err.message);
        } finally {
            setGeneratingPDF(null);
        }
    };

    const buildPDFContent = (
        pdf: jsPDF,
        contract: Contract,
        sigs: { s1: string; s2: string; s3: string }
    ) => {
        const W = pdf.internal.pageSize.getWidth();
        const H = pdf.internal.pageSize.getHeight();
        const ML = 25, MR = 25;
        const TW = W - ML - MR;
        const BOTTOM = H - 20;
        let y = 25;

        const nome = contract.nome?.toUpperCase() || "___________________________";
        const cpf = contract.cpf || "___________________________";
        const rg = contract.rg || "_______________";
        const profissao = contract.profissao || "_______________";
        const natural = contract.naturalidade || "_______________";
        const nasc = contract.nascimento
            ? contract.nascimento.split("-").reverse().join("/")
            : "__/__/____";

        const dataAssinatura = getContractDate(contract) ?? new Date();
        const dataAtual = dataAssinatura.toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

        const newPageIfNeeded = (needed = 18) => {
            if (y + needed > BOTTOM) { pdf.addPage(); y = 25; }
        };

        const text = (str: string, xPos: number, yPos: number, opts: any = {}) => {
            const { size = 10, bold = false, italic = false, align = "left", color = [20, 20, 20] } = opts;
            pdf.setFontSize(size);
            pdf.setFont("times", bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal");
            pdf.setTextColor(color[0], color[1], color[2]);
            pdf.text(str, xPos, yPos, { align });
        };

        const para = (str: string, opts: any = {}) => {
            const { size = 10, bold = false, italic = false, color = [20, 20, 20] } = opts;
            pdf.setFontSize(size);
            pdf.setFont("times", bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal");
            pdf.setTextColor(color[0], color[1], color[2]);
            const lines = pdf.splitTextToSize(str, TW) as string[];
            const lh = size * 0.45;
            newPageIfNeeded(lines.length * lh + 3);
            pdf.text(lines, ML, y);
            y += lines.length * lh + 3;
        };

        const sectionTitle = (str: string) => {
            newPageIfNeeded(12);
            y += 4;
            text(str, ML, y, { size: 10, bold: true });
            y += 1.5;
            pdf.setDrawColor(120, 120, 120);
            pdf.setLineWidth(0.3);
            pdf.line(ML, y, ML + TW, y);
            y += 5;
        };

        const clause = (title: string, body: string) => {
            pdf.setFontSize(10);
            const lines = pdf.splitTextToSize(title + " " + body, TW) as string[];
            const lh = 10 * 0.45;
            newPageIfNeeded(lines.length * lh + 4);
            lines.forEach((line, i) => {
                if (i === 0) {
                    pdf.setFont("times", "bold"); pdf.setTextColor(20, 20, 20);
                    pdf.text(title + " ", ML, y);
                    const tw = pdf.getStringUnitWidth(title + " ") * (10 / pdf.internal.scaleFactor);
                    pdf.setFont("times", "normal");
                    pdf.text(line.substring(title.length + 1), ML + tw, y);
                } else {
                    pdf.setFont("times", "normal"); pdf.text(line, ML, y);
                }
                y += lh;
            });
            y += 3;
        };

        // ── Cabeçalho ──────────────────────────────────────────────────────────
        text("CONTRATO DE ADESÃO DE SÓCIO USUÁRIO (COLABORADOR)", W / 2, y, { size: 12, bold: true, align: "center" });
        y += 7;
        text("Protect Clube Mineiro de Tiro — CNPJ 01.244.200/0001-52", W / 2, y, { size: 9, align: "center", color: [80, 80, 80] });
        y += 3;
        pdf.setDrawColor(180, 180, 180); pdf.setLineWidth(0.5);
        pdf.line(ML, y, ML + TW, y);
        y += 8;

        para(`Pelo presente instrumento particular de CONTRATO DE ADESÃO DE SÓCIO USUÁRIO (COLABORADOR), de um lado, Protect Clube Mineiro de Tiro, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 01.244.200/0001-52, com sede na Rua General Andrade Neves, 622, Bairro Gutierrez, Belo Horizonte/MG, e posteriormente na Rua dos Radialistas, 38, Bairro Balneário Água Limpa, Nova Lima/MG, neste ato representada por quem de direito, doravante simplesmente denominada PROTECT; e, de outro lado, o(a) Sr.(a) ${nome}, profissão ${profissao}, inscrito(a) no RG nº ${rg}, portador(a) do CPF nº ${cpf}, natural de ${natural}, nascido(a) em ${nasc}, doravante simplesmente denominado(a) SÓCIO USUÁRIO (COLABORADOR).`);
        para("O proponente declara aceitar as cláusulas deste contrato sem restrições, bem como a eleição do foro da Comarca de Belo Horizonte/MG.", { italic: true, color: [60, 60, 60] });
        y += 3;

        sectionTitle("1. DO PREÇO E DA FORMA DE PAGAMENTO");
        clause("CLÁUSULA PRIMEIRA:", "O valor total do contrato, correspondente à cota trienal (vigente por três anos), é de R$ 3.600,00 (três mil e seiscentos reais), ficando isento o pagamento de taxa de contribuição social mensal.");
        clause("PARÁGRAFO PRIMEIRO:", "Declara o sócio usuário (colaborador), neste ato, ter ciência de que a revalidação do CR (Certificado de Registro) é feita, atualmente, de três em três anos.");
        clause("PARÁGRAFO SEGUNDO:", "O pagamento deverá ser efetuado no ato da assinatura deste contrato, no valor de R$ 1.200,00 (anuidade), correspondente à primeira parcela.");
        clause("PARÁGRAFO QUARTO:", "Será considerado inadimplente o sócio usuário (colaborador) que atrasar qualquer pagamento por período superior a 30 (trinta) dias do vencimento, ficando expressamente suspensos os direitos previstos nas cláusulas sexta e sétima deste contrato.");
        clause("PARÁGRAFO SEXTO:", "Em caso de atraso superior a 60 (sessenta) dias, o sócio será notificado. O cancelamento implicará multa de 30% sobre o valor total da cota trienal contratada.");

        sectionTitle("2. DAS OBRIGAÇÕES DA CONTRATADA PROTECT");
        clause("CLÁUSULA SEGUNDA:", "Permitir a frequência do sócio usuário (colaborador) às áreas comuns do Clube PROTECT dentro do horário de funcionamento, bem como a utilização dos estandes de tiro.");
        clause("CLÁUSULA TERCEIRA:", "Oferecer condições adequadas para a realização de cursos, testes de tiro e capacitação técnica, bem como manter despachantes no clube para pleitos junto à Polícia Federal e ao Exército.");
        clause("CLÁUSULA QUARTA:", "Manter as instalações em permanentes condições de uso; disponibilizar, a título gratuito e em caráter de empréstimo, óculos de proteção, abafadores e armas do acervo do clube para atiradores com CR válido.");

        sectionTitle("3. DOS DIREITOS DO SÓCIO USUÁRIO (COLABORADOR)");
        clause("CLÁUSULA SEXTA:", "Frequentar, utilizar e participar de todas as opções recreativas, desportivas e culturais, desde que esteja em dia com o pagamento da anuidade.");
        clause("CLÁUSULA SÉTIMA:", "Ter prioridade na tramitação de pleitos junto ao Exército e à Polícia Federal; prioridade na utilização de estandes; prioridade para realização de testes de tiro e capacitação técnica.");
        clause("CLÁUSULA DÉCIMA:", "Zelar pelo patrimônio do clube. É expressamente proibido que menores de 18 anos manuseiem, utilizem ou portem qualquer tipo de arma de fogo, à exceção daqueles com autorização judicial.");

        sectionTitle("4. DISPOSIÇÕES GERAIS");
        clause("CLÁUSULA DEZOITO:", "O sócio declara ter ciência de que CACs não possuem autorização para PORTE de arma, e sim, alguns deles, para POSSE e TRANSPORTE da arma, munições e acessórios, autorizados pelas GUIAS DE TRÁFEGO.");

        sectionTitle("5. DA RESCISÃO DO CONTRATO");
        clause("CLÁUSULA VINTE E UM:", "A rescisão ou cancelamento do presente contrato poderá se dar, em qualquer momento, por qualquer uma das partes, mediante termo expresso.");
        clause("PARÁGRAFO SEGUNDO:", "Em caso de rescisão ou cancelamento deste contrato, a parte que der ensejo à rescisão deverá pagar à outra parte 30% (trinta por cento) do valor da cota trienal.");
        clause("PARÁGRAFO TERCEIRO:", "O presente contrato reveste-se da força de título executivo extrajudicial, constituindo dívida líquida, certa e exigível.");

        sectionTitle("6. TERMO DE RESPONSABILIDADE");
        para("É expressamente proibido o ingresso e a utilização de armas sem registro no SIGMA ou no SINARM. É obrigatório transportar as armas desmuniciadas e usar óculos e protetores auriculares.");
        para("É EXPRESSAMENTE PROIBIDO O INGRESSO E A UTILIZAÇÃO DE ARMAS E MUNIÇÕES SEM PROCEDÊNCIA LEGAL E JUSTIFICADA.", { bold: true });

        // ── Assinaturas ────────────────────────────────────────────────────────
        newPageIfNeeded(90);
        y += 5;
        para("E, por estarem justas e contratadas, firmam o presente em 02 (duas) vias, na presença das testemunhas.");
        y += 6;

        const col = TW / 2 - 5;   // largura de cada coluna
        const sigH = 18;           // altura reservada para imagem (mm)
        const sigW = 45;           // largura máxima da imagem (mm)

        // ── Linha 1: Protect (esq) + Sócio (dir) ──────────────────────────────
        try { pdf.addImage(sigs.s2, "PNG", ML, y, sigW, sigH, undefined, "FAST"); } catch (_) {}
        // Sócio: espaço em branco intencional (sem imagem de assinatura)

        y += sigH + 1;

        pdf.setDrawColor(80, 80, 80); pdf.setLineWidth(0.4);
        pdf.line(ML, y, ML + col, y);
        pdf.line(ML + col + 10, y, ML + TW, y);
        y += 4;
        text("PROTECT CLUBE MINEIRO DE TIRO", ML, y, { size: 9, bold: true });
        text(nome, ML + col + 10, y, { size: 9, bold: true });
        y += 4;
        text("CNPJ: 01.244.200/0001-52", ML, y, { size: 8, color: [100, 100, 100] });
        text(`CPF: ${cpf}`, ML + col + 10, y, { size: 8, color: [100, 100, 100] });

        y += 16;

        // ── Linha 2: Testemunha 1 (esq) + Testemunha 2 (dir) ──────────────────
        try { pdf.addImage(sigs.s1, "PNG", ML, y, sigW, sigH, undefined, "FAST"); } catch (_) {}
        try { pdf.addImage(sigs.s3, "PNG", ML + col + 10, y, sigW, sigH, undefined, "FAST"); } catch (_) {}

        y += sigH + 1;

        pdf.line(ML, y, ML + col, y);
        pdf.line(ML + col + 10, y, ML + TW, y);
        y += 4;
        text("TESTEMUNHA 1", ML, y, { size: 8, color: [100, 100, 100] });
        text("TESTEMUNHA 2", ML + col + 10, y, { size: 8, color: [100, 100, 100] });
        y += 4;
        text("EMMERSON N. DO CARMO", ML, y, { size: 9 });
        text("NEWTON C. BAPTISTON", ML + col + 10, y, { size: 9 });
        y += 4;
        text("CPF: 001.583.866-80", ML, y, { size: 8, color: [100, 100, 100] });
        text("CPF: 584.978.896-49", ML + col + 10, y, { size: 8, color: [100, 100, 100] });
        y += 12;

        text(`Belo Horizonte/MG, ${dataAtual}`, W / 2, y, { size: 9, align: "center", color: [80, 80, 80] });
        y += 5;
        text("Rua General Andrade Neves, 622, Grajaú, CEP 30431-128, Belo Horizonte/MG", W / 2, y, { size: 7.5, align: "center", color: [120, 120, 120] });
        y += 4;
        text("clube@grupoprotect.com.br  ·  grupoprotect.com.br  ·  (31) 3371-8500", W / 2, y, { size: 7.5, align: "center", color: [120, 120, 120] });

        // ── Numeração de páginas ───────────────────────────────────────────────
        const totalPages = (pdf.internal as any).getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(160, 160, 160);
            pdf.text(`${i} / ${totalPages}`, W - MR, H - 10, { align: "right" });
        }
    };

    // ─── Email manual ──────────────────────────────────────────────────────────

    const handleSendEmail = async (contract: Contract) => {
        if (!contract.email) {
            showToast("Contrato sem email cadastrado", "error");
            return;
        }
        setSendingEmail(contract.id);
        try {
            const pdfBase64 = await generateContractPDFBase64(contract);
            const res = await fetch("/api/send-contract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: contract.nome,
                    email: contract.email,
                    cpf: contract.cpf,
                    pdfBase64,
                    cc: "clube@grupoprotect.com.br",
                }),
            });
            if (res.ok) {
                // Marcar email como enviado no Firebase
                await updateDoc(doc(db, COLLECTION_NAME, contract.id), {
                    emailEnviado: true,
                    dataEnvioEmail: Timestamp.now()
                });
                setEmailSentIds(prev => new Set([...prev, contract.id]));
                showToast(`Email enviado para ${contract.email}`, "success");
            } else {
                const err = await res.json();
                showToast(`Erro: ${err.error}`, "error");
            }
        } catch (err: any) {
            showToast("Falha ao enviar email", "error");
        } finally {
            setSendingEmail(null);
        }
    };

    // ─── Helpers ───────────────────────────────────────────────────────────────

    const filteredContracts = contracts.filter(c => {
        const matchesSearch = !searchTerm || (
            c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.cpf?.includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesStatus = statusFilter === "todos" || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDeleteContract = async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            setShowDeleteModal(false);
            setContractToDelete(null);
        } catch (err: any) {
            alert("Erro ao deletar: " + err.message);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, COLLECTION_NAME, id), {
                status: newStatus,
                updatedAt: Timestamp.now()
            });
            setEditingStatus(null);
        } catch (err: any) {
            alert("Erro ao atualizar: " + err.message);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "ativo":
            case "assinado": return "bg-emerald-100 text-emerald-800 border-emerald-300";
            case "pendente": return "bg-amber-100 text-amber-800 border-amber-300";
            case "cancelado": return "bg-red-100 text-red-800 border-red-300";
            default: return "bg-slate-100 text-slate-800 border-slate-300";
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-100 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
                    ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
                >
                    {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {toast.message}
                </div>
            )}

            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowLeft size={20} className="text-slate-700" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="text-emerald-600" size={28} />
                                Gestão de Contratos
                            </h1>
                            <p className="text-sm text-slate-500">
                                {contracts.length} contratos · coleção:{" "}
                                <code className="text-xs bg-slate-100 px-1 rounded">{COLLECTION_NAME}</code>
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setShowDebug(!showDebug)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                        <Bug size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Debug */}
                {showDebug && (
                    <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-sm font-mono">
                        <div className="flex justify-between items-center mb-2">
                            <strong className="text-amber-900">Debug</strong>
                            <button onClick={() => setShowDebug(false)} className="cursor-pointer"><X size={16} /></button>
                        </div>
                        <p>Coleção: <strong>{COLLECTION_NAME}</strong></p>
                        <p>Total: <strong>{contracts.length}</strong></p>
                        <p>Filtrados: <strong>{filteredContracts.length}</strong></p>
                        <p>Emails enviados nesta sessão: <strong>{emailSentIds.size}</strong></p>
                        {error && <p className="text-red-600 mt-2">Erro: {error}</p>}
                        {contracts[0] && <p className="mt-2 text-xs text-slate-600">Campos 1º doc: {Object.keys(contracts[0]).join(", ")}</p>}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total", value: contracts.length, color: "text-slate-900" },
                        { label: "Assinados", value: contracts.filter(c => c.status === "assinado").length, color: "text-emerald-700" },
                        { label: "Pendentes", value: contracts.filter(c => c.status === "pendente").length, color: "text-amber-700" },
                        { label: "Hoje", value: contracts.filter(c => getContractDate(c)?.toDateString() === new Date().toDateString()).length, color: "text-blue-700" },
                    ].map(s => (
                        <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">{s.label}</p>
                            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CPF ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 cursor-pointer"
                    >
                        <option value="todos">Todos os status</option>
                        <option value="assinado">Assinados</option>
                        <option value="ativo">Ativos</option>
                        <option value="pendente">Pendentes</option>
                        <option value="cancelado">Cancelados</option>
                    </select>
                </div>

                {/* Tabela */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4" />
                            <p className="text-slate-500">Carregando contratos...</p>
                        </div>
                    ) : filteredContracts.length === 0 ? (
                        <div className="p-16 text-center text-slate-400">
                            <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Nenhum contrato encontrado</p>
                            <p className="text-sm mt-1">Coleção: <code>{COLLECTION_NAME}</code></p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Contratante</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Documentos</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Data</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredContracts.map((contract) => (
                                        <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                        {contract.nome?.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm">{contract.nome || "Sem nome"}</p>
                                                        <p className="text-xs text-slate-500">{contract.email || "—"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-xs text-slate-600 font-mono">CPF: {contract.cpf || "—"}</p>
                                                <p className="text-xs text-slate-600 font-mono">RG: {contract.rg || "—"}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-xs text-slate-600">
                                                    {getContractDate(contract)?.toLocaleDateString("pt-BR") || "—"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                {editingStatus === contract.id ? (
                                                    <select
                                                        defaultValue={contract.status}
                                                        onChange={(e) => handleUpdateStatus(contract.id, e.target.value)}
                                                        onBlur={() => setEditingStatus(null)}
                                                        autoFocus
                                                        className="px-2 py-1 border border-slate-300 rounded-lg text-xs text-slate-950 font-medium cursor-pointer"
                                                    >
                                                        <option value="assinado">Assinado</option>
                                                        <option value="ativo">Ativo</option>
                                                        <option value="pendente">Pendente</option>
                                                        <option value="cancelado">Cancelado</option>
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingStatus(contract.id)}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer hover:shadow-sm transition-all ${getStatusColor(contract.status)}`}
                                                    >
                                                        {(contract.status || "—").toUpperCase()}
                                                        <Edit3 size={10} className="opacity-50" />
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setViewingContract(contract)}
                                                        className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Ver detalhes"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => generateContractPDF(contract)}
                                                        disabled={generatingPDF === contract.id}
                                                        className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                                                        title="Baixar PDF"
                                                    >
                                                        {generatingPDF === contract.id
                                                            ? <RefreshCw size={16} className="animate-spin" />
                                                            : <Printer size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleSendEmail(contract)}
                                                        disabled={sendingEmail === contract.id}
                                                        className={`p-2 rounded-lg transition-colors disabled:opacity-40 cursor-pointer
                                                            ${emailSentIds.has(contract.id)
                                                                ? "text-emerald-600 bg-emerald-50"
                                                                : "text-slate-500 hover:text-violet-700 hover:bg-violet-50"}`}
                                                        title={emailSentIds.has(contract.id) ? "Email já enviado (clique para reenviar)" : "Enviar por email"}
                                                    >
                                                        {sendingEmail === contract.id
                                                            ? <RefreshCw size={16} className="animate-spin" />
                                                            : emailSentIds.has(contract.id)
                                                                ? <CheckCircle size={16} />
                                                                : <Mail size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => { setContractToDelete(contract.id); setShowDeleteModal(true); }}
                                                        className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal: Visualizar */}
            {viewingContract && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Detalhes do Contrato</h2>
                            <button
                                onClick={() => setViewingContract(null)}
                                className="p-2 hover:bg-slate-600 rounded-lg transition-colors bg-slate-500 cursor-pointer"
                            >
                                <X size={18} className="text-white" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                                    {viewingContract.nome?.charAt(0) || "?"}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{viewingContract.nome}</h3>
                                    <p className="text-sm text-slate-500">{viewingContract.email}</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border mt-1 ${getStatusColor(viewingContract.status)}`}>
                                        {viewingContract.status?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ["CPF", viewingContract.cpf],
                                    ["RG", viewingContract.rg],
                                    ["Profissão", viewingContract.profissao],
                                    ["Naturalidade", viewingContract.naturalidade],
                                    ["Nascimento", viewingContract.nascimento],
                                    ["Versão", viewingContract.versaoContrato],
                                ].map(([k, v]) => (
                                    <div key={k} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">{k}</p>
                                        <p className="text-sm font-semibold text-slate-900">{v || "—"}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => generateContractPDF(viewingContract)}
                                    disabled={generatingPDF === viewingContract.id}
                                    className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {generatingPDF === viewingContract.id
                                        ? <><RefreshCw size={18} className="animate-spin" /> Gerando PDF...</>
                                        : <><Printer size={18} /> Baixar PDF</>}
                                </button>
                                <button
                                    onClick={() => handleSendEmail(viewingContract)}
                                    disabled={sendingEmail === viewingContract.id || !viewingContract.email}
                                    className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer
                                        ${emailSentIds.has(viewingContract.id)
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                            : "bg-violet-600 text-white hover:bg-violet-700"}`}
                                >
                                    {sendingEmail === viewingContract.id
                                        ? <><RefreshCw size={18} className="animate-spin" /> Enviando...</>
                                        : emailSentIds.has(viewingContract.id)
                                            ? <><CheckCircle size={18} /> Email enviado</>
                                            : <><Mail size={18} /> Enviar por email</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Confirmar exclusão */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={28} className="text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar Exclusão</h3>
                        <p className="text-sm text-slate-500 mb-5">
                            Tem certeza que deseja excluir o contrato de{" "}
                            <strong>{contracts.find(c => c.id === contractToDelete)?.nome}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setContractToDelete(null); }}
                                className="flex-1 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => contractToDelete && handleDeleteContract(contractToDelete)}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors cursor-pointer"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}