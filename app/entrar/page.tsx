'use client';

import { useActionState } from 'react';
import { entrarAcao } from '../acoes';

const NOME_APP = process.env.NEXT_PUBLIC_NOME_APP || 'Correio da Robótica';
const DOMINIO = process.env.NEXT_PUBLIC_DOMINIO_EMAIL || '';

export default function Entrar() {
  const [estado, acao, carregando] = useActionState(entrarAcao, null);

  return (
    <div className="pagina">
      <div className="entrada-login">
        <div className="marca" style={{ justifyContent: 'center', marginBottom: 22, fontSize: 18 }}>
          <span className="selo">✉</span>
          {NOME_APP}
        </div>

        <div className="cartao" style={{ padding: 22 }}>
          <form action={acao} className="formulario">
            <label>
              Usuário
              <input name="usuario" autoComplete="username" autoFocus required placeholder="joao.silva" />
            </label>
            <div style={{ fontSize: 12.5, color: 'var(--tinta-suave)', marginTop: -8 }}>
              Seu endereço é usuario@{DOMINIO}
            </div>
            <label>
              Senha
              <input name="senha" type="password" autoComplete="current-password" required />
            </label>
            {estado?.erro && <div className="aviso">{estado.erro}</div>}
            <button className="botao" disabled={carregando} type="submit">
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--tinta-suave)', textAlign: 'center', marginTop: 16 }}>
          Esqueceu a senha? Fale com a professora.
        </p>
      </div>
    </div>
  );
}
