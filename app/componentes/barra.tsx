import Link from 'next/link';
import { sairAcao } from '../acoes';
import { NOME_APP } from '@/lib/config';

export function Barra({ perfil, atual }: { perfil: any; atual: string }) {
  const abas = [
    { href: '/caixa', rotulo: 'Entrada', chave: 'entrada' },
    { href: '/caixa?pasta=enviados', rotulo: 'Enviados', chave: 'enviados' },
    { href: '/caixa?pasta=lixeira', rotulo: 'Lixeira', chave: 'lixeira' },
    { href: '/escrever', rotulo: 'Escrever', chave: 'escrever' }
  ];

  return (
    <header className="barra">
      <Link href="/caixa" className="marca">
        <span className="selo">✉</span>
        {NOME_APP}
      </Link>

      <nav>
        {abas.map((aba) => (
          <Link key={aba.chave} href={aba.href} className={atual === aba.chave ? 'ativo' : ''}>
            {aba.rotulo}
          </Link>
        ))}
        {perfil.papel === 'professor' && (
          <Link href="/admin" className={atual === 'admin' ? 'ativo' : ''}>
            Contas
          </Link>
        )}
      </nav>

      <div className="direita">
        <span>{perfil.endereco}</span>
        <form action={sairAcao}>
          <button className="botao discreto" type="submit" style={{ padding: '6px 12px' }}>
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
