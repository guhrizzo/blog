import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function BlogPage() {
  // Busca as notícias do banco
  const { data: noticias } = await supabase
    .from('noticias')
    .select('*')
    .order('data', { ascending: false });

  return (
    <main style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nosso Blog</h1>
      <div className='conteudo-post'  style={{ display: 'grid', gap: '20px' }}>
        {noticias?.map((item) => (
            
          <article key={item.id} style={{ borderBottom: '1px solid #ccc', paddingBottom: '20px' }}>
            <img src={item.imagem_url} alt={item.titulo} style={{ width: '100%', borderRadius: '8px' }} />
            <p style={{ color: '#0070f3', fontSize: '0.8rem' }}>{item.categoria} • {item.data}</p>
            <h2>{item.titulo}</h2>
            <p dangerouslySetInnerHTML={{ __html: item.conteudo }} />
          </article>
        ))}
      </div>
    </main>
  );
}
