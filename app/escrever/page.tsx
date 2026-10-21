import { redirect } from 'next/navigation';
import { Barra } from '../componentes/barra';
import { perfilAtual, clienteServidor } from '@/lib/supabase-servidor';
import { Redacao } from './redacao';
import { POLITICA_ENVIO } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function Escrever({ searchParams }: { searchParams: Promise<any> }) {
  const perfil = await perfilAtual();
  if (!perfil) redirect('/entrar');

  const parametros = await searchParams;
  const supabase = await clienteServidor();
  const { data: contatos } = await supabase
    .from('perfis')
    .select('endereco, nome, turma')
    .eq('ativo', true)
    .order('nome');

  const somenteInterno =
    POLITICA_ENVIO === 'interno' || (!perfil.envio_externo && perfil.papel !== 'professor');

  return (
    <>
      <Barra perfil={perfil} atual="escrever" />
      <main className="pagina">
        <h1 className="titulo">Nova mensagem</h1>
        <Redacao
          contatos={contatos || []}
          somenteInterno={somenteInterno}
          inicial={{
            para: parametros?.para || '',
            assunto: parametros?.assunto || '',
            responder_a: parametros?.responder_a || ''
          }}
        />
      </main>
    </>
  );
}
