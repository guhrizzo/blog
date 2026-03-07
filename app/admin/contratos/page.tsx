// app/admin/contratos/page.tsx (CORREÇÕES COMPLETAS)
"use client";

import { useState, useEffect } from "react";
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
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    ArrowLeft,
    Search,
    Download,
    Trash2,
    Eye,
    X,
    AlertCircle,
    RefreshCw,
    PlusCircle,
    ShieldCheck,
    FileText,
    Bug,
    Edit3,
    Printer
} from "lucide-react";
import jsPDF from "jspdf";

const COLLECTION_NAME = "assinaturas_contrato";

interface Contract {
    id: string;
    nome?: string;
    email?: string;
    cpf?: string;
    rg?: string;
    naturalidade?: string;
    nascimento?: string;
    dataAssinatura?: Timestamp;
    dataAssinaturaString?: string;
    versaoContrato?: string;
    status?: string;
    organizacao?: string;
    ipAddress?: string;
    hash?: string;
    createdAt?: Timestamp;
}

export default function ContractsPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "pendente" | "assinado" | "cancelado">("todos");
    const [user, setUser] = useState<any>(null);
    const [viewingContract, setViewingContract] = useState<Contract | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contractToDelete, setContractToDelete] = useState<string | null>(null);
    const [editingStatus, setEditingStatus] = useState<string | null>(null);
    const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/login");
                return;
            }
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, COLLECTION_NAME), limit(100));
        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setContracts(data);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [user]);

    const filteredContracts = contracts.filter(c => {
        const matchesSearch = !searchTerm ||
            (c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.cpf?.includes(searchTerm) ||
                c.email?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "todos" || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const deleteContract = async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            setShowDeleteModal(false);
            setContractToDelete(null);
        } catch (err: any) {
            alert("Erro ao deletar: " + err.message);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
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

    // ==================== PDF CORRIGIDO ====================



    const generateContractPDF = (contract: Contract) => {
        setGeneratingPDF(contract.id);

        try {
            const doc = new jsPDF("p", "mm", "a4");
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const marginX = 20;
            const contentWidth = pageWidth - (marginX * 2);
            let y = 25;

            // Cores
            const COLOR_TEXT = [30, 30, 30]; // #1a1a1a - texto escuro
            const COLOR_TEXT_LIGHT = [80, 80, 80]; // cinza médio
            const COLOR_AMBER = [179, 134, 0]; // #b38600
            const COLOR_YELLOW = [255, 183, 3]; // #ffb703
            const COLOR_BLUE = [100, 149, 237];
            const COLOR_RED = [220, 38, 38];

            const setSerif = () => doc.setFont("times", "normal");
            const setBold = () => doc.setFont("times", "bold");
            const setSans = () => doc.setFont("helvetica", "normal");

            // FUNÇÃO: Adicionar parágrafo normal (alinhado à esquerda)
            const addText = (text: string, yPos: number, options: {
                fontSize?: number;
                isBold?: boolean;
                isItalic?: boolean;
                color?: number[];
                maxWidth?: number;
            } = {}) => {
                const {
                    fontSize = 10,
                    isBold = false,
                    isItalic = false,
                    color = COLOR_TEXT,
                    maxWidth = contentWidth
                } = options;

                doc.setFontSize(fontSize);
                if (isBold && isItalic) {
                    doc.setFont("times", "bolditalic");
                } else if (isBold) {
                    setBold();
                } else if (isItalic) {
                    doc.setFont("times", "italic");
                } else {
                    setSerif();
                }

                doc.setTextColor(color[0], color[1], color[2]);

                // Verificar nova página
                const lines = doc.splitTextToSize(text, maxWidth);
                const lineHeight = fontSize * 0.55;

                if (yPos + (lines.length * lineHeight) > pageHeight - 25) {
                    doc.addPage();
                    // Redesenhar fundo
                    doc.setFillColor(245, 245, 245);
                    doc.rect(0, 0, pageWidth, pageHeight, "F");
                    doc.setFillColor(255, 255, 255);
                    doc.rect(12, 12, pageWidth - 24, pageHeight - 24, "F");
                    yPos = 25;
                }

                doc.text(lines, marginX, yPos);
                return yPos + (lines.length * lineHeight) + 3;
            };
            const writeInline = (text: string, x: number, y: number) => {
                const width = doc.getTextWidth(text);

                if (x + width > pageWidth - marginX) {
                    y += 5;
                    x = marginX;
                }

                doc.text(text, x, y);
                return { x: x + width, y };
            };
            // FUNÇÃO: Adicionar cláusula com título inline
            const addClauseInline = (title: string, content: string, yPos: number) => {
                // Título em âmbar
                setBold();
                doc.setFontSize(10);
                doc.setTextColor(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2]);

                const titleWidth = doc.getTextWidth(title + " ");
                const titleLines = doc.splitTextToSize(title, contentWidth);

                // Se o título for muito longo, quebra linha
                if (titleWidth > contentWidth * 0.4) {
                    doc.text(titleLines, marginX, yPos);
                    yPos += (titleLines.length * 4.5);

                    // Conteúdo na linha de baixo
                    setSerif();
                    doc.setFontSize(10);
                    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
                    const contentLines = doc.splitTextToSize(content, contentWidth - 10);
                    doc.text(contentLines, marginX + 5, yPos);
                    return yPos + (contentLines.length * 4.5) + 3;
                }

                // Título e conteúdo na mesma linha
                doc.text(title + " ", marginX, yPos);

                // Conteúdo
                setSerif();
                doc.setFontSize(10);
                doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

                const contentX = marginX + titleWidth;
                const contentWidthAvailable = contentWidth - titleWidth;
                const contentLines = doc.splitTextToSize(content, contentWidthAvailable);

                doc.text(contentLines, contentX, yPos);

                return yPos + (contentLines.length * 4.5) + 3;
            };

            // FUNÇÃO: Quebrar texto em múltiplas linhas se necessário
            const wrapText = (text: string, maxWidth: number): string[] => {
                return doc.splitTextToSize(text, maxWidth) as string[];
            };

            // CABEÇALHO
            doc.setFillColor(245, 245, 245);
            doc.rect(0, 0, pageWidth, pageHeight, "F");

            doc.setFillColor(255, 255, 255);
            doc.rect(12, 12, pageWidth - 24, pageHeight - 24, "F");
            doc.setDrawColor(220, 220, 220);
            doc.rect(12, 12, pageWidth - 24, pageHeight - 24, "S");

            // MARCA D'ÁGUA
            doc.setTextColor(240, 240, 240);
            doc.setFontSize(100);
            doc.setFont("helvetica", "bold");
            doc.text("P", pageWidth / 2, pageHeight / 2, { align: "center", angle: 20 });

            // TÍTULO
            setBold();
            doc.setFontSize(14);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

            doc.text("CONTRATO DE ADESÃO DE SÓCIO USUÁRIO", pageWidth / 2, y, { align: "center" });

            y += 7;

            doc.setFontSize(12);
            doc.text("(COLABORADOR)", pageWidth / 2, y, { align: "center" });

            // Linha amarela
            y += 6;

            doc.setDrawColor(COLOR_YELLOW[0], COLOR_YELLOW[1], COLOR_YELLOW[2]);
            doc.setLineWidth(1.5);
            doc.line((pageWidth - 80) / 2, y, (pageWidth + 80) / 2, y);

            y += 12;

            // INTRODUÇÃO
            y = addText(
                `Pelo presente instrumento particular de CONTRATO DE ADESÃO DE SÓCIO USUÁRIO (COLABORADOR), de um lado Protect Clube Mineiro de Tiro, pessoa jurídica de direito privado, inscrita no CNPJ sob o número 01.244.200/0001-52, com sede na RUA GENERAL ANDRADE NEVES, 622, Bairro Grajaú, Belo Horizonte e posteriormente na Rua dos Radialistas, 38, Bairro Balneário Água Limpa, Nova Lima – MG, neste ato representado por quem de direito, doravante simplesmente denominada PROTECT.`,
                y,
                { fontSize: 10 }
            );

            // DADOS DO CONTRATANTE - LAYOUT CORRIGIDO
            const nome = contract.nome?.toUpperCase() || "___________________________";
            const rg = contract.rg || "_______________";
            const cpf = contract.cpf || "_______________";
            const naturalidade = contract.naturalidade || "_______________";
            const nascimento = contract.nascimento ? new Date(contract.nascimento).toLocaleDateString('pt-BR') : "__/__/____";

            // Linha 1: "De outro lado o(a) Sr(a) [NOME] brasileiro(a),"
            setSerif();
            doc.setFontSize(10);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

            const contratanteText = `De outro lado o(a) Sr(a) ${nome} brasileiro(a), RG nº ${rg},
portador do CPF nº ${cpf}, natural de ${naturalidade}, nascido em ${nascimento},
doravante denominado SÓCIO USUÁRIO (COLABORADOR).`;

            doc.setFont("times", "normal");
            doc.setFontSize(10);

            const lines = doc.splitTextToSize(contratanteText, contentWidth);
            doc.text(lines, marginX, y);

            y += lines.length * 4.5 + 3;

            // TEXTO DE ACEITAÇÃO (itálico, com borda amarela)
            const acceptText = "Têm entre si justos e contratados o direito de sócio usuário (colaborador) da Protect, tudo de acordo com as condições especificadas nesta contratação/adesão e na legislação vigente que regulamenta a disposição, utilização, compra, venda, repasse e outros inerentes aos produtos controlados (armas, munições e acessórios) a este vinculado, como se dele transcrito fosse, pelo que o proponente declara aceitar as suas cláusulas sem restrições.";

            // Borda amarela
            doc.setFillColor(COLOR_YELLOW[0], COLOR_YELLOW[1], COLOR_YELLOW[2]);
            doc.rect(marginX - 3, y - 3, 2, 20, "F");

            y = addText(acceptText, y, { isItalic: true, color: [100, 100, 100], fontSize: 10 });
            y += 6;

            // SEÇÃO 1: DO PREÇO
            setBold();
            doc.setFontSize(12);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text("1. DO PREÇO E DA FORMA DE PAGAMENTO", marginX, y);
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(marginX, y + 2, marginX + 90, y + 2);
            y += 8;

            // CLÁUSULA PRIMEIRA
            y = addClauseInline("CLÁUSULA PRIMEIRA:", "O valor total do contrato, da cota trienal (que vigora por três anos) contratada, é de R$ 3.600,00 (Três mil e seiscentos reais), isento de pagamentos da taxa de contribuição social (mensalidades).", y);

            // PARÁGRAFO PRIMEIRO (caixa azul)
            const para1Y = y;
            const para1Text = "Declara o sócio usuário (colaborador), neste ato, ter ciência que a revalidação do CR (Certificado de Registro) é feita, atualmente, de três em três anos.";

            // Medir altura
            setSerif();
            doc.setFontSize(9);
            const para1Lines = wrapText(para1Text, contentWidth - 8);
            const para1Height = (para1Lines.length * 4) + 10;

            // Desenhar caixa
            doc.setFillColor(240, 248, 255);
            doc.setDrawColor(COLOR_BLUE[0], COLOR_BLUE[1], COLOR_BLUE[2]);
            doc.rect(marginX, para1Y - 3, contentWidth, para1Height, "FD");

            // Título
            setBold();
            doc.setFontSize(9);
            doc.setTextColor(COLOR_BLUE[0], COLOR_BLUE[1], COLOR_BLUE[2]);
            doc.text("PARÁGRAFO PRIMEIRO:", marginX + 3, para1Y + 4);

            // Conteúdo
            setSerif();
            doc.setFontSize(9);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text(para1Lines, marginX + 3, para1Y + 9);

            y = para1Y + para1Height + 3;

            // PARÁGRAFO SEGUNDO
            y = addClauseInline("PARÁGRAFO SEGUNDO:", "O pagamento, pelo sócio usuário (colaborador), deverá ser feito no ato da assinatura deste contrato, no valor de R$ 1.200,00 (anuidade) da primeira parcela, salvo algum desconto ou condições de pagamentos diferenciadas, sendo que em caso de pagamento parcelado o valor remanescente será reajustado ao final de cada ano, pelo IGPM ou, em caso de extinção deste, de outro regulador monetário em vigência à época do reajuste.", y);

            // Texto em itálico
            y = addText("Independente da data de entrada o pagamento será anual e válido até o último dia de dezembro, dando início em janeiro a um novo ano e uma nova taxa a vencer no décimo dia deste mês.", y, { isItalic: true, color: [100, 100, 100], fontSize: 9 });
            y += 4;

            // CAIXA DE INADIMPLÊNCIA
            const inadText = "PARÁGRAFO QUARTO: Será considerado inadimplente o sócio usuário (colaborador) que atrasar qualquer dos pagamentos por período maior que o de 30 (trinta) dias do vencimento, ficando expressamente suspensos os direitos do sócio usuário (colaborador), cláusulas sexta e sétima deste contrato, independente de comunicação prévia, até que os valores em débito sejam quitados.";

            const inadLines = wrapText(inadText, contentWidth - 10);
            const inadHeight = (inadLines.length * 4) + 12;

            doc.setFillColor(254, 242, 242);
            doc.setDrawColor(252, 165, 165);
            doc.roundedRect(marginX, y, contentWidth, inadHeight, 2, 2, "FD");

            setBold();
            doc.setFontSize(10);
            doc.setTextColor(180, 50, 50);
            doc.text("⚠ Inadimplência", marginX + 5, y + 7);

            setSerif();
            doc.setFontSize(9);
            doc.setTextColor(100, 60, 60);
            doc.text(inadLines, marginX + 5, y + 13);

            y += inadHeight + 6;

            // Verificar nova página
            if (y > pageHeight - 100) {
                doc.addPage();
                y = 25;
                doc.setFillColor(245, 245, 245);
                doc.rect(0, 0, pageWidth, pageHeight, "F");
                doc.setFillColor(255, 255, 255);
                doc.rect(12, 12, pageWidth - 24, pageHeight - 24, "F");
            }

            // SEÇÃO 2
            setBold();
            doc.setFontSize(12);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text("2. DAS OBRIGAÇÕES DA CONTRATADA PROTECT", marginX, y);
            doc.line(marginX, y + 2, marginX + 95, y + 2);
            y += 8;

            y = addClauseInline("CLÁUSULA SEGUNDA:", "Permitir a frequência do sócio usuário (colaborador) às áreas comuns do Clube PROTECT dentro do horário de funcionamento; permitir a utilização dos estandes de tiro, ressalvando a hipótese de o local estar sendo utilizado por determinadas categorias profissionais, tais como Guardas Municipais, Policiais e outros, bem como nas hipóteses em que estes estiverem sendo utilizados para cursos, capacitação ou afins.", y);

            y = addClauseInline("CLÁUSULA TERCEIRA:", "Oferecer condições adequadas para realização de cursos, teste de tiro e capacitação técnica, atividades sociais, culturais, recreativas e desportivas, bem como manter despachantes no clube para promoção de pleitos junto a Polícia Federal e Exército, ressalvando que os serviços documentais e os de despachantes serão cobrados em separado, mediante prévia autorização e contratação específica de serviços requeridos pelo interessado.", y);

            // Nova página se necessário
            if (y > pageHeight - 120) {
                doc.addPage();
                y = 25;
                doc.setFillColor(245, 245, 245);
                doc.rect(0, 0, pageWidth, pageHeight, "F");
                doc.setFillColor(255, 255, 255);
                doc.rect(12, 12, pageWidth - 24, pageHeight - 24, "F");
            }

            // SEÇÃO 3
            setBold();
            doc.setFontSize(12);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text("3. DOS DIREITOS DO SÓCIO USUÁRIO (COLABORADOR)", marginX, y);
            doc.line(marginX, y + 2, marginX + 105, y + 2);
            y += 8;

            y = addClauseInline("CLÁUSULA SEXTA:", "Frequentar, utilizar e participar de todas as opções recreativas, desportivas e culturais, desde que esteja em dia com o pagamento da anuidade, ressalvando que o sócio usuário (colaborador) declara, neste ato, ter ciência que cursos, testes de capacitação e tiro, bem como algumas opções recreativas, desportivas e culturais serão disponibilizadas a título oneroso, sem valor previamente fixado, a ser calculado evento a evento.", y);

            // CAIXA VERDE DE PRIORIDADES
            const prioridades = [
                "• Prioridade na tramitação de pleitos junto ao Exército e Polícia Federal",
                "• Prioridade na utilização de Estandes",
                "• Prioridade para realização de testes de tiro e capacitação técnica",
                "• Prioridade nas vagas para participação em opções recreativas"
            ];

            const prioHeight = (prioridades.length * 4.5) + 12;
            doc.setFillColor(240, 253, 244);
            doc.setDrawColor(134, 239, 172);
            doc.roundedRect(marginX, y, contentWidth, prioHeight, 2, 2, "FD");

            setBold();
            doc.setFontSize(10);
            doc.setTextColor(20, 83, 45);
            doc.text("Prioridades do Sócio:", marginX + 5, y + 7);

            setSerif();
            doc.setFontSize(9);
            prioridades.forEach((p, i) => {
                doc.text(p, marginX + 5, y + 12 + (i * 4.5));
            });

            y += prioHeight + 5;

            // CAIXA ÂMBAR
            const alertaText = "CLÁUSULA DÉCIMA: Zelar pelo patrimônio do clube, responsabilizando-se por si, seus convidados, por danos ou despesas que venham a causar, sendo proibido que menores de 18 anos manuseiem, utilizem ou portem qualquer tipo de arma de fogo, à exceção daqueles com autorização judicial.";

            const alertaLines = wrapText(alertaText, contentWidth - 8);
            const alertaHeight = (alertaLines.length * 4) + 8;

            doc.setFillColor(255, 251, 235);
            doc.setDrawColor(251, 191, 36);
            doc.setLineWidth(1);
            doc.line(marginX, y, marginX, y + alertaHeight);
            doc.setFillColor(255, 251, 235);
            doc.rect(marginX + 1, y, contentWidth - 1, alertaHeight, "F");

            setSerif();
            doc.setFontSize(9);
            doc.setTextColor(120, 53, 15);
            doc.text(alertaLines, marginX + 4, y + 6);

            y += alertaHeight + 6;

            // Nova página para rescisão
            if (y > pageHeight - 100) {
                doc.addPage();
                y = 25;
                doc.setFillColor(245, 245, 245);
                doc.rect(0, 0, pageWidth, pageHeight, "F");
                doc.setFillColor(255, 255, 255);
                doc.rect(12, 12, pageWidth - 24, pageHeight - 24, "F");
            }

            // SEÇÃO 5: RESCISÃO
            setBold();
            doc.setFontSize(12);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text("5. DA RESCISÃO DO CONTRATO", marginX, y);
            doc.line(marginX, y + 2, marginX + 70, y + 2);
            y += 8;

            y = addClauseInline("CLÁUSULA VINTE E UM:", "A rescisão ou cancelamento do presente contrato poderá se dar, em qualquer momento, por qualquer uma das partes, mediante termo expresso.", y);

            // CAIXA VERMELHA DA MULTA
            const multaBoxY = y + 3;
            const multaBoxHeight = 42;

            doc.setFillColor(254, 226, 226);
            doc.setDrawColor(252, 165, 165);
            doc.roundedRect(marginX + 15, multaBoxY, contentWidth - 30, multaBoxHeight, 3, 3, "FD");

            setBold();
            doc.setFontSize(11);
            doc.setTextColor(153, 27, 27);
            doc.text("MULTA DE RESCISÃO", pageWidth / 2, multaBoxY + 10, { align: "center" });

            setSerif();
            doc.setFontSize(9);
            doc.setTextColor(127, 29, 29);
            doc.text("PARÁGRAFO SEGUNDO: Em caso de rescisão ou cancelamento", pageWidth / 2, multaBoxY + 17, { align: "center" });
            doc.text("deste contrato a parte que der ensejo à rescisão ou cancelamento", pageWidth / 2, multaBoxY + 22, { align: "center" });
            doc.text("deverá pagar à outra parte", pageWidth / 2, multaBoxY + 27, { align: "center" });

            setBold();
            doc.setFontSize(24);
            doc.setTextColor(COLOR_RED[0], COLOR_RED[1], COLOR_RED[2]);
            doc.text("30%", pageWidth / 2, multaBoxY + 37, { align: "center" });

            y = multaBoxY + multaBoxHeight + 10;

            // Nova página para assinaturas se necessário
            if (y > pageHeight - 60) {
                doc.addPage();
                y = 30;
                doc.setFillColor(245, 245, 245);
                doc.rect(0, 0, pageWidth, pageHeight, "F");
                doc.setFillColor(255, 255, 255);
                doc.rect(12, 12, pageWidth - 24, pageHeight - 24, "F");
            }

            // RODAPÉ COM ASSINATURAS
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(marginX, y, pageWidth - marginX, y);

            y += 10;

            setSerif();
            doc.setFontSize(10);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text("E por justas e contratadas, firmam o presente, em 02 (duas) vias, na presença das testemunhas.", marginX, y);

            y += 15;

            const colWidth = contentWidth / 2;

            // PROTECT
            doc.setDrawColor(100, 100, 100);
            doc.line(marginX, y + 15, marginX + colWidth - 10, y + 15);

            setBold();
            doc.setFontSize(10);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text("PROTECT CLUBE MINEIRO DE TIRO", marginX, y + 22);

            setSans();
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text("CNPJ: 01.244.200/0001-52", marginX, y + 27);

            // CONTRATANTE
            doc.line(marginX + colWidth + 10, y + 15, pageWidth - marginX, y + 15);

            setBold();
            doc.setFontSize(10);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text(nome, marginX + colWidth + 10, y + 22);

            setSans();
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`CPF: ${cpf}`, marginX + colWidth + 10, y + 27);

            y += 35;

            // Data
            setSerif();
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            const dataAtual = new Date().toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            doc.text(`Belo Horizonte, MG, ${dataAtual}`, pageWidth / 2, y, { align: "center" });

            y += 10;

            // Contato
            setSans();
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 120);
            doc.text("RUA GENERAL ANDRADE NEVES, 622, GRAJAÚ, CEP 30431-128, BELO HORIZONTE-MG", pageWidth / 2, y, { align: "center" });
            doc.text("E-MAIL: CLUBE@GRUPOPROTECT.COM.BR | SITE: GRUPOPROTECT.COM.BR | WHATSAPP: (31) 3371-8500", pageWidth / 2, y + 4, { align: "center" });

            // SALVAR
            const fileName = `contrato_${contract.nome?.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

        } catch (err) {
            console.error("Erro ao gerar PDF:", err);
            alert("Erro ao gerar PDF: " + (err as Error).message);
        } finally {
            setGeneratingPDF(null);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "ativo":
            case "assinado":
                return "bg-emerald-100 text-emerald-800 border-emerald-300";
            case "pendente":
                return "bg-amber-100 text-amber-800 border-amber-300";
            case "cancelado":
                return "bg-red-100 text-red-800 border-red-300";
            default:
                return "bg-slate-100 text-slate-800 border-slate-300";
        }
    };

    // Função auxiliar para datas corrigida
    const getContractDate = (contract: Contract): Date | null => {
        if (contract.dataAssinatura?.toDate) {
            return contract.dataAssinatura.toDate();
        }
        if (contract.dataAssinaturaString) {
            return new Date(contract.dataAssinaturaString);
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                                <ArrowLeft size={20} className="text-slate-700" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="text-emerald-600" size={28} />
                                    Gestão de Contratos
                                </h1>
                                <p className="text-sm text-slate-600 font-medium">{contracts.length} contratos encontrados</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowDebug(!showDebug)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            >
                                <Bug size={20} />
                            </button>

                            
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* DEBUG PANEL */}
                {showDebug && (
                    <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-amber-900 flex items-center gap-2">
                                <Bug size={18} />
                                Debug Info
                            </h3>
                            <button
                                onClick={() => setShowDebug(false)}
                                className="p-1 text-amber-700 hover:bg-amber-200 rounded cursor-pointer transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-1 text-sm font-mono text-slate-800">
                            <p><strong>Coleção:</strong> {COLLECTION_NAME}</p>
                            <p><strong>Total:</strong> {contracts.length}</p>
                            <p><strong>Filtrados:</strong> {filteredContracts.length}</p>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs text-slate-600 uppercase font-bold mb-1">Total</p>
                        <p className="text-3xl font-black text-slate-900">{contracts.length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs text-emerald-700 uppercase font-bold mb-1">Ativos</p>
                        <p className="text-3xl font-black text-emerald-700">
                            {contracts.filter(c => c.status === "ativo").length}
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs text-amber-700 uppercase font-bold mb-1">Pendentes</p>
                        <p className="text-3xl font-black text-amber-700">
                            {contracts.filter(c => c.status === "pendente").length}
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs text-blue-700 uppercase font-bold mb-1">Hoje</p>
                        <p className="text-3xl font-black text-blue-700">
                            {contracts.filter(c => {
                                const data = getContractDate(c);
                                return data?.toDateString() === new Date().toDateString();
                            }).length}
                        </p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome, CPF, RG ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 cursor-pointer"
                        >
                            <option value="todos">Todos os status</option>
                            <option value="ativo">Ativos</option>
                            <option value="pendente">Pendentes</option>
                            <option value="assinado">Assinados</option>
                            <option value="cancelado">Cancelados</option>
                        </select>
                    </div>
                </div>

                {/* Tabela */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                            <p className="text-slate-600 font-medium">Carregando contratos...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Contratante</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Documentos</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredContracts.map((contract) => (
                                        <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {contract.nome?.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{contract.nome || "Sem nome"}</p>
                                                        <p className="text-sm text-slate-600">{contract.email || "Sem email"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm text-slate-700 font-mono">CPF: {contract.cpf || "-"}</p>
                                                <p className="text-sm text-slate-700 font-mono">RG: {contract.rg || "-"}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                {editingStatus === contract.id ? (
                                                    <select
                                                        value={contract.status}
                                                        onChange={(e) => updateStatus(contract.id, e.target.value)}
                                                        onBlur={() => setEditingStatus(null)}
                                                        autoFocus
                                                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 cursor-pointer"
                                                    >
                                                        <option value="ativo">Ativo</option>
                                                        <option value="pendente">Pendente</option>
                                                        <option value="assinado">Assinado</option>
                                                        <option value="cancelado">Cancelado</option>
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingStatus(contract.id)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer hover:shadow-md transition-all ${getStatusColor(contract.status)}`}
                                                    >
                                                        {(contract.status || "desconhecido").toUpperCase()}
                                                        <Edit3 size={12} className="opacity-60" />
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setViewingContract(contract)}
                                                        className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                                                        title="Visualizar"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => generateContractPDF(contract)}
                                                        disabled={generatingPDF === contract.id}
                                                        className="p-2 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Download PDF"
                                                    >
                                                        {generatingPDF === contract.id ? (
                                                            <RefreshCw size={18} className="animate-spin" />
                                                        ) : (
                                                            <Printer size={18} />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => { setContractToDelete(contract.id); setShowDeleteModal(true); }}
                                                        className="p-2 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
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

            {/* Modal Visualizar */}
            {viewingContract && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Detalhes do Contrato</h2>
                            <button
                                onClick={() => setViewingContract(null)}
                                className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                                    {viewingContract.nome?.charAt(0) || "?"}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900">{viewingContract.nome}</h3>
                                    <p className="text-slate-600">{viewingContract.email}</p>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-2 ${getStatusColor(viewingContract.status)}`}>
                                        {viewingContract.status?.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-xs text-slate-600 uppercase font-bold mb-1">CPF</p>
                                    <p className="font-semibold text-slate-900">{viewingContract.cpf || "-"}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-xs text-slate-600 uppercase font-bold mb-1">RG</p>
                                    <p className="font-semibold text-slate-900">{viewingContract.rg || "-"}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-xs text-slate-600 uppercase font-bold mb-1">Naturalidade</p>
                                    <p className="font-semibold text-slate-900">{viewingContract.naturalidade || "-"}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-xs text-slate-600 uppercase font-bold mb-1">Nascimento</p>
                                    <p className="font-semibold text-slate-900">{viewingContract.nascimento || "-"}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => generateContractPDF(viewingContract)}
                                disabled={generatingPDF === viewingContract.id}
                                className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generatingPDF === viewingContract.id ? (
                                    <RefreshCw size={20} className="animate-spin" />
                                ) : (
                                    <Printer size={20} />
                                )}
                                {generatingPDF === viewingContract.id ? "Gerando PDF..." : "Download PDF do Contrato"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Deletar */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Exclusão</h3>
                        <p className="text-slate-600 mb-4">
                            Tem certeza que deseja excluir o contrato de <strong>{contracts.find(c => c.id === contractToDelete)?.nome}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setContractToDelete(null); }}
                                className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => contractToDelete && deleteContract(contractToDelete)}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 cursor-pointer transition-colors"
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