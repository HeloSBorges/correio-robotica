import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function clienteServidor() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (itens) => {
          try {
            itens.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {}
        }
      }
    }
  );
}

export async function perfilAtual() {
  const supabase = await clienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao?.user) return null;
  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', sessao.user.id)
    .single();
  if (!perfil || !perfil.ativo) return null;
  return perfil;
}
