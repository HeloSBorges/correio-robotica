'use client';

import { useActionState } from 'react';
import { criarPrimeiroProfessorAcao } from '../acoes';

const DOMINIO = process.env.NEXT_PUBLIC_DOMINIO_EMAIL || '';

export default function Configurar() {
  const [estado, acao, carregando] = useActionState(criarPrimeiroProfessorAcao, null);

  return (
    <div className="pagina">
      <div className="entrada-login">
        <div className="marca" style={{ justifyContent: 'center', marginBottom: 22, fontSize: 18 }}>
          <span className="selo">✉</span>
          Primeira conta
        </div>

        <div className="cartao" style={{ padding: 22 }}>
          {estado?.sucesso ? (
            <>
              <div className="sucesso">{estado.sucesso}</div>
              <a href="/entrar" className="botao" style={{ marginTop: 16, width: '100%' }}>
                Ir para o login
              </a>
            </>
          ) : (
            <form action={acao} className="formulario">
              <label>
                Código de instalação
                <input name="token" required placeholder="o que você pôs em TOKEN_INICIAL" />
              </label>
              <label>
                Seu nome
                <input name="nome" required placeholder="Heloísa Borges" />
              </label>
              <label>
                Usuário (@{DOMINIO})
                <input name="usuario" required placeholder="prof.helo" />
              </label>
              <label>
                Senha
                <input name="senha" type="password" required minLength={8} />
              </label>

              {estado?.erro && <div className="aviso">{estado.erro}</div>}

              <button className="botao" type="submit" disabled={carregando}>
                {carregando ? 'Criando…' : 'Criar minha conta'}
              </button>
            </form>
          )}
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--tinta-suave)', textAlign: 'center', marginTop: 16 }}>
          Esta página só funciona uma vez, enquanto não existir nenhuma conta de professora.
        </p>
      </div>
    </div>
  );
}
