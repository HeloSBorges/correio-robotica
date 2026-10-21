import { clienteAdmin } from './supabase-admin';
import {
  DOMINIO,
  DOMINIOS_PERMITIDOS,
  LIMITE_DIA,
  LIMITE_HORA,
  MAX_DESTINATARIOS,
  POLITICA_ENVIO,
  RESEND_API_KEY
} from './config';

export function normalizar(endereco: string) {
  return String(endereco || '').trim().toLowerCase();
}

export function separarEnderecos(entrada: string) {
  return String(entrada || '')
    .split(/[,;\s]+/)
    .map(normalizar)
    .filter(Boolean);
}

export function enderecoValido(endereco: string) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+$/.test(endereco);
}

export function eInterno(endereco: string) {
  return endereco.endsWith('@' + DOMINIO);
}

export function escapar(texto: string) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textoParaHtml(texto: string) {
  const corpo = escapar(texto).replace(/\n/g, '<br>');
  return '<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6">' + corpo + '</div>';
}

async function dentroDoLimite(perfilId: string) {
  const supabase = clienteAdmin();
  const agora = Date.now();
  const dia = new Date(agora - 24 * 60 * 60 * 1000).toISOString();
  const hora = new Date(agora - 60 * 60 * 1000).toISOString();

  const { count: noDia } = await supabase
    .from('envios')
    .select('id', { count: 'exact', head: true })
    .eq('perfil_id', perfilId)
    .gte('criado_em', dia);

  if ((noDia || 0) >= LIMITE_DIA) {
    return 'Você atingiu o limite de ' + LIMITE_DIA + ' envios nas últimas 24 horas.';
  }

  const { count: naHora } = await supabase
    .from('envios')
    .select('id', { count: 'exact', head: true })
    .eq('perfil_id', perfilId)
    .gte('criado_em', hora);

  if ((naHora || 0) >= LIMITE_HORA) {
    return 'Você atingiu o limite de ' + LIMITE_HORA + ' envios nesta hora. Tente de novo mais tarde.';
  }

  return null;
}

function destinoPermitido(endereco: string, perfil: any) {
  if (eInterno(endereco)) return true;
  if (POLITICA_ENVIO === 'interno') return false;
  if (!perfil.envio_externo && perfil.papel !== 'professor') return false;
  if (POLITICA_ENVIO === 'aberto') return true;
  const dominio = endereco.split('@')[1];
  return DOMINIOS_PERMITIDOS.includes(dominio);
}

async function enviarPeloProvedor(dados: {
  de: string;
  nome: string;
  para: string[];
  cc: string[];
  assunto: string;
  texto: string;
  messageId: string;
  inReplyTo?: string | null;
}) {
  const cabecalhos: Record<string, string> = { 'Message-ID': dados.messageId };
  if (dados.inReplyTo) {
    cabecalhos['In-Reply-To'] = dados.inReplyTo;
    cabecalhos['References'] = dados.inReplyTo;
  }

  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: dados.nome + ' <' + dados.de + '>',
      to: dados.para,
      cc: dados.cc.length ? dados.cc : undefined,
      reply_to: dados.de,
      subject: dados.assunto || '(sem assunto)',
      text: dados.texto,
      html: textoParaHtml(dados.texto),
      headers: cabecalhos
    })
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error('Falha no provedor de email: ' + detalhe);
  }

  const corpo = await resposta.json();
  return corpo?.id as string;
}

export async function enviarMensagem(perfil: any, entrada: {
  para: string;
  cc?: string;
  assunto: string;
  texto: string;
  inReplyTo?: string | null;
}) {
  const supabase = clienteAdmin();

  const para = separarEnderecos(entrada.para);
  const cc = separarEnderecos(entrada.cc || '');
  const todos = Array.from(new Set([...para, ...cc]));

  if (!todos.length) return { erro: 'Informe pelo menos um destinatário.' };
  if (todos.length > MAX_DESTINATARIOS) {
    return { erro: 'Máximo de ' + MAX_DESTINATARIOS + ' destinatários por mensagem.' };
  }

  const invalidos = todos.filter((e) => !enderecoValido(e));
  if (invalidos.length) return { erro: 'Endereço inválido: ' + invalidos.join(', ') };

  const bloqueados = todos.filter((e) => !destinoPermitido(e, perfil));
  if (bloqueados.length) {
    return {
      erro:
        'Você não tem permissão para enviar para: ' +
        bloqueados.join(', ') +
        '. Fale com a professora se precisar escrever para fora da escola.'
    };
  }

  const limite = await dentroDoLimite(perfil.id);
  if (limite) return { erro: limite };

  const externos = todos.filter((e) => !eInterno(e));
  const internos = todos.filter((e) => eInterno(e));
  const messageId = '<' + crypto.randomUUID() + '@' + DOMINIO + '>';

  let provedorId: string | null = null;
  if (externos.length) {
    if (!RESEND_API_KEY) return { erro: 'Envio externo não está configurado.' };
    try {
      const externosPara = externos.filter((e) => para.includes(e));
      const externosCc = externos.filter((e) => cc.includes(e));
      provedorId = await enviarPeloProvedor({
        de: perfil.endereco,
        nome: perfil.nome,
        para: externosPara.length ? externosPara : externosCc,
        cc: externosPara.length ? externosCc : [],
        assunto: entrada.assunto,
        texto: entrada.texto,
        messageId,
        inReplyTo: entrada.inReplyTo
      });
    } catch (e: any) {
      return { erro: e.message || 'Não foi possível enviar a mensagem.' };
    }
  }

  if (internos.length) {
    const { data: destinatarios } = await supabase
      .from('perfis')
      .select('id, endereco, ativo')
      .in('endereco', internos);

    const encontrados = (destinatarios || []).filter((d) => d.ativo);
    const faltando = internos.filter(
      (e) => !encontrados.some((d) => d.endereco === e)
    );

    if (faltando.length) {
      return { erro: 'Estes endereços não existem na escola: ' + faltando.join(', ') };
    }

    const linhas = encontrados.map((d) => ({
      caixa_id: d.id,
      pasta: 'entrada',
      direcao: 'recebida',
      remetente: perfil.endereco,
      remetente_nome: perfil.nome,
      para,
      cc,
      assunto: entrada.assunto,
      texto: entrada.texto,
      html: textoParaHtml(entrada.texto),
      message_id: messageId,
      in_reply_to: entrada.inReplyTo || null,
      externa: false
    }));

    const { error } = await supabase.from('mensagens').insert(linhas);
    if (error) return { erro: 'Não foi possível entregar a mensagem.' };
  }

  await supabase.from('mensagens').insert({
    caixa_id: perfil.id,
    pasta: 'enviados',
    direcao: 'enviada',
    remetente: perfil.endereco,
    remetente_nome: perfil.nome,
    para,
    cc,
    assunto: entrada.assunto,
    texto: entrada.texto,
    html: textoParaHtml(entrada.texto),
    message_id: messageId,
    in_reply_to: entrada.inReplyTo || null,
    lida: true,
    externa: externos.length > 0,
    provedor_id: provedorId
  });

  await supabase.from('envios').insert({
    perfil_id: perfil.id,
    destinatarios: todos.length,
    externos: externos.length
  });

  return { ok: true };
}
