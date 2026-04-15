// app/api/resend-contract/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    console.log("🔵 /api/resend-contract chamado");

    const body = await req.json();
    console.log("📦 Body recebido");

    const { contractId, nome, email, cpf, pdfBase64, cc } = body;

    if (!contractId || !nome || !email || !pdfBase64) {
      return NextResponse.json(
        { error: "Dados incompletos: contractId, nome, email e PDF são obrigatórios" },
        { status: 400 }
      );
    }

    // Verifica no Firebase se o contrato existe
    try {
      const contractRef = doc(db, "assinaturas_contrato", contractId);
      const contractSnap = await getDoc(contractRef);

      if (!contractSnap.exists()) {
        return NextResponse.json(
          { error: "Contrato não encontrado" },
          { status: 404 }
        );
      }

      const contractData = contractSnap.data();
      
      // Se o email já foi enviado, permite reenvio mas registra no log
      if (contractData?.emailEnviado) {
        console.log(`📧 Reenvio de email para ${email} (já havia sido enviado antes)`);
      } else {
        console.log(`📧 Primeiro envio de email para ${email}`);
      }

    } catch (firebaseError) {
      console.error("⚠️ Erro ao verificar contrato no Firebase:", firebaseError);
      // Continua mesmo com erro, pois pode ser que o Firebase não esteja acessível
    }

    // Converte base64 para Buffer
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    console.log("🔑 RESEND_API_KEY presente:", !!process.env.RESEND_API_KEY);
    console.log("📧 Reenviando para:", email);
    console.log("📎 Tamanho do PDF:", pdfBuffer.length, "bytes");

    // Envia para o cliente - MESMO EMAIL DO send-contract
    const { data: clientData, error: clientError } = await resend.emails.send({
      from: "Contrato PROTECT <contrato@clube.gustavorizzo.net.br>",
      to: [email],
      subject: "Seu Contrato de Adesão PROTECT",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head><meta charset="UTF-8" /></head>
          <body style="font-family: sans-serif; background: #f8fafc; padding: 32px;">
            <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
              
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 24px 32px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #fff;">
                  ✓ Contrato Assinado com Sucesso!
                </h1>
              </div>

              <div style="padding: 32px;">
                <p style="margin: 0 0 16px; font-size: 14px; color: #1e293b;">
                  Olá <strong>${nome}</strong>,
                </p>

                <p style="margin: 0 0 16px; font-size: 14px; color: #1e293b; line-height: 1.6;">
                  Seu contrato de adesão foi assinado com sucesso! Segue em anexo uma cópia em PDF para seus registros.
                </p>

                <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.6;">
                    <strong>📋 Informações do Contrato:</strong><br/>
                    CPF: ${cpf}<br/>
                    Data: ${new Date().toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <p style="margin: 16px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                  Em caso de dúvidas, entre em contato conosco através do e-mail <strong>clube@grupoprotect.com.br</strong>.
                </p>

                <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">
                  Atenciosamente,<br/>
                  <strong>PROTECT - Clube Mineiro de Tiro</strong>
                </p>
              </div>

              <div style="padding: 16px 32px; background: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                  Este é um email automático. Por favor, não responda.
                </p>
              </div>

            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: `Contrato_PROTECT_${nome.replace(/\s+/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (clientError) {
      console.error("❌ Resend error (cliente):", JSON.stringify(clientError));
      return NextResponse.json({ error: clientError }, { status: 500 });
    }

    console.log("✅ Email enviado ao cliente! ID:", clientData?.id);

    // Envia para o clube (CC) - MESMO EMAIL DO send-contract
    if (cc) {
      const { data: clubeData, error: clubeError } = await resend.emails.send({
        from: "Contrato PROTECT <contrato@clube.gustavorizzo.net.br>",
        to: [cc],
        subject: `Novo Contrato Assinado - ${nome}`,
        html: `
          <!DOCTYPE html>
          <html lang="pt-BR">
            <head><meta charset="UTF-8" /></head>
            <body style="font-family: sans-serif; background: #f8fafc; padding: 32px;">
              <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
                
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 24px 32px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #fff;">
                    📝 Novo Contrato Recebido
                  </h1>
                </div>

                <div style="padding: 32px;">
                  <p style="margin: 0 0 16px; font-size: 13px; color: #1e293b; font-weight: 600;">
                    Novo contrato de adesão foi assinado:
                  </p>

                  <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 8px 0; font-size: 12px; color: #64748b; font-weight: 600;">Nome:</td>
                      <td style="padding: 8px 0; font-size: 12px; color: #1e293b; font-weight: 600;">${nome}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 8px 0; font-size: 12px; color: #64748b; font-weight: 600;">CPF:</td>
                      <td style="padding: 8px 0; font-size: 12px; color: #1e293b;">${cpf}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 8px 0; font-size: 12px; color: #64748b; font-weight: 600;">Email:</td>
                       <td style="padding: 8px 0; font-size: 12px; color: #1e293b;"><a href="mailto:${email}" style="color: #f59e0b;">${email}</a></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748b; font-weight: 600;">Data:</td>
                      <td style="padding: 8px 0; font-size: 12px; color: #1e293b;">${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}</td>
                    </tr>
                  </table>

                  <p style="margin: 16px 0 0; font-size: 11px; color: #94a3b8;">
                    O PDF do contrato está em anexo para seus registros.
                  </p>
                </div>

              </div>
            </body>
          </html>
        `,
        attachments: [
          {
            filename: `Contrato_PROTECT_${nome.replace(/\s+/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (clubeError) {
        console.error("❌ Resend error (clube):", JSON.stringify(clubeError));
      } else {
        console.log("✅ Email enviado ao clube! ID:", clubeData?.id);
      }
    }

    // Atualiza o timestamp do último reenvio no Firebase
    try {
      const contractRef = doc(db, "assinaturas_contrato", contractId);
      await updateDoc(contractRef, {
        dataUltimoReenvio: Timestamp.now(),
      });
      console.log("✅ Timestamp de reenvio atualizado no Firebase");
    } catch (firebaseError) {
      console.error("⚠️ Erro ao atualizar timestamp no Firebase:", firebaseError);
    }

    return NextResponse.json({ 
      ok: true,
      message: "Emails enviados com sucesso",
      clientId: clientData?.id,
    });
  } catch (err) {
    console.error("❌ API /resend-contract exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
