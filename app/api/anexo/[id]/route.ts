import { NextResponse } from 'next/server';
import { clienteServidor } from '@/lib/supabase-servidor';
import { clienteAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(_requisicao: Request, contexto: any) {
  const { id } = await contexto.params;
  const supabase = await clienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao?.user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 });

  const { data: anexo } = await supabase
    .from('anexos')
    .select('caminho, nome')
    .eq('id', id)
    .single();

  if (!anexo) return NextResponse.json({ erro: 'não encontrado' }, { status: 404 });

  const { data: assinado } = await clienteAdmin()
    .storage.from('anexos')
    .createSignedUrl(anexo.caminho, 300, { download: anexo.nome });

  if (!assinado?.signedUrl) return NextResponse.json({ erro: 'indisponível' }, { status: 404 });
  return NextResponse.redirect(assinado.signedUrl);
}
