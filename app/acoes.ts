'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { clienteServidor, perfilAtual } from '@/lib/supabase-servidor';
import { clienteAdmin } from '@/lib/supabase-admin';
import { enviarMensagem, normalizar } from '@/lib/correio';
import { lerLista } from '@/lib/contas';
import { DOMINIO } from '@/lib/config';

function enderecoCompleto(entrada: string) {
  const valor = normalizar(entrada);
  return valor.includes('@') ? valor : valor + '@' + DOMINIO;
}

export async function entrarAcao(_anterior: any, dados: FormData) {
  const supabase = await clienteServidor();
  const endereco = enderecoCompleto(String(dados.get('usuario') || ''));
  const senha = String(dados.get('senha') || '');

  const { error } = await supabase.auth.signInWithPassword({ email: endereco, password: senha });
  if (error) return { erro: 'Usuário ou senha incorretos.' };

  redirect('/caixa');
}

export async function sairAcao() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  redirect('/entrar');
}

export async function enviarAcao(_anterior: any, dados: FormData) {
  const perfil = await perfilAtual();
  if (!perfil) return { erro: 'Sessão expirada.' };

  const resultado = await enviarMensagem(perfil, {
    para: String(dados.get('para') || ''),
    cc: String(dados.get('cc') || ''),
    assunto: String(dados.get('assunto') || ''),
    texto: String(dados.get('texto') || ''),
    inReplyTo: String(dados.get('responder_a') || '') || null
  });

  if (resultado.erro) return { erro: resultado.erro };

  revalidatePath('/caixa');
  redirect('/caixa?pasta=enviados&enviada=1');
}

export async function moverAcao(dados: FormData) {
  const supabase = await clienteServidor();
  const id = String(dados.get('id') || '');
  const pasta = String(dados.get('pasta') || 'lixeira');
  await supabase.from('mensagens').update({ pasta }).eq('id', id);
  revalidatePath('/caixa');
  redirect('/caixa');
}

export async function criarContaAcao(_anterior: any, dados: FormData) {
  const perfil = await perfilAtual();
  if (!perfil || perfil.papel !== 'professor') return { erro: 'Acesso restrito.' };

  const nome = String(dados.get('nome') || '').trim();
  const usuario = normalizar(String(dados.get('usuario') || '')).replace(/[^a-z0-9._-]/g, '');
  const senha = String(dados.get('senha') || '');
  const turma = String(dados.get('turma') || '').trim() || null;
  const papel = String(dados.get('papel') || 'aluno');

  if (!nome || !usuario) return { erro: 'Preencha nome e usuário.' };
  if (senha.length < 8) return { erro: 'A senha precisa ter ao menos 8 caracteres.' };

  const endereco = usuario + '@' + DOMINIO;
  const admin = clienteAdmin();

  const { data: criado, error } = await admin.auth.admin.createUser({
    email: endereco,
    password: senha,
    email_confirm: true,
    user_metadata: { nome }
  });

  if (error) return { erro: 'Não foi possível criar: ' + error.message };

  const { error: erroPerfil } = await admin.from('perfis').insert({
    id: criado.user.id,
    endereco,
    nome,
    turma,
    papel
  });

  if (erroPerfil) {
    await admin.auth.admin.deleteUser(criado.user.id);
    return { erro: 'Esse endereço já existe.' };
  }

  revalidatePath('/admin');
  return { sucesso: 'Conta criada: ' + endereco };
}

export async function redefinirSenhaAcao(_anterior: any, dados: FormData) {
  const perfil = await perfilAtual();
  if (!perfil || perfil.papel !== 'professor') return { erro: 'Acesso restrito.' };

  const id = String(dados.get('id') || '');
  const senha = String(dados.get('senha') || '');
  if (senha.length < 8) return { erro: 'A senha precisa ter ao menos 8 caracteres.' };

  const { error } = await clienteAdmin().auth.admin.updateUserById(id, { password: senha });
  if (error) return { erro: 'Não foi possível trocar a senha.' };

  revalidatePath('/admin');
  return { sucesso: 'Senha atualizada.' };
}

