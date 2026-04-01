"use client";

import { useState, useCallback } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, Loader2, Image as ImageIcon, X, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";

type VideoItem = {
  id: string;
  videoFile: File | null;
  thumbFile: File | null;
  title: string;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

function createEmptyItem(): VideoItem {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    videoFile: null,
    thumbFile: null,
    title: "",
    status: "idle",
    progress: 0,
  };
}

export default function DirectUploadPage() {
  const router = useRouter();
  const [items, setItems] = useState<VideoItem[]>([createEmptyItem()]);
  const [uploading, setUploading] = useState(false);

  const update = (id: string, patch: Partial<VideoItem>) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const addItem = () => setItems((prev) => [...prev, createEmptyItem()]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    const invalid = items.find((i) => !i.videoFile || !i.title.trim());
    if (invalid) {
      return alert("Preencha título e vídeo em todos os itens.");
    }

    setUploading(true);

    for (const item of items) {
      update(item.id, { status: "uploading", progress: 0 });

      try {
        // 1. Upload da thumbnail (opcional)
        let thumbURL = "";
        if (item.thumbFile) {
          const thumbRef = ref(storage, `thumbnails/${Date.now()}-${item.thumbFile.name}`);
          await uploadBytes(thumbRef, item.thumbFile);
          thumbURL = await getDownloadURL(thumbRef);
        }

        // 2. Upload do vídeo com progresso
        const videoRef = ref(storage, `videos/${Date.now()}-${item.videoFile!.name}`);
        const uploadTask = uploadBytesResumable(videoRef, item.videoFile!);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              update(item.id, { progress: p });
            },
            (error) => {
              update(item.id, { status: "error", error: error.message });
              reject(error);
            },
            async () => {
              const videoURL = await getDownloadURL(uploadTask.snapshot.ref);

              await addDoc(collection(db, "videos"), {
                title: item.title,
                category: "Treinamento",
                videoUrl: videoURL,
                thumbnail: thumbURL,
                createdAt: serverTimestamp(),
                type: "local",
              });

              update(item.id, { status: "success", progress: 100 });
              resolve();
            }
          );
        });
      } catch (error: any) {
        update(item.id, { status: "error", error: error.message });
      }
    }

    setUploading(false);

    setItems((prev) => {
      const hasErrors = prev.some((i) => i.status === "error");
      if (!hasErrors) {
        setTimeout(() => router.push("/admin"), 1500);
      }
      return prev;
    });
  };

  const totalProgress =
    items.length > 0
      ? items.reduce((acc, i) => acc + i.progress, 0) / items.length
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-800">
          <ArrowLeft size={18} /> Voltar
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
            <Upload size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black">Upload de Vídeos</h1>
            <p className="text-slate-500 text-sm">Envie múltiplos vídeos de uma vez</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                item.status === "success"
                  ? "border-green-300 bg-green-50"
                  : item.status === "error"
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-bold text-slate-700 text-sm">
                    {item.title || "Novo vídeo"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === "success" && <CheckCircle2 size={20} className="text-green-500" />}
                  {item.status === "error" && <AlertCircle size={20} className="text-red-500" />}
                  {item.status === "uploading" && <Loader2 size={20} className="text-blue-500 animate-spin" />}
                  {item.status === "idle" && items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={uploading}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Título
                  </label>
                  <input
                    required
                    disabled={uploading}
                    value={item.title}
                    onChange={(e) => update(item.id, { title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm disabled:opacity-50"
                    placeholder="Ex: Instrução de Pistola 9mm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Thumbnail */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Capa{" "}
                      <span className="text-slate-300 normal-case font-normal tracking-normal">
                        (opcional)
                      </span>
                    </label>
                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-3 hover:bg-slate-50 transition-colors text-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={(e) => update(item.id, { thumbFile: e.target.files?.[0] || null })}
                      />
                      <div className="flex flex-col items-center gap-1 text-slate-400 pointer-events-none">
                        <ImageIcon size={18} />
                        {item.thumbFile ? (
                          <span className="text-green-600 font-bold text-xs truncate w-full text-center">
                            {item.thumbFile.name}
                          </span>
                        ) : (
                          <span className="text-xs">Selecionar imagem</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vídeo */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Vídeo
                    </label>
                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-3 hover:bg-slate-50 transition-colors text-center cursor-pointer">
                      <input
                        required={!item.videoFile}
                        type="file"
                        accept="video/*"
                        disabled={uploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={(e) => update(item.id, { videoFile: e.target.files?.[0] || null })}
                      />
                      <div className="flex flex-col items-center gap-1 text-slate-400 pointer-events-none">
                        <Upload size={18} />
                        {item.videoFile ? (
                          <span className="text-blue-600 font-bold text-xs truncate w-full text-center">
                            {item.videoFile.name}
                          </span>
                        ) : (
                          <span className="text-xs">Selecionar vídeo</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de progresso */}
                {item.status === "uploading" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-blue-600 uppercase">
                      <span>Enviando...</span>
                      <span>{Math.round(item.progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {item.status === "error" && (
                  <p className="text-xs text-red-500 font-medium">Erro: {item.error}</p>
                )}
              </div>
            </div>
          ))}

          {/* Adicionar mais */}
          {!uploading && (
            <button
              type="button"
              onClick={addItem}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all font-bold flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={18} /> Adicionar outro vídeo
            </button>
          )}

          {/* Progresso global */}
          {uploading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="flex justify-between text-xs font-black text-blue-600 uppercase">
                <span>Progresso geral</span>
                <span>{Math.round(totalProgress)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Botão submit */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-5 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" /> Subindo arquivos...
              </>
            ) : (
              `Publicar ${items.length} vídeo${items.length !== 1 ? "s" : ""}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}