// // app/api/send-contract/route.ts
// // ROTA DESATIVADA - Usar outro serviço de envio de emails
// // Manter para referência histórica apenas

import { NextRequest, NextResponse } from "next/server";

// Rota comentada - Use outro serviço de envio de emails em seu projeto
// Mantém-se apenas como referência histórica
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "Esta rota foi desativada. Configure seu próprio serviço de email." },
    { status: 410 }
  );
}

// ─────────────────────────────────────────────────────────────────────
// CÓDIGO ANTERIOR - COMENTADO PARA REFERÊNCIA HISTÓRICA
// ─────────────────────────────────────────────────────────────────────
//
// Este arquivo continha a implementação original usando Resend para envio
// de emails com contrato em PDF. Foi desativado para permitir integração
// com outro serviço de email em outro projeto.
//
// Estrutura de uso original:
// - POST /api/send-contract
// - Body: { nome, email, cpf, pdfBase64 }
// - Envia PDF como anexo com template HTML customizado
// - Usa Resend (https://resend.com)
//
// Para restaurar, descomentar as imports e funções abaixo e configurar
// RESEND_API_KEY no arquivo .env.local
// ─────────────────────────────────────────────────────────────────────
