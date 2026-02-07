import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Força o Next.js a buscar dados novos sempre que a página for carregada
export const revalidate = 0;

export default async function BlogPage() {
  // Busca as notícias no banco de dados
  const { data: noticias, error } = await supabase
    .from("noticias")
    .select("*")
    .order("data", { ascending: false });

  if (error) return <div>Erro ao carregar notícias: {error.message}</div>;

  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px", fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px", fontSize: '2.5rem' }}>Blog Liberty Car</h1>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
        gap: "30px" 
      }}>
        {noticias?.map((post) => (
          <div key={post.id} style={{ 
            border: "1px solid #eee", 
            borderRadius: "12px", 
            overflow: "hidden", 
            boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
            transition: 'transform 0.2s'
          }}>
            {/* Imagem que você subiu pelo formulário */}
            <img 
              src={post.imagem_url} 
              alt={post.titulo} 
              style={{ width: "100%", height: "200px", objectFit: "cover" }} 
            />
            
            <div style={{ padding: "20px" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: "12px", color: "#0070f3", fontWeight: "bold", textTransform: 'uppercase' }}>
                  {post.categoria}
                </span>
                <span style={{ fontSize: "12px", color: "#999" }}>
                  {new Date(post.data).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <h2 style={{ margin: "0 0 15px 0", fontSize: '1.4rem' }}>{post.titulo}</h2>
              
              {/* Link para a notícia completa (criaremos a seguir) */}
              <Link href={`/blog/${post.id}`} style={{ 
                color: "#0070f3", 
                textDecoration: "none", 
                fontWeight: "bold",
                fontSize: '14px' 
              }}>
                Ler notícia completa →
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {noticias?.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666' }}>Nenhuma notícia publicada ainda.</p>
      )}
    </main>
  );
}