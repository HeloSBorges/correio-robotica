import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Barra } from '../componentes/barra';
import { perfilAtual, clienteServidor } from '@/lib/supabase-servidor';

export const dynamic = 'force-dynamic';

function quando(valor: string) {
  const data = new Date(valor);
  const hoje = new Date();
  const mesmoDia = data.toDateString() === hoje.toDateString();
  return mesmoDia
    ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function previa(mensagem: any) {
  const base = mensagem.texto || String(mensagem.html || '').replace(/<[^>]+>/g, ' ');
  return base.replace(/\s+/g, ' ').trim().slice(0, 120);
}

export default async function Caixa({ searchParams }: { searchParams: Promise<any> }) {
  const perfil = await perfilAtual();
  if (!perfil) redirect('/entrar');

  const parametros = await searchParams;
  const pasta = ['entrada', 'enviados', 'lixeira'].includes(parametros?.pasta)
    ? parametros.pasta
    : 'entrada';

  const supabase = await clienteServidor();
  const { data: mensagens } = await supabase
    .from('mensagens')
    .select('id, remetente, remetente_nome, para, assunto, texto, html, lida, externa, criada_em')
    .eq('caixa_id', perfil.id)
    .eq('pasta', pasta)
    .order('criada_em', { ascending: false })
    .limit(100);

  const titulos: Record<string, string> = {
    entrada: 'Caixa de entrada',
    enviados: 'Enviados',
    lixeira: 'Lixeira'
  };

  return (
    <>
      <Barra perfil={perfil} atual={pasta} />
      <main className="pagina">
        <div className="acoes" style={{ marginBottom: 16 }}>
          <h1 className="titulo" style={{ margin: 0 }}>{titulos[pasta]}</h1>
          <Link href="/escrever" className="botao" style={{ marginLeft: 'auto' }}>
            Escrever
          </Link>
        </div>

        {parametros?.enviada && <div className="sucesso" style={{ marginBottom: 16 }}>Mensagem enviada.</div>}

        <div className="cartao">
          {!mensagens?.length && (
            <div className="vazio">Nenhuma mensagem por aqui ainda.</div>
          )}

          <ul className="lista">
            {(mensagens || []).map((m) => (
              <li key={m.id}>
                <Link
                  href={'/caixa/' + m.id}
                  className={'item' + (!m.lida && pasta === 'entrada' ? ' naolida' : '')}
                >
                  <div className="linha">
                    <span className="de">
                      {pasta === 'enviados'
                        ? 'Para: ' + (m.para || []).join(', ')
                        : m.remetente_nome || m.remetente}
                    </span>
                    <span className="assunto">{m.assunto || '(sem assunto)'}</span>
                    <span className="data">{quando(m.criada_em)}</span>
                  </div>
                  <div className="previa">{previa(m)}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
