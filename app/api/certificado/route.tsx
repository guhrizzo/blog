import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatarData(data: string): string {
  if (!data.trim()) return '';

  const iso = data.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, ano, mes, dia] = iso;
    return `${parseInt(dia, 10)} de ${MESES[parseInt(mes, 10) - 1]} de ${ano} em BH, Minas Gerais, Brasil,`;
  }

  const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const [, dia, mes, ano] = br;
    return `${parseInt(dia, 10)} de ${MESES[parseInt(mes, 10) - 1]} de ${ano} em BH, Minas Gerais, Brasil,`;
  }

  const dot = data.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (dot) {
    const [, ano, mes, dia] = dot;
    return `BH, Minas Gerais, Brasil, ${parseInt(dia, 10)} de ${MESES[parseInt(mes, 10) - 1]} de ${ano}`;
  }

  return data;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const nome = searchParams.get('nome') ?? 'NOME DO PARTICIPANTE';
  const cpf = searchParams.get('cpf') ?? '000.000.000-00';
  const data = searchParams.get('data') ?? '01/01/2024';
  const titulo = searchParams.get('titulo') ?? 'CERTIFICADO';
  const subtitulo = searchParams.get('subtitulo') ?? 'DE CONCLUSÃO';

  const dark = '#111111';

  const nomeStr = String(nome);
  const cpfStr = String(cpf);
  const dataStr = formatarData(String(data));

  // Font size diminui conforme o nome cresce, sem quebrar linha
  let nomeFontSize = 56;
  if (nomeStr.length > 40) {
    nomeFontSize = 28;
  } else if (nomeStr.length > 30) {
    nomeFontSize = 36;
  } else if (nomeStr.length > 24) {
    nomeFontSize = 44;
  } else if (nomeStr.length > 18) {
    nomeFontSize = 50;
  }

  const CERT_WIDTH = 1240;
  const CERT_HEIGHT = 877;
  const y = (px: number) => Math.round(px * CERT_HEIGHT / 877);

  const molduraPath = path.join(process.cwd(), 'public', 'moldura_logo_a4.png');

  const molduraBase64 = fs.existsSync(molduraPath)
    ? `data:image/png;base64,${fs.readFileSync(molduraPath).toString('base64')}`
    : '';

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Certificado</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800;900&family=Montserrat:wght@300;400;600;700&family=Georgia:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          margin: 0;
          padding: 0;
          background: #f5f5f5;
        }

        .container {
          width: ${CERT_WIDTH}px;
          height: ${CERT_HEIGHT}px;
          position: relative;
          overflow: hidden;
          font-family: 'Georgia', 'Times New Roman', serif;
        }

        .moldura-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          z-index: 1;
          pointer-events: none;
        }

        .header {
          position: absolute;
          top: ${y(180)}px;
          left: 150px;
          right: 150px;
          text-align: center;
          z-index: 20;
        }

        .title {
          font-family: 'Playfair Display', serif;
          font-size: 68px;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: ${dark};
          line-height: 1;
          margin: 0;
          padding: 0;
        }

        .subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 36px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #999;
          margin: 6px 0 0 0;
          padding: 0;
        }

        .cert-text {
          position: absolute;
          top: ${y(305)}px;
          left: 150px;
          right: 150px;
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          letter-spacing: 0.1em;
          color: #999;
          text-align: center;
          font-weight: 600;
          z-index: 20;
          margin-bottom: 10px;
        }

        .cert-date {
          position: absolute;
          top: ${y(340)}px;
          left: 150px;
          right: 150px;
          font-family: 'Montserrat', sans-serif;
          font-size: 12px;
          letter-spacing: 0.05em;
          color: #666;
          text-align: center;
          font-weight: 500;
          z-index: 20;
        }

        .name-box {
          position: absolute;
          top: ${y(360)}px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          /* sem max-width para não forçar quebra */
          padding-bottom: 8px;
          z-index: 20;
          text-align: center;
        }

        .name {
          font-family: 'Playfair Display', serif;
          font-size: ${nomeFontSize}px;
          font-weight: 700;
          color: ${dark};
          letter-spacing: 0.01em;
          display: inline-block;
          white-space: nowrap; /* nunca quebra */
          line-height: 1.2;
        }

        .description {
          position: absolute;
          top: ${y(460)}px;
          left: 180px;
          right: 180px;
          font-family: 'Georgia', serif;
          font-size: 22px;
          line-height: 1.8;
          color: #666;
          text-align: center;
          z-index: 20;
        }

        .footer {
          position: absolute;
          bottom: ${y(100)}px;
          left: 250px;
          right: 250px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          z-index: 20;
        }

        .footer-instructor {
          flex: 0 1 auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .footer-line {
          border-top: 2px solid ${dark};
          width: 180px;
          margin-bottom: 6px;
        }

        .footer-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 9px;
          letter-spacing: 0.08em;
          color: #444;
          font-weight: 700;
        }

        .footer-text--data {
          font-size: 8px;
          letter-spacing: 0.03em;
          line-height: 1.3;
        }

      </style>
    </head>
    <body>
      <div class="container">
        ${molduraBase64 ? `<img src="${molduraBase64}" alt="" class="moldura-bg" />` : ''}
        <div class="header">
          <div class="title">${titulo}</div>
          <div class="subtitle">${subtitulo}</div>
        </div>
        
        <div class="cert-text">CERTIFICAMOS QUE</div>
        <div class="cert-date">Na Data ${dataStr}</div>

        <div class="name-box">
          <span class="name">${nomeStr}</span>
        </div>

        <div class="description">
          Portador do CPF: ${cpfStr}, concluiu com êxito <br/> o treinamento teórico e prático do curso básico de armas curtas<br/>
          demonstrando conhecimento, habilidade e responsabilidade no<br/>
          manuseio seguro de armas de fogo.
        </div>

        <div class="footer">
          <div class="footer-instructor">
            <div class="footer-line"></div>
            <div class="footer-text">INSTRUTOR</div>
          </div>
          <div class="footer-instructor">
            <div class="footer-line"></div>
            <div class="footer-text">GRUPO PROTECT</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}