// app/admin/assinaturas/page.tsx
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
    limit,
    addDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    ArrowLeft, Search, Trash2, Eye, X,
    AlertCircle, RefreshCw, PenTool, Edit3, CheckCircle, Plus
} from "lucide-react";

const COLLECTION_NAME = "assinaturas";

interface Signature {
    id: string;
    nomeCliente?: string;
    email?: string;
    cpf?: string;
    dataAssinatura?: Timestamp;
    dataAssinaturaString?: string;
    descricao?: string;
    status?: "ativo" | "pendente" | "cancelado";
    tipoContrato?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export default function SignaturesPage() {
    const router = useRouter();
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "pendente" | "cancelado">("todos");
    const [user, setUser] = useState<any>(null);
    const [viewingSignature, setViewingSignature] = useState<Signature | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [signatureToDelete, setSignatureToDelete] = useState<string | null>(null);
    const [editingStatus, setEditingStatus] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        nomeCliente: "",
        email: "",
        cpf: "",
        dataAssinatura: new Date().toISOString().split("T")[0],
        descricao: "",
        tipoContrato: "adesão_cliente",
        status: "ativo",
    });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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

        const unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Signature[];
                data.sort((a, b) => {
                    const ta = a.createdAt?.toMillis() ?? 0;
                    const tb = b.createdAt?.toMillis() ?? 0;
                    return tb - ta;
                });
                setSignatures(data);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const getSignatureDate = (signature: Signature): Date | null => {
        if (signature.dataAssinatura?.toDate) return signature.dataAssinatura.toDate();
        if (signature.dataAssinaturaString) return new Date(signature.dataAssinaturaString);
        return null;
    };

    const filteredSignatures = signatures.filter((s) => {
        const matchesSearch = !searchTerm || (
            s.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.cpf?.includes(searchTerm) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.tipoContrato?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesStatus = statusFilter === "todos" || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleAddSignature = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.nomeCliente.trim()) {
            showToast("Nome do cliente é obrigatório", "error");
            return;
        }

        setSubmitting(true);
        try {
            const newSignatureData = {
                nomeCliente: formData.nomeCliente,
                email: formData.email || null,
                cpf: formData.cpf || null,
                dataAssinatura: new Date(formData.dataAssinatura),
                dataAssinaturaString: formData.dataAssinatura,
                descricao: formData.descricao || null,
                tipoContrato: formData.tipoContrato,
                status: formData.status,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            await addDoc(collection(db, COLLECTION_NAME), newSignatureData);
            
            showToast("Assinatura adicionada com sucesso!", "success");
            setShowAddModal(false);
            setFormData({
                nomeCliente: "",
                email: "",
                cpf: "",
                dataAssinatura: new Date().toISOString().split("T")[0],
                descricao: "",
                tipoContrato: "adesão_cliente",
                status: "ativo",
            });
        } catch (err: any) {
            showToast(`Erro ao adicionar: ${err.message}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSignature = async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            showToast("Assinatura removida com sucesso", "success");
            setShowDeleteModal(false);
            setSignatureToDelete(null);
        } catch (err: any) {
            showToast(`Erro ao deletar: ${err.message}`, "error");
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, COLLECTION_NAME, id), {
                status: newStatus,
                updatedAt: Timestamp.now(),
            });
            showToast("Status atualizado com sucesso", "success");
            setEditingStatus(null);
        } catch (err: any) {
            showToast(`Erro ao atualizar: ${err.message}`, "error");
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "ativo":
                return "bg-emerald-100 text-emerald-800 border-emerald-300";
            case "pendente":
                return "bg-amber-100 text-amber-800 border-amber-300";
            case "cancelado":
                return "bg-red-100 text-red-800 border-red-300";
            default:
                return "bg-slate-100 text-slate-800 border-slate-300";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-100 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
                    ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
                >
                    {toast.type === "success" ? (
                        <CheckCircle size={16} />
                    ) : (
                        <AlertCircle size={16} />
                    )}
                    {toast.message}
                </div>
            )}

            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} className="text-slate-700" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <PenTool className="text-violet-600" size={28} />
                                Assinaturas de Contratos
                            </h1>
                            <p className="text-sm text-slate-500">
                                {signatures.length} assinaturas · coleção:{" "}
                                <code className="text-xs bg-slate-100 px-1 rounded">{COLLECTION_NAME}</code>
                            </p>
                        </div>
                    </div>

                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total", value: signatures.length, color: "text-slate-900" },
                        { label: "Ativas", value: signatures.filter((c) => c.status === "ativo").length, color: "text-emerald-700" },
                        { label: "Pendentes", value: signatures.filter((c) => c.status === "pendente").length, color: "text-amber-700" },
                        { label: "Hoje", value: signatures.filter((c) => getSignatureDate(c)?.toDateString() === new Date().toDateString()).length, color: "text-blue-700" },
                    ].map((s) => (
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
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 cursor-pointer"
                    >
                        <option value="todos">Todos os status</option>
                        <option value="ativo">Ativas</option>
                        <option value="pendente">Pendentes</option>
                        <option value="cancelado">Canceladas</option>
                    </select>
                </div>

                {/* Tabela */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mx-auto mb-4" />
                            <p className="text-slate-500">Carregando assinaturas...</p>
                        </div>
                    ) : filteredSignatures.length === 0 ? (
                        <div className="p-16 text-center text-slate-400">
                            <PenTool size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Nenhuma assinatura encontrada</p>
                            <p className="text-sm mt-1">
                                Clique em "Nova Assinatura" para adicionar uma nova
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            Cliente
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            Documentos
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            Tipo de Contrato
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            Data
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSignatures.map((signature) => (
                                        <tr key={signature.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                        {signature.nomeCliente?.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm">
                                                            {signature.nomeCliente || "Sem nome"}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {signature.email || "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-xs text-slate-600 font-mono">
                                                    CPF: {signature.cpf || "—"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-xs text-slate-600">
                                                    {signature.tipoContrato || "—"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-xs text-slate-600">
                                                    {getSignatureDate(signature)?.toLocaleDateString("pt-BR") || "—"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                {editingStatus === signature.id ? (
                                                    <select
                                                        defaultValue={signature.status}
                                                        onChange={(e) =>
                                                            handleUpdateStatus(signature.id, e.target.value)
                                                        }
                                                        onBlur={() => setEditingStatus(null)}
                                                        autoFocus
                                                        className="px-2 py-1 border border-slate-300 rounded-lg text-xs text-slate-950 font-medium cursor-pointer"
                                                    >
                                                        <option value="ativo">Ativo</option>
                                                        <option value="pendente">Pendente</option>
                                                        <option value="cancelado">Cancelado</option>
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingStatus(signature.id)}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer hover:shadow-sm transition-all ${getStatusColor(
                                                            signature.status
                                                        )}`}
                                                    >
                                                        {(signature.status || "—").toUpperCase()}
                                                        <Edit3 size={10} className="opacity-50" />
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setViewingSignature(signature)}
                                                        className="p-2 text-slate-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Ver detalhes"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSignatureToDelete(signature.id);
                                                            setShowDeleteModal(true);
                                                        }}
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
            {viewingSignature && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">
                                Detalhes da Assinatura
                            </h2>
                            <button
                                onClick={() => setViewingSignature(null)}
                                className="p-2 hover:bg-slate-600 rounded-lg transition-colors bg-slate-500 cursor-pointer"
                            >
                                <X size={18} className="text-white" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                                    {viewingSignature.nomeCliente?.charAt(0) || "?"}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">
                                        {viewingSignature.nomeCliente}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {viewingSignature.email}
                                    </p>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border mt-1 ${getStatusColor(
                                            viewingSignature.status
                                        )}`}
                                    >
                                        {viewingSignature.status?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ["CPF", viewingSignature.cpf],
                                    ["Tipo de Contrato", viewingSignature.tipoContrato],
                                    ["Data", getSignatureDate(viewingSignature)?.toLocaleDateString("pt-BR")],
                                    ["Email", viewingSignature.email],
                                ].map(([k, v]) => (
                                    <div key={k} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                                            {k}
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {v || "—"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {viewingSignature.descricao && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">
                                        Descrição
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        {viewingSignature.descricao}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Adicionar Assinatura */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">
                                Nova Assinatura
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-slate-600 rounded-lg transition-colors bg-slate-500 cursor-pointer"
                            >
                                <X size={18} className="text-white" />
                            </button>
                        </div>
                        <form onSubmit={handleAddSignature} className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">
                                    Nome do Cliente *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nomeCliente}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nomeCliente: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                    placeholder="Exemplo: João Silva"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">
                                        CPF
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cpf}
                                        onChange={(e) =>
                                            setFormData({ ...formData, cpf: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">
                                        Data de Assinatura
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dataAssinatura}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                dataAssinatura: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">
                                        Tipo de Contrato
                                    </label>
                                    <select
                                        value={formData.tipoContrato}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                tipoContrato: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                                    >
                                        <option value="adesão_cliente">Adesão Cliente</option>
                                        <option value="adesão_sócio">Adesão Sócio</option>
                                        <option value="renovação">Renovação</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            status: e.target.value as any,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                                >
                                    <option value="ativo">Ativo</option>
                                    <option value="pendente">Pendente</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">
                                    Descrição
                                </label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={(e) =>
                                        setFormData({ ...formData, descricao: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                                    placeholder="Notas adicionais..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 border-2 border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
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
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            Confirmar Exclusão
                        </h3>
                        <p className="text-sm text-slate-500 mb-5">
                            Tem certeza que deseja excluir a assinatura de{" "}
                            <strong>
                                {signatures.find((c) => c.id === signatureToDelete)?.nomeCliente}
                            </strong>
                            ?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSignatureToDelete(null);
                                }}
                                className="flex-1 py-3 border-2 border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() =>
                                    signatureToDelete &&
                                    handleDeleteSignature(signatureToDelete)
                                }
                                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors cursor-pointer"
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
