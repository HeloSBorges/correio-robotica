export const DOMINIO = (process.env.DOMINIO_EMAIL || '').toLowerCase().trim();

export const NOME_APP = process.env.NEXT_PUBLIC_NOME_APP || 'Correio da Robótica';

export const POLITICA_ENVIO = (process.env.POLITICA_ENVIO || 'interno').trim() as
  | 'interno'
  | 'allowlist'
  | 'aberto';

export const DOMINIOS_PERMITIDOS = (process.env.DOMINIOS_PERMITIDOS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export const LIMITE_DIA = Number(process.env.LIMITE_ENVIOS_DIA || 50);
export const LIMITE_HORA = Number(process.env.LIMITE_ENVIOS_HORA || 15);
export const MAX_DESTINATARIOS = Number(process.env.MAX_DESTINATARIOS || 10);

export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
export const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';
