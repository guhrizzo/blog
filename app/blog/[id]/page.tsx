import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function PostPage({ params }: { params: { id: string } }) {
  const { data: post } = await supabase
    .from("noticias")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!post) notFound();

  return (
    <article style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px", fontFamily: 'serif' }}>
      <header style={{ marginBottom: '30px' }}>
        <p style={{ color: '#0070f3', fontWeight: 'bold' }}>{post.categoria}</p>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>{post.titulo}</h1>
        <time style={{ color: '#666' }}>{new Date(post.data).toLocaleDateString('pt-BR')}</time>
      </header>

      <img 
        src={post.imagem_url} 
        alt={post.titulo} 
        style={{ width: '100%', borderRadius: '15px', marginBottom: '30px' }} 
      />

      {/* IMPORTANTE: Aqui renderizamos o HTML que veio do Editor Rico */}
      <div 
        className="conteudo-noticia"
        style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#333' }}
        dangerouslySetInnerHTML={{ __html: post.conteudo }} 
      />
    </article>
  );
}