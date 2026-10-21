import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(requisicao: NextRequest) {
  let resposta = NextResponse.next({ request: requisicao });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => requisicao.cookies.getAll(),
        setAll: (itens) => {
          itens.forEach(({ name, value }) => requisicao.cookies.set(name, value));
          resposta = NextResponse.next({ request: requisicao });
          itens.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        }
      }
    }
  );

  const { data } = await supabase.auth.getUser();
  const caminho = requisicao.nextUrl.pathname;
  const publico =
    caminho.startsWith('/entrar') ||
    caminho.startsWith('/configurar') ||
    caminho.startsWith('/api/inbound');

  if (!data?.user && !publico) {
    const destino = requisicao.nextUrl.clone();
    destino.pathname = '/entrar';
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
