"use client";

import { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Trash2, ArrowLeft, Camera, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";

interface PhotoItem {
  id: string;
  title: string;
  url: string;
  category: string;
}

export default function ManagePhotosPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Busca as fotos em tempo real
  useEffect(() => {
    const q = query(collection(db, "galeria"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PhotoItem));
      setPhotos(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Função para excluir a foto
  const handleDelete = async (photo: PhotoItem) => {
    if (!confirm(`Tem certeza que deseja excluir a foto: "${photo.title}"?`)) return;

    const toastId = toast.loading("Removendo foto e arquivos...");

    try {
      // Deletar do Firestore
      await deleteDoc(doc(db, "galeria", photo.id));

      // Deletar do Storage (se a URL for do Firebase)
      if (photo.url.includes("firebasestorage")) {
        const photoRef = ref(storage, photo.url);
        await deleteObject(photoRef).catch(e => console.log("Erro ao deletar arquivo físico:", e));
      }

      toast.success("Foto removida com sucesso!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover a foto.", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <Toaster position="top-right" richColors />

      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho de Navegação */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
            <ArrowLeft size={20} /> Painel Administrativo
          </Link>
          <Link 
            href="/admin/galeria" 
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-yellow-500/20"
          >
            + Adicionar Foto
          </Link>
        </div>

        {/* Título da Página */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-sm">
            <Camera size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Gerenciar Galeria</h1>
            <p className="text-slate-500">Exclua ou visualize as fotos publicadas no site.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <Loader2 className="animate-spin text-yellow-500" size={40} />
            <p className="text-slate-400 animate-pulse">Carregando acervo...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.length === 0 && (
              <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-32 py-20 text-center">
                <p className="text-slate-400 italic">Nenhuma foto cadastrada na galeria.</p>
              </div>
            )}

            {photos.map((photo) => (
              <div 
                key={photo.id} 
                className="group bg-white rounded-4xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Preview da Imagem */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img 
                    src={photo.url} 
                    alt={photo.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                      {photo.category}
                    </span>
                  </div>
                </div>

                {/* Info e Ações */}
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 line-clamp-1 mb-4">{photo.title}</h3>
                  
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <a 
                      href={photo.url} 
                      target="_blank" 
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      <ExternalLink size={14} /> Ver Original
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}