"use client";

import { useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function DirectUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null); // Novo estado para a thumb
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !thumbFile || !title) {
      return alert("Selecione o vídeo, a capa e dê um título!");
    }

    setUploading(true);
    
    try {
      // 1. Upload da Thumbnail (Capa) - Mais rápido, fazemos primeiro
      const thumbRef = ref(storage, `thumbnails/${Date.now()}-${thumbFile.name}`);
      await uploadBytes(thumbRef, thumbFile);
      const thumbURL = await getDownloadURL(thumbRef);

      // 2. Upload do Vídeo com progresso
      const storageRef = ref(storage, `videos/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on("state_changed", 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (error) => {
          console.error(error);
          setUploading(false);
          alert("Erro no upload do vídeo");
        },
        async () => {
          // 3. Pegar link do vídeo e salvar tudo no Firestore
          const videoURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, "videos"), {
            title,
            category: "Treinamento",
            videoUrl: videoURL,
            thumbnail: thumbURL, // Agora salva o link da imagem selecionada
            createdAt: serverTimestamp(),
            type: "local"
          });

          setUploading(false);
          router.push("/admin");
        }
      );
    } catch (error) {
      console.error(error);
      setUploading(false);
      alert("Erro ao processar arquivos");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-xl mx-auto">
        <Link href="/admin" className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-800">
          <ArrowLeft size={18} /> Voltar
        </Link>

        <div className="bg-white rounded-32 p-8 shadow-xl border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
              <Upload size={24} />
            </div>
            <h1 className="text-2xl font-black">Upload de Vídeo</h1>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase ml-1">Título do Vídeo</label>
              <input 
                required
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                placeholder="Ex: Instrução de Pistola 9mm"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Input da Thumbnail (Capa) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase ml-1">Capa do Vídeo (Imagem)</label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 hover:bg-slate-50 transition-colors text-center">
                <input 
                  required
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
                />
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <ImageIcon size={20} />
                  {thumbFile ? <span className="text-green-600 font-bold">{thumbFile.name}</span> : "Selecionar imagem de capa"}
                </div>
              </div>
            </div>

            {/* Input do Vídeo */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase ml-1">Arquivo de Vídeo</label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:bg-slate-50 transition-colors text-center">
                <input 
                  required
                  type="file" 
                  accept="video/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className="text-slate-400">
                  {file ? <span className="text-blue-600 font-bold">{file.name}</span> : "Clique para selecionar ou arraste o vídeo"}
                </div>
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-blue-600 uppercase">
                  <span>Enviando vídeo...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              disabled={uploading}
              className={`w-full py-5 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3 ${
                uploading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              {uploading ? <><Loader2 className="animate-spin" /> Subindo arquivos...</> : "Finalizar e Publicar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}