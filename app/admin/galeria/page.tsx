"use client";

import { useState, useCallback } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, ArrowLeft, Loader2, UploadCloud, X, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";

type PhotoItem = {
  id: string;
  file: File;
  preview: string;
  title: string;
  category: string;
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
};

const CATEGORIES = ["Treinamento", "Eventos", "Clube"];

export default function AddPhotoPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [globalCategory, setGlobalCategory] = useState("Treinamento");

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newPhotos: PhotoItem[] = files.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      category: globalCategory,
      status: "idle",
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
    // Reset input so same files can be re-added if needed
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (!files.length) return;

      const newPhotos: PhotoItem[] = files.map((file) => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        category: globalCategory,
        status: "idle",
      }));

      setPhotos((prev) => [...prev, ...newPhotos]);
    },
    [globalCategory]
  );

  const updatePhoto = (id: string, field: "title" | "category", value: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const applyGlobalCategory = () => {
    setPhotos((prev) => prev.map((p) => ({ ...p, category: globalCategory })));
    toast.success("Categoria aplicada a todas as fotos.");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (photos.length === 0) {
      return toast.error("Adicione pelo menos uma foto.");
    }

    const invalid = photos.find((p) => !p.title.trim());
    if (invalid) {
      return toast.error("Todas as fotos precisam ter um título.");
    }

    setUploading(true);
    const toastId = toast.loading(`Enviando ${photos.length} foto(s)...`);

    let successCount = 0;
    let errorCount = 0;

    for (const photo of photos) {
      // Mark as uploading
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, status: "uploading" } : p))
      );

      try {
        const storageRef = ref(storage, `galeria/${Date.now()}_${photo.file.name}`);
        const snapshot = await uploadBytes(storageRef, photo.file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        await addDoc(collection(db, "galeria"), {
          title: photo.title,
          category: photo.category,
          url: downloadURL,
          createdAt: serverTimestamp(),
        });

        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, status: "success" } : p))
        );
        successCount++;
      } catch (error: any) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, status: "error", error: error.message } : p
          )
        );
        errorCount++;
      }
    }

    if (errorCount === 0) {
      toast.success(`${successCount} foto(s) publicada(s) com sucesso!`, { id: toastId });
      setTimeout(() => router.push("/admin"), 1800);
    } else {
      toast.error(`${errorCount} erro(s). ${successCount} foto(s) enviada(s).`, { id: toastId });
      setUploading(false);
    }
  };

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
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500 rounded-lg text-white">
              <ImageIcon size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Adicionar à Galeria
            </h1>
          </div>
          <p className="text-slate-500 italic">
            Selecione múltiplas fotos de uma vez. Cada uma pode ter título e categoria individuais.
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* Zona de Drop / Upload */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative group min-h-48 w-full rounded-3xl border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 hover:border-green-500 transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer shadow-sm"
          >
            <div className="text-center p-10 pointer-events-none">
              <UploadCloud size={48} className="mx-auto text-slate-300 mb-4 group-hover:text-green-400 transition-colors" />
              <p className="text-slate-500 font-semibold text-lg">
                Arraste as fotos aqui ou clique para selecionar
              </p>
              <p className="text-slate-400 text-sm mt-1">
                PNG, JPG ou WEBP — várias fotos ao mesmo tempo
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploading}
            />
          </div>

          {/* Categoria Global */}
          {photos.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  Aplicar categoria a todas
                </p>
                <select
                  value={globalCategory}
                  onChange={(e) => setGlobalCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-green-500 transition-all appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={applyGlobalCategory}
                className="shrink-0 px-5 py-3 bg-slate-100 hover:bg-green-500 hover:text-white text-slate-700 font-bold rounded-xl transition-all text-sm"
              >
                Aplicar a todas
              </button>
            </div>
          )}

          {/* Lista de Fotos */}
          {photos.length > 0 && (
            <div className="space-y-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    photo.status === "success"
                      ? "border-green-300 bg-green-50"
                      : photo.status === "error"
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    {/* Preview */}
                    <div className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={photo.preview}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Status overlay */}
                      {photo.status === "uploading" && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 size={22} className="text-white animate-spin" />
                        </div>
                      )}
                      {photo.status === "success" && (
                        <div className="absolute inset-0 bg-green-500/70 flex items-center justify-center">
                          <CheckCircle2 size={22} className="text-white" />
                        </div>
                      )}
                      {photo.status === "error" && (
                        <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                          <AlertCircle size={22} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Fields */}
                    <div className="flex-1 grid sm:grid-cols-2 gap-3 min-w-0">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Título
                        </label>
                        <input
                          required
                          type="text"
                          value={photo.title}
                          onChange={(e) => updatePhoto(photo.id, "title", e.target.value)}
                          placeholder="Título da foto"
                          disabled={uploading}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-green-500 focus:bg-white transition-all text-sm disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Categoria
                        </label>
                        <select
                          value={photo.category}
                          onChange={(e) => updatePhoto(photo.id, "category", e.target.value)}
                          disabled={uploading}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-green-500 focus:bg-white transition-all appearance-none text-sm disabled:opacity-50 cursor-pointer"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {photo.error && (
                        <p className="sm:col-span-2 text-xs text-red-500 font-medium">
                          Erro: {photo.error}
                        </p>
                      )}
                    </div>

                    {/* Remove button */}
                    {photo.status !== "uploading" && photo.status !== "success" && (
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        disabled={uploading}
                        className="shrink-0 self-start p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Counter */}
          {photos.length > 0 && (
            <p className="text-sm text-slate-400 text-center">
              {photos.length} foto{photos.length !== 1 ? "s" : ""} selecionada{photos.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || photos.length === 0}
            className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-green-500 hover:shadow-green-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" />
                Publicando...
              </>
            ) : (
              `Publicar ${photos.length > 0 ? photos.length + " " : ""}foto${photos.length !== 1 ? "s" : ""} na Galeria`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}