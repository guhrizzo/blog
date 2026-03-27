// app/api/send-contract/route.ts
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Debug: confirma que a key está carregando
  console.log("RESEND_API_KEY presente:", !!process.env.RESEND_API_KEY);

  try {
    const body = await req.json();
    const { nome, email, cpf, pdfBase64 } = body;

    console.log("Payload recebido:", { nome, email, cpf, temPDF: !!pdfBase64 });

    if (!email || !pdfBase64) {
      return NextResponse.json(
        { error: "email e pdfBase64 são obrigatórios" },
        { status: 400 }
      );
    }

    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    console.log("PDF size (bytes):", pdfBuffer.length);

    const { data, error } = await resend.emails.send({
      from: "Protect Clube de Tiro <contato@clube.gustavorizzo.net.br>",
      to: [email],
      // BCC comentado — reative após confirmar que o envio funciona
      // bcc: ["clube@grupoprotect.com.br"],
      subject: "Seu contrato de adesão — Protect Clube Mineiro de Tiro",
      html: buildEmailHtml(nome),
      attachments: [
        {
          filename: `contrato_${nome?.replace(/\s+/g, "_").toLowerCase()}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[Resend] erro ao enviar:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[Resend] email enviado com sucesso, id:", data?.id);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error("[send-contract] erro interno:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function buildEmailHtml(nome?: string): string {
  const primeiroNome = nome?.split(" ")[0] ?? "Sócio";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contrato de Adesão — Protect</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Times New Roman',Times,serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;max-width:600px;width:100%;">

          <!-- Cabeçalho -->
          <tr>
            <td style="background:#1a1a1a;padding:28px 40px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#aaa;">
                Protect Clube Mineiro de Tiro
              </p>
              <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#ffffff;">
                Contrato de Adesão Assinado
              </p>
            </td>
          </tr>

          <!-- Linha decorativa -->
          <tr>
            <td style="height:3px;background:#cccccc;"></td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
                Prezado(a) <strong>${primeiroNome}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#333;">
                Confirmamos o recebimento e registro da sua assinatura no
                <strong>Contrato de Adesão de Sócio Usuário (Colaborador)</strong>
                da Protect Clube Mineiro de Tiro.
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#333;">
                Em anexo a este e-mail encontra-se uma cópia do contrato assinado
                em formato PDF para seus arquivos. Guarde este documento — ele
                constitui título executivo extrajudicial nos termos acordados.
              </p>

              <!-- Resumo -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e0e0e0;margin:24px 0;">
                <tr>
                  <td style="background:#f9f9f9;padding:12px 20px;border-bottom:1px solid #e0e0e0;">
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;
                               letter-spacing:2px;text-transform:uppercase;color:#888;">
                      Resumo do Contrato
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;">
                      <tr>
                        <td style="color:#666;">Valor total da cota trienal</td>
                        <td align="right" style="font-weight:700;">R$ 3.600,00</td>
                      </tr>
                      <tr>
                        <td style="color:#666;">Primeira parcela (anuidade)</td>
                        <td align="right" style="font-weight:700;">R$ 1.200,00</td>
                      </tr>
                      <tr>
                        <td style="color:#666;">Vigência</td>
                        <td align="right" style="font-weight:700;">3 anos</td>
                      </tr>
                      <tr>
                        <td style="color:#666;">Multa de rescisão</td>
                        <td align="right" style="font-weight:700;">30%</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.8;color:#333;">
                Em caso de dúvidas, entre em contato conosco:
              </p>
              <p style="margin:0;font-size:13px;line-height:1.9;color:#555;">
                📧 clube@grupoprotect.com.br<br/>
                📱 (31) 3371-8500<br/>
                🌐 grupoprotect.com.br
              </p>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="background:#f9f9f9;border-top:1px solid #e0e0e0;padding:20px 40px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#aaa;line-height:1.7;">
                Protect Clube Mineiro de Tiro — CNPJ 01.244.200/0001-52<br/>
                Rua General Andrade Neves, 622, Grajaú, Belo Horizonte/MG
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}