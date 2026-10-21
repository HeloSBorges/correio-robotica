import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Barra } from '../../componentes/barra';
import { moverAcao } from '../../acoes';
import { perfilAtual, clienteServidor } from '@/lib/supabase-servidor';

export const dynamic = 'force-dynamic';

function limparHtml(html: string) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/ on[a-z]+="[^"]*"/gi, '')
    .replace(/ on[a-z]+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export default async function Mensagem({ params }: { params: Promise<{ id: string }> }) {
  const perfil = await perfilAtual();
  if (!perfil) redirect('/entrar');

  const { id } = await params;
  const supabase = await clienteServidor();

  const { data: mensagem } = await supabase.from('mensagens').select('*').eq('id', id).single();
  if (!mensagem) notFound();

  const { data: anexos } = await supabase
    .from('anexos')
    .select('id, nome, tipo, tamanho')
    .eq('mensagem_id', id);

  if (!mensagem.lida) await supabase.from('mensagens').update({ lida: true }).eq('id', id);

  const suspeita =
    mensagem.externa && (mensagem.spf === 'fail' || mensagem.dmarc === 'fail');

  const respostaPara = mensagem.direcao === 'enviada' ? (mensagem.para || []).join(', ') : mensagem.remetente;

  return (
    <>
      <Barra perfil={perfil} atual={mensagem.pasta} />
      <main className="pagina">
        <div className="acoes" style={{ marginBottom: 16 }}>
          <Link href={'/caixa?pasta=' + mensagem.pasta} className="botao discreto">
            Voltar
          </Link>
          <Link
            href={
              '/escrever?para=' +
              encodeURIComponent(respostaPara) +
              '&assunto=' +
              encodeURIComponent('Re: ' + (mensagem.assunto || '')) +
              '&responder_a=' +
              encodeURIComponent(mensagem.message_id || '')
            }
            className="botao"
          >
            Responder
          </Link>
          {mensagem.pasta !== 'lixeira' && (
            <form action={moverAcao}>
              <input type="hidden" name="id" value={mensagem.id} />
              <input type="hidden" name="pasta" value="lixeira" />
              <button className="botao discreto" type="submit">Mover para lixeira</button>
            </form>
          )}
        </div>

        {suspeita && (
          <div className="aviso" style={{ marginBottom: 16 }}>
            Esta mensagem não passou na verificação de autenticidade do remetente. Desconfie de
            links e anexos.
          </div>
        )}

        <article className="cartao">
          <div className="cabecalho-msg">
            <h1>{mensagem.assunto || '(sem assunto)'}</h1>
            <div className="meta">
              <div>
                <strong>{mensagem.remetente_nome || mensagem.remetente}</strong>{' '}
                &lt;{mensagem.remetente}&gt;{' '}
                {mensagem.externa && <span className="etiqueta externa">externo</span>}
              </div>
              <div>Para: {(mensagem.para || []).join(', ')}</div>
              {!!(mensagem.cc || []).length && <div>Cc: {(mensagem.cc || []).join(', ')}</div>}
              <div>{new Date(mensagem.criada_em).toLocaleString('pt-BR')}</div>
            </div>
          </div>

          {mensagem.html ? (
            <div className="corpo" dangerouslySetInnerHTML={{ __html: limparHtml(mensagem.html) }} />
          ) : (
            <div className="corpo" style={{ whiteSpace: 'pre-wrap' }}>{mensagem.texto}</div>
          )}

          {!!anexos?.length && (
            <div style={{ padding: '0 22px 22px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tinta-suave)', marginBottom: 8 }}>
                ANEXOS
              </div>
              <div className="acoes">
                {anexos.map((a) => (
                  <a key={a.id} href={'/api/anexo/' + a.id} className="botao secundario">
                    {a.nome}
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
    </>
  );
}
