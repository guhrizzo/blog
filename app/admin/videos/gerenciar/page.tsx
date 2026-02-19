"use client";

import { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Trash2, ArrowLeft, Video as VideoIcon, Loader2 } from "lucide-react";
import Link from "next/link";

// 1. Importar apenas o toast e o Toaster da SONNER
import { toast, Toaster } from "sonner";

interface VideoItem {
  id: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
}

export default function ManageVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vids = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VideoItem));
      setVideos(vids);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (video: VideoItem) => {
    if (!confirm(`Tem certeza que deseja excluir: "${video.title}"?`)) return;

    // 2. Na Sonner, o toast.loading retorna uma string/ID único
    const toastId = toast.loading("Removendo vídeo e arquivos...");

    try {
      // Deletar do Firestore
      await deleteDoc(doc(db, "videos", video.id));

      // Deletar arquivos do Storage
      if (video.videoUrl.includes("firebasestorage")) {
        const videoRef = ref(storage, video.videoUrl);
        await deleteObject(videoRef).catch(e => console.log("Erro video storage:", e));
      }
      
      if (video.thumbnail && video.thumbnail.includes("firebasestorage")) {
        const thumbRef = ref(storage, video.thumbnail);
        await deleteObject(thumbRef).catch(e => console.log("Erro thumb storage:", e));
      }

      // 3. Atualizar o toast existente usando o ID
      toast.success("Vídeo excluído com sucesso!", { id: toastId });
      
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível excluir o vídeo.", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      {/* 4. Adicione o Toaster aqui se ele não estiver no seu layout.tsx */}
      <Toaster position="top-right" richColors />

      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="flex items-center gap-2 text-slate-500 mb-8 hover:text-slate-800 transition-colors">
          <ArrowLeft size={20} /> Voltar ao Painel
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
            <VideoIcon size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Gerenciar Vídeos</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={40} /></div>
        ) : (
          <div className="grid gap-4">
            {videos.length === 0 && <p className="text-center py-10 text-slate-400 italic">Nenhum vídeo cadastrado.</p>}
            
            {videos.map((video) => (
              <div key={video.id} className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shrink-0">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} className="w-full h-full object-cover" alt="thumb" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><VideoIcon size={20}/></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 line-clamp-1">{video.title}</h3>
                    <p className="text-xs text-slate-400 font-mono truncate max-w-50 md:max-w-md">{video.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(video)}
                  className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-colors cursor-pointer group"
                  title="Excluir vídeo"
                >
                  <Trash2 size={22} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}