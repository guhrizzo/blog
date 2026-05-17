import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const nome = searchParams.get('nome') ?? 'NOME DO PARTICIPANTE';
  const cpf = searchParams.get('cpf') ?? '000.000.000-00';
  const data = searchParams.get('data') ?? '01/01/2024';

  const gold = '#c8922a';
  const dark = '#111111';

  const nomeStr = String(nome);
  const cpfStr = String(cpf);
  const dataStr = String(data);

  const nomeScale =
    nomeStr.length > 24
      ? Math.max(0.52, 24 / nomeStr.length)
      : 1;

  const logoTopPath = path.join(process.cwd(), 'public', 'grupoprotect.png');
  const logoFooterPath = path.join(process.cwd(), 'public', 'protectclubedetiro.png');

  const logoTopBase64 = fs.existsSync(logoTopPath)
    ? `data:image/png;base64,${fs.readFileSync(logoTopPath).toString('base64')}`
    : '';

  const logoFooterBase64 = fs.existsSync(logoFooterPath)
    ? `data:image/png;base64,${fs.readFileSync(logoFooterPath).toString('base64')}`
    : '';

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Certificado</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          margin: 0;
          padding: 0;
          background: #f5f5f5;
        }

        .container {
          width: 1400px;
          height: 980px;
          background: white;
          position: relative;
          overflow: hidden;
          font-family: Georgia, 'Times New Roman', serif;
        }

        .border-outer {
          position: absolute;
          inset: 0;
          border: 8px solid ${dark};
          box-sizing: border-box;
        }

        .border-middle {
          position: absolute;
          inset: 16px;
          border: 3px solid ${gold};
          box-sizing: border-box;
        }

        .border-inner {
          position: absolute;
          inset: 26px;
          border: 1px solid ${dark};
          opacity: 0.2;
          box-sizing: border-box;
        }

        .logo-top {
          position: absolute;
          top: 50px;
          left: 50%;
          transform: translateX(-50%);
          width: 90px;
          height: auto;
          max-height: 90px;
          z-index: 20;
        }

        .title {
          position: absolute;
          top: 140px;
          left: 80px;
          right: 80px;
          font-size: 110px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: ${dark};
          text-align: center;
          line-height: 0.9;
          z-index: 20;
        }

        .subtitle {
          position: absolute;
          top: 270px;
          left: 80px;
          right: 80px;
          font-size: 22px;
          font-weight: 400;
          letter-spacing: 0.1em;
          color: #666;
          text-align: center;
          z-index: 20;
        }

        .divider {
          position: absolute;
          top: 320px;
          left: 50%;
          transform: translateX(-50%);
          width: 260px;
          height: 1.5px;
          background: ${dark};
          z-index: 20;
        }

        .cert-text {
          position: absolute;
          top: 355px;
          left: 80px;
          right: 80px;
          font-size: 13px;
          letter-spacing: 0.08em;
          color: #666;
          text-align: center;
          font-family: Arial, sans-serif;
          font-weight: 600;
          z-index: 20;
        }

        .name-box {
          position: absolute;
          top: 400px;
          left: 150px;
          right: 150px;
          border-bottom: 2px solid ${dark};
          padding-bottom: 10px;
          z-index: 20;
          text-align: center;
        }

        .name {
          font-size: 66px;
          font-weight: 700;
          color: ${dark};
          letter-spacing: 0.02em;
          display: inline-block;
          transform-origin: center center;
          transform: scaleX(${nomeScale});
          white-space: nowrap;
        }

        .cpf {
          position: absolute;
          top: 495px;
          left: 80px;
          right: 80px;
          font-size: 13px;
          color: #666;
          letter-spacing: 0.06em;
          text-align: center;
          font-family: Arial, sans-serif;
          z-index: 20;
        }

        .description {
          position: absolute;
          top: 535px;
          left: 120px;
          right: 120px;
          font-size: 15px;
          line-height: 1.5;
          color: #555;
          text-align: center;
          z-index: 20;
        }

        .footer {
          position: absolute;
          bottom: 60px;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 0 80px;
          box-sizing: border-box;
          z-index: 20;
        }

        .footer-col {
          flex: 1;
          text-align: center;
        }

        .footer-line {
          border-top: 1.5px solid ${dark};
          margin-bottom: 8px;
        }

        .footer-text {
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #444;
          font-family: Arial, sans-serif;
          font-weight: 700;
        }

        .footer-logo {
          width: 100px;
          height: auto;
          max-height: 110px;
          object-fit: contain;
        }

        svg {
          position: absolute;
          z-index: 10;
        }

        .corner-tl { top: 0; left: 0; }
        .corner-tr { top: 0; right: 0; }
        .corner-bl { bottom: 0; left: 0; }
        .corner-br { bottom: 0; right: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="border-outer"></div>
        <div class="border-middle"></div>
        <div class="border-inner"></div>

        <svg class="corner-tl" width="180" height="180" viewBox="0 0 180 180">
          <polygon points="0,0 110,0 0,110" fill="${dark}" />
          <polygon points="110,0 148,0 0,148 0,110" fill="${gold}" />
          <polygon points="148,0 180,0 0,180 0,148" fill="${gold}" opacity="0.5" />
        </svg>

        <svg class="corner-tr" width="180" height="180" viewBox="0 0 180 180">
          <polygon points="180,0 70,0 180,110" fill="${dark}" />
          <polygon points="70,0 32,0 180,148 180,110" fill="${gold}" />
          <polygon points="32,0 0,0 180,180 180,148" fill="${gold}" opacity="0.5" />
        </svg>

        <svg class="corner-bl" width="180" height="180" viewBox="0 0 180 180">
          <polygon points="0,180 110,180 0,70" fill="${dark}" />
          <polygon points="110,180 148,180 0,32 0,70" fill="${gold}" />
          <polygon points="148,180 180,180 0,0 0,32" fill="${gold}" opacity="0.5" />
        </svg>

        <svg class="corner-br" width="180" height="180" viewBox="0 0 180 180">
          <polygon points="180,180 70,180 180,70" fill="${dark}" />
          <polygon points="70,180 32,180 180,32 180,70" fill="${gold}" />
          <polygon points="32,180 0,180 180,0 180,32" fill="${gold}" opacity="0.5" />
        </svg>

        <img src="${logoTopBase64}" alt="Grupo Protect" class="logo-top" />

        <div class="title">CERTIFICADO</div>
        <div class="subtitle">DE CONCLUSÃO</div>
        <div class="divider"></div>
        <div class="cert-text">CERTIFICAMOS QUE</div>

        <div class="name-box">
          <span class="name">${nomeStr}</span>
        </div>

        <div class="cpf">CPF: ${cpfStr}</div>

        <div class="description">
          concluiu com êxito o treinamento teórico e prático do curso,<br/>
          demonstrando conhecimento, habilidade e responsabilidade no<br/>
          manuseio seguro de armas de fogo.
        </div>

        <div class="footer">
          <div class="footer-col">
            <div class="footer-line"></div>
            <div class="footer-text">INSTRUTOR</div>
          </div>

          <div class="footer-col">
            <img src="${logoFooterBase64}" alt="Protect" class="footer-logo" />
          </div>

          <div class="footer-col">
            <div class="footer-line"></div>
            <div class="footer-text">${dataStr}</div>
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