export async function alternarAcao(dados: FormData) {
  const perfil = await perfilAtual();
  if (!perfil || perfil.papel !== 'professor') return;

  const id = String(dados.get('id') || '');
  const campo = String(dados.get('campo') || '');
  const valor = String(dados.get('valor') || '') === 'true';

  if (campo !== 'ativo' && campo !== 'envio_externo') return;

  await clienteAdmin().from('perfis').update({ [campo]: valor }).eq('id', id);
  revalidatePath('/admin');
}

export async function importarContasAcao(_anterior: any, dados: FormData) {
  const perfil = await perfilAtual();
  if (!perfil || perfil.papel !== 'professor') return { erro: 'Acesso restrito.' };

  const lista = lerLista(String(dados.get('lista') || ''));
  if (!lista.length) return { erro: 'Nenhuma linha válida encontrada. Use: nome;usuario;turma;senha;papel' };
  if (lista.length > 200) return { erro: 'Importe no máximo 200 contas por vez.' };

  const admin = clienteAdmin();
  const criadas: any[] = [];
  const falhas: string[] = [];

  for (const conta of lista) {
    const endereco = conta.usuario + '@' + DOMINIO;

    const { data: criado, error } = await admin.auth.admin.createUser({
      email: endereco,
      password: conta.senha,
      email_confirm: true,
      user_metadata: { nome: conta.nome }
    });

    if (error) {
      falhas.push(endereco + ' — ' + error.message);
      continue;
    }

    const { error: erroPerfil } = await admin.from('perfis').insert({
      id: criado.user.id,
      endereco,
      nome: conta.nome,
      turma: conta.turma,
      papel: conta.papel
    });

    if (erroPerfil) {
      await admin.auth.admin.deleteUser(criado.user.id);
      falhas.push(endereco + ' — endereço já existe');
      continue;
    }

    criadas.push({ nome: conta.nome, endereco, senha: conta.senha, turma: conta.turma || '' });
  }

  revalidatePath('/admin');
  return { criadas, falhas };
}

export async function criarPrimeiroProfessorAcao(_anterior: any, dados: FormData) {
  const token = String(dados.get('token') || '');
  const esperado = process.env.TOKEN_INICIAL || '';

  if (!esperado || token !== esperado) return { erro: 'Código de instalação incorreto.' };

  const admin = clienteAdmin();
  const { count } = await admin
    .from('perfis')
    .select('id', { count: 'exact', head: true })
    .eq('papel', 'professor');

  if ((count || 0) > 0) return { erro: 'A conta de professora já foi criada. Entre pela tela de login.' };

  const nome = String(dados.get('nome') || '').trim();
  const usuario = normalizar(String(dados.get('usuario') || '')).replace(/[^a-z0-9._-]/g, '');
  const senha = String(dados.get('senha') || '');

  if (!nome || !usuario) return { erro: 'Preencha nome e usuário.' };
  if (senha.length < 8) return { erro: 'A senha precisa ter ao menos 8 caracteres.' };

  const endereco = usuario + '@' + DOMINIO;

  const { data: criado, error } = await admin.auth.admin.createUser({
    email: endereco,
    password: senha,
    email_confirm: true,
    user_metadata: { nome }
  });

  if (error) return { erro: 'Não foi possível criar: ' + error.message };

  const { error: erroPerfil } = await admin.from('perfis').insert({
    id: criado.user.id,
    endereco,
    nome,
    papel: 'professor',
    envio_externo: true
  });

  if (erroPerfil) {
    await admin.auth.admin.deleteUser(criado.user.id);
    return { erro: 'Esse endereço já existe.' };
  }

  return { sucesso: 'Conta criada: ' + endereco + '. Agora é só entrar.' };
}
