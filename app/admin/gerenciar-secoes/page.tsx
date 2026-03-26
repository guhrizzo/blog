"use client";

import { useEffect, useState, useRef } from "react";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import {
  Trash2,
  ArrowLeft,
  Layers,
  Loader2,
  ExternalLink,
  Save,
  CheckCircle2,
  GripVertical,
  ImageOff,
} from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";

interface PhotoItem {
  id: string;
  title: string;
  url: string;
  section: string;
  category?: string;
  description?: string;
  collectionName: string;
  order: number;
}

const COLLECTIONS = [
  { value: "galeria",   label: "Galeria Principal", emoji: "🖼️" },
  { value: "nova-lima", label: "Nova Lima",          emoji: "🏙️" },
  { value: "gutierrez", label: "Gutierrez",          emoji: "📍" },
  { value: "raja",      label: "Raja",               emoji: "✨" },
  { value: "guardas",   label: "Guardas",            emoji: "🛡️" },
  { value: "paz",       label: "Museu da Paz",       emoji: "☮️" },
  { value: "metatron",  label: "Metatron",           emoji: "🔯" },
];

export default function ManagePhotoSectionsPage() {
  const [photosByCollection, setPhotosByCollection] = useState<Record<string, PhotoItem[]>>({});
  const [activeTab, setActiveTab] = useState(COLLECTIONS[0].value);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTab, setSavedTab] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Refs para controlar o drag sem re-renders
  const dragIndex = useRef<number | null>(null);
  const dragCollection = useRef<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchAll = async () => {
      const result: Record<string, PhotoItem[]> = {};
      try {
        await Promise.all(
          COLLECTIONS.map(async ({ value }) => {
            const q = query(collection(db, value), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const items: PhotoItem[] = snapshot.docs.map((d, idx) => {
              const data = d.data();
              return {
                id: d.id,
                title: data.title || "Sem título",
                url: data.url || "",
                section: data.section || value,
                category: data.category,
                description: data.description,
                collectionName: value,
                order: typeof data.order === "number" ? data.order : idx,
              };
            });
            const hasCustomOrder = items.some((p) => typeof p.order === "number" && p.order !== items.indexOf(p));
            result[value] = hasCustomOrder
              ? [...items].sort((a, b) => a.order - b.order)
              : items;
          })
        );
        setPhotosByCollection(result);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar fotos");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    dragCollection.current = activeTab;
    // Necessário para Firefox
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (
      dragIndex.current === null ||
      dragIndex.current === index ||
      dragCollection.current !== activeTab
    ) return;

    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    const fromIndex = dragIndex.current;
    if (fromIndex === null || fromIndex === dropIndex || dragCollection.current !== activeTab) {
      setDragOverIndex(null);
      return;
    }

    setPhotosByCollection((prev) => {
      const list = [...(prev[activeTab] ?? [])];
      // Remove o item de origem e insere na posição de destino
      const [dragged] = list.splice(fromIndex, 1);
      list.splice(dropIndex, 0, dragged);
      return { ...prev, [activeTab]: list };
    });

    dragIndex.current = null;
    dragCollection.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    dragCollection.current = null;
    setDragOverIndex(null);
  };

  // ── Save order ─────────────────────────────────────────────────────────────

  const handleSaveOrder = async () => {
    const list = photosByCollection[activeTab];
    if (!list?.length) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      list.forEach((photo, idx) => {
        batch.update(doc(db, photo.collectionName, photo.id), { order: idx });
      });
      await batch.commit();
      setPhotosByCollection((prev) => ({
        ...prev,
        [activeTab]: list.map((p, idx) => ({ ...p, order: idx })),
      }));
      setSavedTab(activeTab);
      toast.success("Ordem salva com sucesso!");
      setTimeout(() => setSavedTab(null), 2500);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar ordem");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (photo: PhotoItem) => {
    if (!confirm(`Tem certeza que deseja excluir: "${photo.title}"?`)) return;
    const id = toast.loading("Removendo foto e arquivos...");
    try {
      await deleteDoc(doc(db, photo.collectionName, photo.id));
      if (photo.url.includes("firebasestorage")) {
        await deleteObject(ref(storage, photo.url)).catch(() => {});
      }
      setPhotosByCollection((prev) => ({
        ...prev,
        [photo.collectionName]: prev[photo.collectionName].filter((p) => p.id !== photo.id),
      }));
      toast.success("Foto removida com sucesso!", { id });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover a foto.", { id });
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeList = photosByCollection[activeTab] ?? [];
  const activeCollection = COLLECTIONS.find((c) => c.value === activeTab)!;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <Toaster position="top-right" richColors />

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            Painel Administrativo
          </Link>
          <Link
            href="/admin/adicionar-secoes"
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-yellow-500/20"
          >
            + Adicionar Foto
          </Link>
        </div>

        {/* Title */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-sm">
            <Layers size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Gerenciar Fotos do Site</h1>
            <p className="text-slate-500">Organize e reordene as fotos de cada coleção</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 mb-8 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {COLLECTIONS.map((col) => {
              const count = photosByCollection[col.value]?.length ?? 0;
              const isActive = activeTab === col.value;
              return (
                <button
                  key={col.value}
                  onClick={() => setActiveTab(col.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{col.emoji}</span>
                  <span>{col.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive
                        ? "bg-yellow-600/30 text-yellow-100"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <Loader2 className="animate-spin text-yellow-500" size={40} />
            <p className="text-slate-400 animate-pulse">Carregando acervo...</p>
          </div>
        ) : (
          <>
            {/* Section header + Save button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  {activeCollection.emoji} {activeCollection.label}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Arraste os cards para reordenar • clique em "Salvar Ordem" para confirmar
                </p>
              </div>

              {activeList.length > 0 && (
                <button
                  onClick={handleSaveOrder}
                  disabled={saving}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-60 ${
                    savedTab === activeTab
                      ? "bg-green-500 text-white shadow-green-500/20"
                      : "bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer shadow-yellow-500/20"
                  }`}
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : savedTab === activeTab ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <Save size={15} />
                  )}
                  {saving ? "Salvando..." : savedTab === activeTab ? "Salvo!" : "Salvar Ordem"}
                </button>
              )}
            </div>

            {/* Empty state */}
            {activeList.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-20 text-center">
                <ImageOff size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400 italic text-sm">
                  Nenhuma foto cadastrada nesta coleção.
                </p>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeList.map((photo, index) => {
                const isDragOver = dragOverIndex === index;
                return (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group bg-white rounded-3xl overflow-hidden border-2 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing active:opacity-50 active:scale-95 ${
                      isDragOver
                        ? "border-yellow-400 shadow-yellow-200 shadow-lg scale-[1.02]"
                        : "border-slate-200 hover:shadow-xl"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        draggable={false}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Position badge */}
                      <div className="absolute top-3 left-3 w-7 h-7 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md">
                        {index + 1}
                      </div>

                      {/* Category badge */}
                      {photo.category && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                            {photo.category}
                          </span>
                        </div>
                      )}

                      {/* Drag hint overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <GripVertical size={30} className="text-white/80" />
                      </div>
                    </div>

                    {/* Info & Actions */}
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 line-clamp-1 mb-4">
                        {photo.title}
                      </h3>

                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink size={14} />
                          Ver Original
                        </a>
                        <button
                          onClick={() => handleDelete(photo)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer group/btn"
                          title="Excluir Foto"
                        >
                          <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            {activeList.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-sm">
                <p className="text-slate-500 text-sm">
                  Exibindo{" "}
                  <span className="font-bold text-slate-900">{activeList.length}</span>{" "}
                  foto{activeList.length !== 1 ? "s" : ""} em{" "}
                  <span className="font-bold text-yellow-600">{activeCollection.label}</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}