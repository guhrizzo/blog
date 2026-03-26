"use client";

import { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, getDocs } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Trash2, ArrowLeft, Layers, Loader2, ExternalLink, Filter } from "lucide-react";
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
}

const SECTIONS = [
  { value: "all", label: "Todas as Seções", collection: "" },
  { value: "galeria", label: "Galeria Principal", collection: "galeria" },
  { value: "home-hero", label: "Banner Principal (Home)", collection: "home-sections" },
  { value: "home-sobre", label: "Seção Sobre Nós", collection: "home-sections" },
  { value: "home-diferenciais", label: "Diferenciais/Benefícios", collection: "home-sections" },
  { value: "instrutores", label: "Equipe/Instrutores", collection: "team" },
  { value: "instalacoes", label: "Instalações", collection: "facilities" },
  { value: "eventos-destaque", label: "Eventos em Destaque", collection: "featured-events" },
  { value: "blog-capa", label: "Capas de Blog/Notícias", collection: "blog-images" },
];

export default function ManagePhotoSectionsPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Busca fotos de todas as collections
  useEffect(() => {
    const fetchAllPhotos = async () => {
      const allPhotos: PhotoItem[] = [];
      
      // Collections únicas (sem repetir home-sections)
      const collectionsToFetch = [
        "galeria",
        "nova-lima",
        "guttierez",
        "raja",
        "guardas",
        "paz",
        "metatron"
      ];

      try {
        for (const collectionName of collectionsToFetch) {
          const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          
          snapshot.docs.forEach(d => {
            const data = d.data();
            allPhotos.push({
              id: d.id,
              title: data.title || "Sem título",
              url: data.url || "",
              section: data.section || collectionName,
              category: data.category,
              description: data.description,
              collectionName
            });
          });
        }
        
        setPhotos(allPhotos);
        setFilteredPhotos(allPhotos);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar fotos:", error);
        toast.error("Erro ao carregar fotos");
        setLoading(false);
      }
    };

    fetchAllPhotos();
  }, []);

  // Filtrar fotos por seção
  useEffect(() => {
    if (selectedFilter === "all") {
      setFilteredPhotos(photos);
    } else {
      setFilteredPhotos(photos.filter(p => p.section === selectedFilter));
    }
  }, [selectedFilter, photos]);

  const handleDelete = async (photo: PhotoItem) => {
    if (!confirm(`Tem certeza que deseja excluir: "${photo.title}"?`)) return;

    const toastId = toast.loading("Removendo foto...");

    try {
      await deleteDoc(doc(db, photo.collectionName, photo.id));

      if (photo.url.includes("firebasestorage")) {
        const photoRef = ref(storage, photo.url);
        await deleteObject(photoRef).catch(e => console.log("Erro ao deletar arquivo:", e));
      }

      // Atualizar estado local
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      toast.success("Foto removida com sucesso!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover a foto.", { id: toastId });
    }
  };

  const getSectionLabel = (sectionValue: string) => {
    return SECTIONS.find(s => s.value === sectionValue)?.label || sectionValue;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <Toaster position="top-right" richColors />

      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
            <ArrowLeft size={20} /> Painel Administrativo
          </Link>
          <Link 
            href="/admin/adicionar-secoes" 
            className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20"
          >
            + Adicionar Foto
          </Link>
        </div>

        {/* Título */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-sm">
            <Layers size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Gerenciar Fotos do Site</h1>
            <p className="text-slate-500">Visualize e remova fotos de todas as seções</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={18} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-600">Filtrar por Seção</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(section => (
              <button
                key={section.value}
                onClick={() => setSelectedFilter(section.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedFilter === section.value
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {section.label}
                {section.value === "all" && (
                  <span className="ml-2 text-xs opacity-75">({photos.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Fotos */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <Loader2 className="animate-spin text-purple-500" size={40} />
            <p className="text-slate-400 animate-pulse">Carregando fotos do site...</p>
          </div>
        ) : (
          <>
            {filteredPhotos.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-20 text-center">
                <p className="text-slate-400 italic">
                  {selectedFilter === "all" 
                    ? "Nenhuma foto cadastrada no site." 
                    : `Nenhuma foto na seção "${getSectionLabel(selectedFilter)}".`}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPhotos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Preview da Imagem */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={photo.url} 
                      alt={photo.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                      <span className="bg-purple-500/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                        {getSectionLabel(photo.section)}
                      </span>
                    </div>
                  </div>

                  {/* Info e Ações */}
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 line-clamp-2 mb-2 min-h-12">
                      {photo.title}
                    </h3>
                    
                    {photo.category && (
                      <p className="text-xs text-slate-500 mb-3">
                        📁 {photo.category}
                      </p>
                    )}

                    {photo.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                        {photo.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between gap-2 mt-4">
                      <a 
                        href={photo.url} 
                        target="_blank" 
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                      >
                        <ExternalLink size={14} /> Ver
                      </a>
                      
                      <button
                        onClick={() => handleDelete(photo)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer group/btn"
                        title="Excluir"
                      >
                        <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Stats Footer */}
        {!loading && filteredPhotos.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-slate-500 text-sm">
              Exibindo <span className="font-bold text-slate-900">{filteredPhotos.length}</span> foto(s)
              {selectedFilter !== "all" && (
                <span> na seção <span className="font-bold text-purple-600">{getSectionLabel(selectedFilter)}</span></span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}