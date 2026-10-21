import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { clienteAdmin } from '@/lib/supabase-admin';
import { DOMINIO, RESEND_API_KEY, RESEND_WEBHOOK_SECRET } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

function assinaturaValida(corpo: string, cabecalhos: Headers) {
  const id = cabecalhos.get('svix-id') || cabecalhos.get('webhook-id');
  const timestamp = cabecalhos.get('svix-timestamp') || cabecalhos.get('webhook-timestamp');
  const assinaturas = cabecalhos.get('svix-signature') || cabecalhos.get('webhook-signature');
  if (!id || !timestamp || !assinaturas) return false;

  const idade = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(idade) || idade > 300) return false;

  const chave = Buffer.from(RESEND_WEBHOOK_SECRET.replace(/^whsec_/, ''), 'base64');
  const esperada = crypto
    .createHmac('sha256', chave)
    .update(id + '.' + timestamp + '.' + corpo)
    .digest('base64');
  const esperadaBuf = Buffer.from(esperada);

  return assinaturas.split(' ').some((item) => {
    const recebida = item.split(',')[1];
    if (!recebida) return false;
    const recebidaBuf = Buffer.from(recebida);
    if (recebidaBuf.length !== esperadaBuf.length) return false;
    return crypto.timingSafeEqual(recebidaBuf, esperadaBuf);
  });
}

async function buscarEmail(emailId: string) {
  const resposta = await fetch('https://api.resend.com/emails/receiving/' + emailId, {
    headers: { Authorization: 'Bearer ' + RESEND_API_KEY }
  });
  if (!resposta.ok) throw new Error('Não foi possível buscar o email recebido.');
  return resposta.json();
}

async function buscarAnexos(emailId: string) {
  const resposta = await fetch(
    'https://api.resend.com/emails/receiving/' + emailId + '/attachments',
    { headers: { Authorization: 'Bearer ' + RESEND_API_KEY } }
  );
  if (!resposta.ok) return [];
  const corpo = await resposta.json();
  return Array.isArray(corpo?.data) ? corpo.data : [];
}

function nomeExibicao(remetente: string, cabecalhos: any) {
  const bruto = cabecalhos?.from || cabecalhos?.From || '';
  const nome = String(bruto).replace(/<[^>]*>/, '').replace(/"/g, '').trim();
  return nome || remetente.split('@')[0];
}

export async function POST(requisicao: Request) {
  const corpo = await requisicao.text();

  if (!RESEND_WEBHOOK_SECRET || !assinaturaValida(corpo, requisicao.headers)) {
    return NextResponse.json({ erro: 'assinatura inválida' }, { status: 401 });
  }

  let evento: any;
  try {
    evento = JSON.parse(corpo);
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 });
  }

  if (evento?.type !== 'email.received') return NextResponse.json({ ignorado: true });

  const emailId = evento?.data?.email_id;
  if (!emailId) return NextResponse.json({ erro: 'sem email_id' }, { status: 400 });

  const supabase = clienteAdmin();
  const email = await buscarEmail(emailId);

  const para = (email.to || []).map((e: string) => String(e).toLowerCase());
  const cc = (email.cc || []).map((e: string) => String(e).toLowerCase());
  const encaminhados = (email.received_for || []).map((e: string) => String(e).toLowerCase());
  const candidatos = Array.from(new Set([...para, ...cc, ...encaminhados])).filter((e) =>
    e.endsWith('@' + DOMINIO)
  );

  if (!candidatos.length) return NextResponse.json({ ignorado: 'fora do domínio' });

  const { data: perfis } = await supabase
    .from('perfis')
    .select('id, endereco')
    .in('endereco', candidatos)
    .eq('ativo', true);

  if (!perfis?.length) return NextResponse.json({ ignorado: 'caixa inexistente' });

  const remetente = String(email.from || '').toLowerCase();
  const existentes = await supabase
    .from('mensagens')
    .select('id')
    .eq('provedor_id', emailId)
    .limit(1);
  if (existentes.data?.length) return NextResponse.json({ ignorado: 'duplicado' });

  const linhas = perfis.map((p) => ({
    caixa_id: p.id,
    pasta: 'entrada',
    direcao: 'recebida',
    remetente,
    remetente_nome: nomeExibicao(remetente, email.headers),
    para,
    cc,
    assunto: email.subject || '',
    texto: email.text || null,
    html: email.html || null,
    message_id: email.message_id || null,
    in_reply_to: email.headers?.['in-reply-to'] || null,
    externa: !remetente.endsWith('@' + DOMINIO),
    spf: email.authentication?.spf || null,
    dkim: email.authentication?.dkim || null,
    dmarc: email.authentication?.dmarc || null,
    provedor_id: emailId
  }));

  const { data: inseridas, error } = await supabase.from('mensagens').insert(linhas).select('id');
  if (error) return NextResponse.json({ erro: 'falha ao gravar' }, { status: 500 });

  const anexos = await buscarAnexos(emailId);
  for (const anexo of anexos) {
    if (!anexo?.download_url) continue;
    const arquivo = await fetch(anexo.download_url);
    if (!arquivo.ok) continue;
    const bytes = Buffer.from(await arquivo.arrayBuffer());
    const caminho = 'recebidos/' + emailId + '/' + anexo.id + '-' + (anexo.filename || 'arquivo');

    await supabase.storage.from('anexos').upload(caminho, bytes, {
      contentType: anexo.content_type || 'application/octet-stream',
      upsert: true
    });

    await supabase.from('anexos').insert(
      (inseridas || []).map((m) => ({
        mensagem_id: m.id,
        nome: anexo.filename || 'arquivo',
        tipo: anexo.content_type || null,
        tamanho: anexo.size || null,
        caminho
      }))
    );
  }

  return NextResponse.json({ ok: true, caixas: perfis.length });
}
