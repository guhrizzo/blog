"use client";

import { useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, ArrowLeft, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";

export default function AddPhotoPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Treinamento");
  const [uploading, setUploading] = useState(false);

  // Função para lidar com a seleção da imagem e gerar preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title) {
      return toast.error("Por favor, selecione uma imagem e dê um título.");
    }

    setUploading(true);
    const toastId = toast.loading("Enviando foto para a galeria...");

    try {
      // 1. Upload da imagem para o Firebase Storage
      const storageRef = ref(storage, `galeria/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Salvar dados no Firestore
      await addDoc(collection(db, "galeria"), {
        title,
        category,
        url: downloadURL,
        createdAt: serverTimestamp(),
      });

      toast.success("Foto publicada com sucesso!", { id: toastId });
      
      // 3. Redirecionar após sucesso
      setTimeout(() => {
        router.push("/admin"); // Ou para a página de gerenciar fotos
      }, 1500);

    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao fazer upload: " + error.message, { id: toastId });
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <Toaster position="top-right" richColors />

      <div className="max-w-2xl mx-auto">
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
            <div className="p-2 bg-yellow-500 rounded-lg text-white">
              <ImageIcon size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Adicionar à Galeria</h1>
          </div>
          <p className="text-slate-500 italic">As fotos aparecerão instantaneamente na galeria pública do site.</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleUpload} className="space-y-6">
          
          {/* Card de Upload */}
          <div className="bg-white rounded-32 border border-slate-200 p-8 shadow-sm">
            <div className="grid gap-6">
              
              {/* Título */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Título da Fotografia
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Treinamento de Elite - Módulo I"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:border-yellow-500 focus:bg-white transition-all"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:border-yellow-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="Treinamento">Treinamento</option>
                  <option value="Eventos">Eventos</option>
                  <option value="Clube">Clube</option>
                </select>
              </div>

              {/* Área da Imagem */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Arquivo de Imagem
                </label>
                <div className="relative group min-h-75 w-full rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-yellow-500 transition-all flex flex-col items-center justify-center overflow-hidden">
                  
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <p className="text-white font-bold flex items-center gap-2">
                          <UploadCloud /> Trocar Imagem
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-10">
                      <UploadCloud size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium">Arraste ou clique para selecionar</p>
                      <p className="text-slate-400 text-xs mt-1">PNG, JPG ou WEBP (Máx. 5MB)</p>
                    </div>
                  )}

                  <input
                    required={!preview}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Ação */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-yellow-500 hover:shadow-yellow-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" />
                Publicando...
              </>
            ) : (
              "Publicar na Galeria"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}