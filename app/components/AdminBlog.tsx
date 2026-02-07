"use client";

import React, { useState, useEffect, FormEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Importação dinâmica para evitar erro de SSR com o Quill
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

type PostForm = {
  titulo: string;
  categoria: string;
  data: string;
  conteudo: string;
  imagem: File | null;
};

export default function AdminBlog() {
  const router = useRouter();
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  const [post, setPost] = useState<PostForm>({
    titulo: "",
    categoria: "",
    data: "",
    conteudo: "",
    imagem: null,
  });

  // 1. PROTEÇÃO DE ROTA: Verifica se o usuário está logado ao carregar a página
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login"); // Se não houver sessão, manda para o login
      } else {
        setVerificandoAcesso(false);
      }
    };
    checkUser();
  }, [router]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!post.imagem) return alert("Por favor, selecione uma imagem!");
    
    setEnviando(true);

    try {
      // 2. UPLOAD DA IMAGEM
      const file = post.imagem;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `noticias/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('imagens-blog')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. BUSCAR URL PÚBLICA
      const { data: { publicUrl } } = supabase.storage
        .from('imagens-blog')
        .getPublicUrl(filePath);

      // 4. SALVAR NO BANCO DE DADOS
      const { error: insertError } = await supabase
        .from('noticias')
        .insert([{
            titulo: post.titulo,
            categoria: post.categoria,
            data: post.data,
            conteudo: post.conteudo,
            imagem_url: publicUrl,
        }]);

      if (insertError) throw insertError;

      alert("Notícia publicada com sucesso!");
      
      // Limpa o formulário após o envio
      setPost({ titulo: "", categoria: "", data: "", conteudo: "", imagem: null });
      window.location.reload(); 
      
    } catch (error: any) {
      alert("Erro operacional: " + error.message);
    } finally {
      setEnviando(false);
    }
  };

  // Enquanto verifica o login, exibe uma mensagem de espera
  if (verificandoAcesso) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Verificando permissões...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Painel Administrativo</h2>
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          style={{ padding: '5px 10px', cursor: 'pointer', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          Sair
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <input 
          style={{ padding: '12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
          type="text" 
          placeholder="Título da Notícia" 
          value={post.titulo}
          onChange={e => setPost({...post, titulo: e.target.value})} 
          required 
        />
        
        <div style={{ display: 'flex', gap: 10 }}>
           <input 
            style={{ flex: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
            type="text" 
            placeholder="Categoria" 
            value={post.categoria}
            onChange={e => setPost({...post, categoria: e.target.value})} 
            required
           />
           <input 
            style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
            type="date" 
            value={post.data}
            onChange={e => setPost({...post, data: e.target.value})} 
            required
           />
        </div>

        <div style={{ padding: '10px', background: '#f9f9f9', border: '1px dashed #ccc' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Imagem de Capa:</label>
          <input type="file" accept="image/*" onChange={e => setPost({...post, imagem: e.target.files![0]})} />
        </div>

        <div style={{ height: '350px', marginBottom: '60px' }}>
          <ReactQuill 
            theme="snow" 
            value={post.conteudo} 
            onChange={(content) => setPost({...post, conteudo: content})}
            modules={modules}
            style={{ height: '100%' }}
            placeholder="Escreva sua notícia aqui..."
          />
        </div>

        <button 
          type="submit" 
          disabled={enviando}
          style={{ 
            padding: 15, 
            background: enviando ? '#ccc' : '#0070f3', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: enviando ? 'not-allowed' : 'pointer' 
          }}
        >
          {enviando ? "Processando..." : "Publicar Notícia"}
        </button>
      </form>
    </div>
  );
}