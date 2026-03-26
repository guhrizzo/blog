"use client";

import { useState, useCallback } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, UploadCloud, Layers, X, CheckCircle2, ImagePlus } from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";

const SECTIONS = [
    { value: "gutierrez", label: "Clube Gutierrez", description: "Fotos do Clube Gutierrez", collection: "gutierrez" },
    { value: "raja", label: "Clube Raja", description: "Fotos do Clube Raja (fechado devido decreto)", collection: "raja" },
    { value: "nova-lima", label: "Nova Lima Alphaville", description: "Fotos do Clube Nova Lima Alphaville", collection: "nova-lima" },
    { value: "guardas", label: "Capacitação de Guardas", description: "Fotos que ilustram a capacitação de Guardas", collection: "guardas" },
    { value: "paz", label: "Museu da Paz", description: "Fotos do Museu da Paz", collection: "paz" },
    { value: "metatron", label: "Big Truck Metatron", description: "Fotos do Big Truck Metatron", collection: "metatron" },
];

interface FileItem {
    id: string;
    file: File;
    preview: string;
    title: string;
    description: string;
    status: "idle" | "uploading" | "done" | "error";
}

export default function AddPhotoSectionsPage() {
    const router = useRouter();
    const [section, setSection] = useState(SECTIONS[0].value);
    const [items, setItems] = useState<FileItem[]>([]);
    const [uploading, setUploading] = useState(false);

    const selectedSection = SECTIONS.find((s) => s.value === section)!;

    // ── Adiciona arquivos à fila ──────────────────────────────────────────────
    const addFiles = useCallback((files: FileList | File[]) => {
        const newItems: FileItem[] = Array.from(files).map((file) => ({
            id: `${Date.now()}_${Math.random()}`,
            file,
            preview: URL.createObjectURL(file),
            title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
            description: "",
            status: "idle",
        }));
        setItems((prev) => [...prev, ...newItems]);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) addFiles(e.target.files);
        e.target.value = "";
    };

    // ── Drag & drop ───────────────────────────────────────────────────────────
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    };

    // ── Edita título/descrição de um item ─────────────────────────────────────
    const updateItem = (id: string, field: "title" | "description", value: string) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    // ── Remove um item da fila ────────────────────────────────────────────────
    const removeItem = (id: string) => {
        setItems((prev) => {
            const item = prev.find((i) => i.id === id);
            if (item) URL.revokeObjectURL(item.preview);
            return prev.filter((i) => i.id !== id);
        });
    };

    // ── Upload de todos os itens ──────────────────────────────────────────────
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return toast.error("Adicione pelo menos uma imagem.");
        if (items.find((i) => !i.title.trim()))
            return toast.error("Dê um título para todas as imagens.");

        setUploading(true);
        const toastId = toast.loading(`Enviando ${items.length} foto(s)...`);

        let successCount = 0;
        let errorCount = 0;

        // Upload em chunks de 3 para não sobrecarregar
        const CHUNK = 3;
        const all = [...items];

        for (let i = 0; i < all.length; i += CHUNK) {
            const chunk = all.slice(i, i + CHUNK);

            await Promise.all(
                chunk.map(async (item) => {
                    setItems((prev) =>
                        prev.map((p) => (p.id === item.id ? { ...p, status: "uploading" } : p))
                    );

                    try {
                        const storagePath = `${section}/${Date.now()}_${item.file.name}`;
                        const storageRef = ref(storage, storagePath);
                        const snapshot = await uploadBytes(storageRef, item.file);
                        const downloadURL = await getDownloadURL(snapshot.ref);

                        await addDoc(collection(db, selectedSection.collection), {
                            title: item.title.trim(),
                            description: item.description.trim(),
                            url: downloadURL,
                            storagePath,
                            section,
                            createdAt: serverTimestamp(),
                        });

                        setItems((prev) =>
                            prev.map((p) => (p.id === item.id ? { ...p, status: "done" } : p))
                        );
                        successCount++;
                    } catch (err: any) {
                        console.error("Erro no upload do item:", item.file.name, err?.code, err?.message, err);
                        setItems((prev) =>
                            prev.map((p) => (p.id === item.id ? { ...p, status: "error" } : p))
                        );
                        errorCount++;
                    }
                })
            );
        }

        setUploading(false);

        if (errorCount === 0) {
            toast.success(`${successCount} foto(s) publicada(s) com sucesso!`, { id: toastId });
            setItems((prev) => prev.filter((i) => i.status === "error"));
        } else {
            toast.error(`${errorCount} erro(s) — ${successCount} foto(s) enviada(s).`, { id: toastId });
        }
    };

    const doneCount = items.filter((i) => i.status === "done").length;
    const pendingCount = items.filter((i) => i.status !== "done").length;

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
            <Toaster position="top-right" richColors />

            <div className="max-w-4xl mx-auto">

                {/* Voltar */}
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-8 font-medium"
                >
                    <ArrowLeft size={20} /> Voltar ao Painel
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500 rounded-lg text-white">
                            <Layers size={24} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Adicionar Fotos ao Site</h1>
                    </div>
                    <p className="text-slate-500">Selecione várias imagens de uma vez para enviar em lote</p>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">

                    {/* Seleção de Seção */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                            Seção do Site
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {SECTIONS.map((sec) => (
                                <button
                                    key={sec.value}
                                    type="button"
                                    onClick={() => setSection(sec.value)}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer text-left transition-all ${section === sec.value
                                            ? "border-purple-500 bg-purple-50"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                        }`}
                                >
                                    <p className="font-bold text-sm text-slate-900">{sec.label}</p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sec.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Zona de drop */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="relative group w-full rounded-3xl border-2 border-dashed border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50/30 transition-all flex flex-col items-center justify-center py-12 cursor-pointer"
                    >
                        <ImagePlus
                            size={40}
                            className="text-slate-300 mb-3 group-hover:text-purple-400 transition-colors"
                        />
                        <p className="text-slate-600 font-bold">Clique ou arraste as imagens aqui</p>
                        <p className="text-slate-400 text-xs mt-1">PNG, JPG ou WEBP • Várias de uma vez</p>

                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleInputChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={uploading}
                        />
                    </div>

                    {/* Fila de imagens */}
                    {items.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <p className="font-black text-sm uppercase tracking-wider text-slate-700">
                                    {items.length} {items.length === 1 ? "imagem" : "imagens"} na fila
                                </p>
                                {doneCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setItems((prev) => prev.filter((i) => i.status !== "done"))}
                                        className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                                    >
                                        Limpar enviadas ({doneCount})
                                    </button>
                                )}
                            </div>

                            {/* Lista */}
                            <div className="divide-y divide-slate-100">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 items-start">

                                        {/* Thumbnail */}
                                        <div className="relative shrink-0 w-20 h-16 rounded-xl overflow-hidden bg-slate-100">
                                            <img
                                                src={item.preview}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {item.status === "uploading" && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <Loader2 size={18} className="text-white animate-spin" />
                                                </div>
                                            )}
                                            {item.status === "done" && (
                                                <div className="absolute inset-0 bg-emerald-500/70 flex items-center justify-center">
                                                    <CheckCircle2 size={20} className="text-white" />
                                                </div>
                                            )}
                                            {item.status === "error" && (
                                                <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                                                    <X size={20} className="text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Campos */}
                                        <div className="flex-1 grid gap-2 min-w-0">
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => updateItem(item.id, "title", e.target.value)}
                                                placeholder="Título *"
                                                disabled={item.status === "uploading" || item.status === "done"}
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-purple-400 focus:bg-white transition-all disabled:opacity-50"
                                            />
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                                placeholder="Descrição (opcional)"
                                                disabled={item.status === "uploading" || item.status === "done"}
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-purple-400 focus:bg-white transition-all disabled:opacity-50"
                                            />
                                        </div>

                                        {/* Remover */}
                                        {item.status !== "uploading" && item.status !== "done" && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="shrink-0 p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Footer destino */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-purple-50/40">
                                <p className="text-xs text-purple-700 font-medium">
                                    📍 Destino: <strong>{selectedSection.label}</strong> — {selectedSection.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Botão publicar */}
                    {pendingCount > 0 && (
                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-purple-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Publicando ({doneCount}/{items.length})...
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={18} />
                                    Publicar {pendingCount} foto(s) em "{selectedSection.label}"
                                </>
                            )}
                        </button>
                    )}

                </form>
            </div>
        </div>
    );
}