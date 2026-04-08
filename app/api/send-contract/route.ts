// app/api/send-contract/route.ts
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
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
      cc: ["clube@grupoprotect.com.br"],
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

          <!-- Introdução -->
          <tr>
            <td style="padding:36px 40px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
                Prezado(a) <strong>${primeiroNome}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#333;">
                Confirmamos o recebimento e registro da sua assinatura no
                <strong>Contrato de Adesão de Sócio Usuário (Colaborador)</strong>
                da Protect Clube Mineiro de Tiro.
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#333;">
                Em anexo a este e-mail encontra-se uma cópia do contrato assinado em formato PDF
                para seus arquivos. Abaixo você também encontra a íntegra do contrato para consulta.
                Guarde este documento — ele constitui título executivo extrajudicial nos termos acordados.
              </p>

              <!-- Resumo -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;margin:24px 0;">
                <tr>
                  <td style="background:#f9f9f9;padding:12px 20px;border-bottom:1px solid #e0e0e0;">
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#888;">
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
            </td>
          </tr>

          <!-- Divisor -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e0e0e0;margin:0;" />
            </td>
          </tr>

          <!-- TEXTO COMPLETO DO CONTRATO -->
          <tr>
            <td style="padding:32px 40px;">

              <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#888;">
                Documento Legal
              </p>
              <h2 style="margin:0 0 4px;font-size:15px;font-weight:700;text-align:center;">
                Contrato de Adesão de Sócio Usuário (Colaborador)
              </h2>
              <p style="margin:0 0 2px;font-size:13px;text-align:center;color:#555;">
                Protect Clube Mineiro de Tiro — CNPJ 01.244.200/0001-52
              </p>
              <p style="margin:0 0 20px;font-size:13px;text-align:center;color:#555;font-style:italic;">
                Cota trienal — 3 anos
              </p>

              <p style="margin:0 0 16px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                Pelo presente instrumento particular de CONTRATO DE ADESÃO DE SÓCIO USUÁRIO (COLABORADOR),
                de um lado, Protect Clube Mineiro de Tiro, pessoa jurídica de direito privado, inscrita no CNPJ
                sob o nº 01.244.200/0001-52, com sede na Rua General Andrade Neves, 622, Bairro Gutierrez,
                Belo Horizonte/MG, e posteriormente na Rua dos Radialistas, 38, Bairro Balneário Água Limpa,
                Nova Lima/MG, neste ato representada por quem de direito, doravante simplesmente denominada
                PROTECT; e, de outro lado, o(a) Sr.(a) <strong>${nome ?? "_______________"}</strong>,
                doravante simplesmente denominado(a) SÓCIO USUÁRIO (COLABORADOR), têm entre si justo e
                contratado o direito de sócio usuário (colaborador) da PROTECT, tudo de acordo com as
                condições especificadas nesta contratação/adesão e na legislação vigente.
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                O proponente declara aceitar as cláusulas deste contrato sem restrições, bem como a eleição
                do foro da Comarca de Belo Horizonte/MG para dirimir quaisquer pendências relativas ao
                presente instrumento.
              </p>

              <!-- Seção 1 -->
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1a1a1a;">1. Do Preço e da Forma de Pagamento</p>

              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA PRIMEIRA:</strong> O valor total do contrato, correspondente à cota trienal
                (vigente por três anos), é de R$ 3.600,00, ficando isento o pagamento de taxa de contribuição
                social mensal.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>PARÁGRAFO PRIMEIRO:</strong> Declara o sócio usuário (colaborador), neste ato, ter
                ciência de que a revalidação do CR (Certificado de Registro) é feita, atualmente, de três em
                três anos.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>PARÁGRAFO SEGUNDO:</strong> O pagamento deverá ser efetuado no ato da assinatura deste
                contrato, no valor de R$ 1.200,00 (anuidade), correspondente à primeira parcela, salvo eventual
                desconto ou condição diferenciada. Em caso de parcelamento, o valor remanescente será reajustado
                ao final de cada ano pelo IGP-M ou índice substituto. Independentemente da data de ingresso, o
                pagamento será anual e válido até o último dia de dezembro. Este contrato também servirá como
                recibo, mediante comprovação de depósito via PIX CNPJ nº 01.244.200/0001-52 ou por link de
                cartão de crédito do clube.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>PARÁGRAFO TERCEIRO:</strong> Caso a contratação seja realizada em mês diverso de
                janeiro, o contrato permanecerá vigente até o mesmo mês de janeiro, três anos após o ingresso,
                sendo que as parcelas remanescentes também vencerão até o dia 10 daquele mês, em cada um dos
                três anos subsequentes.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>PARÁGRAFO QUARTO:</strong> Será considerado inadimplente o sócio usuário (colaborador)
                que atrasar qualquer pagamento por período superior a 30 (trinta) dias do vencimento, ficando
                expressamente suspensos os direitos previstos nas cláusulas sexta e sétima, independentemente
                de comunicação prévia, até a quitação do débito.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>PARÁGRAFO QUINTO:</strong> Nos casos de parcelamento, a cobrança se dará mediante
                emissão de boleto bancário. O não recebimento do boleto não exime o sócio de realizar o
                pagamento na data acordada.
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>PARÁGRAFO SEXTO:</strong> Em caso de atraso superior a 60 (sessenta) dias, o sócio
                será notificado e terá 10 (dez) dias para liquidação. Persistindo a pendência, a PROTECT
                poderá encaminhar o nome ao SPC. O cancelamento ou rescisão implicará o vencimento antecipado
                das parcelas remanescentes, acrescidas de multa de 30% sobre o valor total da cota trienal,
                além de correção monetária. Cobrança administrativa: +10% de honorários; cobrança judicial:
                +20% de honorários.
              </p>

              <!-- Seção 2 -->
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1a1a1a;">2. Das Obrigações da Contratada Protect</p>

              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA SEGUNDA:</strong> Permitir a frequência do sócio usuário (colaborador) às
                áreas comuns do Clube PROTECT dentro do horário de funcionamento, bem como a utilização dos
                estandes de tiro, ressalvada a hipótese de o local estar sendo utilizado por determinadas
                categorias profissionais ou para cursos e capacitação.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA TERCEIRA:</strong> Oferecer condições adequadas para a realização de cursos,
                testes de tiro e capacitação técnica, atividades sociais, culturais, recreativas e desportivas,
                bem como manter despachantes no clube para pleitos junto à Polícia Federal e ao Exército,
                ressalvando que os serviços documentais e de despachante serão cobrados separadamente.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA QUARTA:</strong> Manter as instalações limpas e em permanentes condições de
                uso; disponibilizar, a título oneroso, alvos e equipamentos obrigatórios para testes e cursos;
                e disponibilizar, a título gratuito e em caráter de empréstimo, óculos de proteção, abafadores
                de ouvido e armas do acervo do clube para atiradores com CR válido.
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA QUINTA:</strong> Ofertar ao sócio usuário (colaborador), armas de fogo,
                munição, acessórios, equipamentos de proteção e defesa individual, armas de ar comprimido,
                airsoft e outros itens para compra ou aquisição. Disponibilizar, sempre que necessário,
                declaração de que o sócio é filiado à entidade e participa regularmente das atividades.
              </p>

              <!-- Seção 3 -->
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1a1a1a;">3. Dos Direitos do Sócio Usuário (Colaborador)</p>

              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA SEXTA:</strong> Frequentar, utilizar e participar de todas as opções
                recreativas, desportivas e culturais, desde que esteja em dia com o pagamento da anuidade.
                O sócio declara ter ciência de que cursos, testes de capacitação e tiro, bem como algumas
                opções recreativas, serão disponibilizados a título oneroso, a ser calculado evento a evento.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA SÉTIMA:</strong> Ter prioridade na tramitação de pleitos junto ao Exército
                e à Polícia Federal; na utilização de estandes; para realização de testes de tiro e capacitação
                técnica; nas vagas para participação em opções recreativas, desportivas e culturais; e para
                utilização de equipamentos de proteção individual e armas do acervo do clube.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA OITAVA:</strong> Caso a legislação vigente permita, fazer-se acompanhar de
                terceiros nas dependências do clube PROTECT, mediante preenchimento e assinatura de termo de
                compromisso, respondendo o sócio usuário (colaborador) por aqueles convidados que agirem com
                imperícia, imprudência ou negligência.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA NONA:</strong> Fazer requerimento para obtenção de CR de Colecionador,
                Atirador ou Caçador, observados os requisitos elencados pelo Estatuto do Desarmamento e
                portarias vigentes da Polícia Federal e do Exército, sendo necessário ter 25 anos. Antes disso,
                o interessado poderá obter autorização judicial.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA DÉCIMA:</strong> Zelar pelo patrimônio do clube, responsabilizando-se por si
                e por seus convidados, inclusive por danos ou despesas que venham a causar. É expressamente
                proibido que menores de 18 anos manuseiem, utilizem ou portem qualquer tipo de arma de fogo,
                à exceção daqueles com autorização judicial.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA ONZE:</strong> Pagar pontualmente as parcelas para quitação do título trienal
                de sócio usuário (colaborador), quando parcelado.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA DOZE:</strong> Obedecer às normas disciplinares e aos horários de frequência
                às dependências do clube, sendo proibida a ingestão de bebidas alcoólicas e/ou drogas ilícitas
                nas áreas de tiro.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA TREZE:</strong> O ingresso às áreas de tiro se fará mediante identificação
                facial e/ou apresentação da carteira social. A condição de sócio usuário (colaborador) não
                confere direito de propriedade sobre qualquer parcela do patrimônio do clube.
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA QUATORZE:</strong> O teste de manuseio e capacitação técnica constitui
                espécie de curso com testes escritos e práticos, ministrados por instrutores credenciados
                pela Polícia Federal, dos quais o interessado deverá participar e ser aprovado para obtenção
                ou renovação de CR.
              </p>

              <!-- Seção 4 -->
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1a1a1a;">4. Disposições Gerais e Condições Específicas</p>

              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA DEZESSEIS:</strong> O sócio usuário (colaborador) que desejar adquirir uma
                arma para defesa no comércio deverá obter autorização da Polícia Federal ou do Exército e
                apresentar Prova de Aptidão e Manuseio de Armas e Teste Psicológico.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA DEZESSETE:</strong> O sócio declara ter ciência de que a legislação que
                controla os CACs é diferente daquela que rege as armas em mãos de cidadãos comuns. Essas
                normas constam no R-105, Decreto nº 3.665/2000 e Portaria COLOG nº 051/2015.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA DEZOITO:</strong> O sócio declara ter ciência de que CACs não possuem
                autorização para PORTE de arma, e sim, alguns deles, para POSSE e TRANSPORTE da arma,
                munições e acessórios de casa até os locais de competição, clubes de tiro, treinamentos e
                outros, autorizados pelas GUIAS DE TRÁFEGO.
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA VINTE:</strong> É expressamente proibido ao sócio usuário (colaborador)
                utilizar armas de fogo sem registro, bem como utilizar os postos de tiro sem equipamentos de
                proteção auricular e visual.
              </p>

              <!-- Seção 5 -->
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1a1a1a;">5. Da Rescisão do Contrato</p>

              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>CLÁUSULA VINTE E UM:</strong> A rescisão ou cancelamento do presente contrato poderá
                se dar, em qualquer momento, por qualquer uma das partes, mediante termo expresso.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>PARÁGRAFO PRIMEIRO:</strong> Não será considerada motivação válida para rescisão
                contratual a não aprovação do sócio usuário (colaborador) nos testes de capacitação técnica
                e manuseio de armas de fogo e nos testes psicotécnicos pertinentes.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>PARÁGRAFO SEGUNDO:</strong> Em caso de rescisão ou cancelamento deste contrato, a
                parte que der ensejo à rescisão deverá pagar à outra parte 30% (trinta por cento) do valor
                da cota trienal de sócio usuário (colaborador), independentemente da entrada e/ou das parcelas
                pagas, quantia que será liquidada no ato da rescisão ou do cancelamento.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>PARÁGRAFO TERCEIRO:</strong> O presente contrato reveste-se e é aceito pelos
                contratantes com força de título executivo extrajudicial, constituindo dívida líquida, certa
                e exigível.
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                <strong>PARÁGRAFO QUARTO:</strong> A contratada PROTECT não se responsabiliza por promessas
                ou acordos que não façam parte deste contrato.
              </p>

              <!-- Seção 6 -->
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1a1a1a;">6. Termo de Responsabilidade para Uso dos Espaços de Tiro</p>

              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                É expressamente proibido o ingresso e a utilização de armas sem registro no SIGMA ou no
                SINARM. Qualquer sócio, monitor ou instrutor poderá solicitar aos sócios os documentos
                relativos às armas trazidas ao clube. É obrigatório transportar as armas desmuniciadas nas
                dependências do clube, sendo vedado o manejo das armas fora do estande de tiro. A prática
                de atividades de tiro por menores de 18 anos deverá ser autorizada judicialmente e
                acompanhada do responsável legal.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                Quando da prática da modalidade de tiro, deverão ser observadas as normas de conduta e
                segurança, bem como as orientações expedidas pelo Exército Brasileiro, sendo obrigatório o
                uso de óculos e protetores auriculares.
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.8;color:#333;text-align:justify;font-weight:700;text-transform:uppercase;">
                É expressamente proibido o ingresso e a utilização de armas e munições sem procedência
                legal e justificada.
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                Eu, que abaixo assino, declaro ter recebido instruções de segurança e ter tomado conhecimento
                das normas legais estabelecidas em legislação pertinente, assumindo o compromisso pela minha
                participação nas atividades e pela minha permanência nas dependências da PROTECT. Declaro,
                ainda, que não possuo registro de antecedentes criminais e que os dados constantes nesta ficha
                são verdadeiros. Declaro ter ciência da necessidade de cumprir a Lei nº 10.826/2003, Decreto
                nº 5.123/2004, R-105 do Exército Brasileiro e demais normas aplicáveis.
              </p>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.8;color:#333;text-align:justify;">
                E, por estarem justas e contratadas, firmam o presente em 02 (duas) vias, na presença das
                testemunhas.
              </p>

              <!-- Assinaturas -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;font-size:12px;">
                <tr>
                  <td width="48%" style="border-top:1px solid #333;padding-top:8px;vertical-align:top;">
                    <p style="margin:0;font-weight:700;">PROTECT CLUBE MINEIRO DE TIRO</p>
                    <p style="margin:4px 0 0;color:#555;">CNPJ: 01.244.200/0001-52</p>
                    <p style="margin:4px 0 0;color:#555;">ANTONIO C. COSTA JUNIOR</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="border-top:1px solid #333;padding-top:8px;vertical-align:top;">
                    <p style="margin:0;font-weight:700;">SÓCIO USUÁRIO (COLABORADOR)</p>
                    <p style="margin:4px 0 0;color:#555;">CPF: ___________________________</p>
                  </td>
                </tr>
                <tr><td colspan="3" style="height:24px;"></td></tr>
                <tr>
                  <td width="48%" style="border-top:1px solid #333;padding-top:8px;vertical-align:top;">
                    <p style="margin:0;font-weight:700;">TESTEMUNHA 1</p>
                    <p style="margin:4px 0 0;color:#555;">EMMERSON N. DO CARMO</p>
                    <p style="margin:4px 0 0;color:#555;">CPF: 001.583.866-80</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="border-top:1px solid #333;padding-top:8px;vertical-align:top;">
                    <p style="margin:0;font-weight:700;">TESTEMUNHA 2</p>
                    <p style="margin:4px 0 0;color:#555;">NEWTON C. BAPTISTON</p>
                    <p style="margin:4px 0 0;color:#555;">CPF: 584.978.896-49</p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#555;text-align:center;">
                Belo Horizonte/MG, 7 de abril de 2026
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#888;text-align:center;">
                Rua General Andrade Neves, 622, Grajaú, CEP 30431-128 — Belo Horizonte/MG
              </p>

            </td>
          </tr>

          <!-- Divisor -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e0e0e0;margin:0;" />
            </td>
          </tr>

          <!-- Contato -->
          <tr>
            <td style="padding:24px 40px;">
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