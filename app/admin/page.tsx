import { redirect } from 'next/navigation';
import { Barra } from '../componentes/barra';
import { alternarAcao } from '../acoes';
import { perfilAtual } from '@/lib/supabase-servidor';
import { clienteAdmin } from '@/lib/supabase-admin';
import { DOMINIO, POLITICA_ENVIO } from '@/lib/config';
import { ImportarContas, NovaConta, TrocarSenha } from './formularios';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  const perfil = await perfilAtual();
  if (!perfil) redirect('/entrar');
  if (perfil.papel !== 'professor') redirect('/caixa');

  const { data: contas } = await clienteAdmin()
    .from('perfis')
    .select('*')
    .order('papel')
    .order('nome');

  return (
    <>
      <Barra perfil={perfil} atual="admin" />
      <main className="pagina">
        <h1 className="titulo">Contas</h1>

        <div className="grade" style={{ marginBottom: 22 }}>
          <div className="cartao" style={{ padding: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{contas?.length || 0}</div>
            <div style={{ fontSize: 13, color: 'var(--tinta-suave)' }}>contas criadas</div>
          </div>
          <div className="cartao" style={{ padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{DOMINIO}</div>
            <div style={{ fontSize: 13, color: 'var(--tinta-suave)' }}>domínio das caixas</div>
          </div>
          <div className="cartao" style={{ padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {POLITICA_ENVIO === 'interno'
                ? 'Só interno'
                : POLITICA_ENVIO === 'allowlist'
                ? 'Lista liberada'
                : 'Aberto'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--tinta-suave)' }}>política de envio</div>
          </div>
        </div>

        <NovaConta dominio={DOMINIO} />

        <ImportarContas />

        <div className="cartao" style={{ marginTop: 22, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Endereço</th>
                <th>Turma</th>
                <th>Papel</th>
                <th>Status</th>
                <th>Externo</th>
                <th>Senha</th>
              </tr>
            </thead>
            <tbody>
              {(contas || []).map((c) => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{c.endereco}</td>
                  <td>{c.turma || '—'}</td>
                  <td>{c.papel}</td>
                  <td>
                    <form action={alternarAcao}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="campo" value="ativo" />
                      <input type="hidden" name="valor" value={String(!c.ativo)} />
                      <button className="botao discreto" style={{ padding: '5px 11px', fontSize: 13 }}>
                        {c.ativo ? 'Ativa' : 'Bloqueada'}
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={alternarAcao}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="campo" value="envio_externo" />
                      <input type="hidden" name="valor" value={String(!c.envio_externo)} />
                      <button className="botao discreto" style={{ padding: '5px 11px', fontSize: 13 }}>
                        {c.envio_externo ? 'Liberado' : 'Bloqueado'}
                      </button>
                    </form>
                  </td>
                  <td>
                    <TrocarSenha id={c.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
