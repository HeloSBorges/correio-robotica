'use client';

import { useActionState } from 'react';
import { criarContaAcao, importarContasAcao, redefinirSenhaAcao } from '../acoes';

export function NovaConta({ dominio }: { dominio: string }) {
  const [estado, acao, carregando] = useActionState(criarContaAcao, null);

  return (
    <div className="cartao" style={{ padding: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 14 }}>Criar conta</div>
      <form action={acao} className="formulario">
        <div className="grade">
          <label>
            Nome completo
            <input name="nome" required placeholder="João da Silva" />
          </label>
          <label>
            Usuário (@{dominio})
            <input name="usuario" required placeholder="joao.silva" />
          </label>
          <label>
            Turma
            <input name="turma" placeholder="Robótica 7º ano" />
          </label>
          <label>
            Senha inicial
            <input name="senha" required minLength={8} placeholder="mínimo 8 caracteres" />
          </label>
          <label>
            Papel
            <select name="papel" defaultValue="aluno">
              <option value="aluno">Aluno</option>
              <option value="professor">Professor</option>
            </select>
          </label>
        </div>

        {estado?.erro && <div className="aviso">{estado.erro}</div>}
        {estado?.sucesso && <div className="sucesso">{estado.sucesso}</div>}

        <div className="acoes">
          <button className="botao" type="submit" disabled={carregando}>
            {carregando ? 'Criando…' : 'Criar conta'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function TrocarSenha({ id }: { id: string }) {
  const [estado, acao, carregando] = useActionState(redefinirSenhaAcao, null);

  return (
    <form action={acao} style={{ display: 'flex', gap: 6 }}>
      <input type="hidden" name="id" value={id} />
      <input
        name="senha"
        minLength={8}
        placeholder="nova senha"
        style={{ width: 140, padding: '6px 9px', fontSize: 13 }}
      />
      <button className="botao secundario" style={{ padding: '6px 11px', fontSize: 13 }} disabled={carregando}>
        {estado?.sucesso ? 'Ok' : 'Trocar'}
      </button>
    </form>
  );
}

export function ImportarContas() {
  const [estado, acao, carregando] = useActionState(importarContasAcao, null);

  function baixar() {
    const linhas = ['nome;endereco;senha;turma']
      .concat(estado.criadas.map((c: any) => [c.nome, c.endereco, c.senha, c.turma].join(';')))
      .join('\n');
    const url = URL.createObjectURL(new Blob([linhas], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'senhas-geradas.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="cartao" style={{ padding: 20, marginTop: 22 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Importar turma inteira</div>
      <p style={{ fontSize: 13, color: 'var(--tinta-suave)', marginTop: 0 }}>
        Uma linha por aluno, no formato <code>nome;usuario;turma;senha;papel</code>. Deixe em branco
        o que quiser automático — usuário sai do nome e a senha é gerada. Dá para colar direto de
        uma coluna do Excel ou do Google Planilhas.
      </p>

      <form action={acao} className="formulario">
        <textarea
          name="lista"
          required
          style={{ minHeight: 160, fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
          placeholder={'Ana Clara Souza;;Robótica 6º ano;;\nBruno Martins Lima;bruno.lima;Robótica 6º ano;;'}
        />

        {estado?.erro && <div className="aviso">{estado.erro}</div>}

        <div className="acoes">
          <button className="botao" type="submit" disabled={carregando}>
            {carregando ? 'Criando contas…' : 'Criar contas'}
          </button>
        </div>
      </form>

      {!!estado?.criadas?.length && (
        <div style={{ marginTop: 18 }}>
          <div className="sucesso" style={{ marginBottom: 12 }}>
            {estado.criadas.length} contas criadas. Baixe as senhas agora — elas não aparecem de novo.
          </div>
          <div className="acoes" style={{ marginBottom: 12 }}>
            <button type="button" className="botao secundario" onClick={baixar}>
              Baixar senhas em CSV
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Endereço</th>
                  <th>Senha</th>
                </tr>
              </thead>
              <tbody>
                {estado.criadas.map((c: any) => (
                  <tr key={c.endereco}>
                    <td>{c.nome}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{c.endereco}</td>
                    <td style={{ fontFamily: 'ui-monospace, monospace' }}>{c.senha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!!estado?.falhas?.length && (
        <div className="aviso" style={{ marginTop: 12 }}>
          Não criadas: {estado.falhas.join(' · ')}
        </div>
      )}
    </div>
  );
}
