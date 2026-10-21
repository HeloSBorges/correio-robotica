'use client';

import { useActionState } from 'react';
import { enviarAcao } from '../acoes';

export function Redacao({
  contatos,
  somenteInterno,
  inicial
}: {
  contatos: any[];
  somenteInterno: boolean;
  inicial: { para: string; assunto: string; responder_a: string };
}) {
  const [estado, acao, carregando] = useActionState(enviarAcao, null);

  return (
    <div className="cartao" style={{ padding: 22 }}>
      <form action={acao} className="formulario">
        <input type="hidden" name="responder_a" defaultValue={inicial.responder_a} />

        <label>
          Para
          <input
            name="para"
            list="contatos"
            required
            defaultValue={inicial.para}
            placeholder="colega@dominio, outro@dominio"
          />
        </label>

        <datalist id="contatos">
          {contatos.map((c) => (
            <option key={c.endereco} value={c.endereco}>
              {c.nome}
              {c.turma ? ' — ' + c.turma : ''}
            </option>
          ))}
        </datalist>

        <label>
          Cópia (opcional)
          <input name="cc" placeholder="separe por vírgula" />
        </label>

        <label>
          Assunto
          <input name="assunto" defaultValue={inicial.assunto} placeholder="Sobre o projeto…" />
        </label>

        <label>
          Mensagem
          <textarea name="texto" required placeholder="Escreva aqui…" />
        </label>

        {somenteInterno && (
          <div style={{ fontSize: 13, color: 'var(--tinta-suave)' }}>
            Sua conta envia apenas para endereços da escola.
          </div>
        )}

        {estado?.erro && <div className="aviso">{estado.erro}</div>}

        <div className="acoes">
          <button className="botao" type="submit" disabled={carregando}>
            {carregando ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
