const PALAVRAS = ['robo', 'motor', 'sensor', 'lego', 'bloco', 'cabo', 'led', 'garra', 'roda', 'engrenagem'];
const CORES = ['azul', 'verde', 'vermelho', 'amarelo', 'roxo', 'laranja', 'prata'];

export function gerarSenha() {
  const a = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
  const b = CORES[Math.floor(Math.random() * CORES.length)];
  const n = String(Math.floor(1000 + Math.random() * 9000));
  return a + '-' + b + '-' + n;
}

export function semAcento(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function usuarioDe(nome: string) {
  const partes = semAcento(nome.toLowerCase()).split(/\s+/).filter(Boolean);
  const primeiro = partes[0] || 'aluno';
  const ultimo = partes.length > 1 ? partes[partes.length - 1] : '';
  return (ultimo ? primeiro + '.' + ultimo : primeiro).replace(/[^a-z0-9._-]/g, '');
}

export function lerLista(texto: string) {
  const linhas = String(texto || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (linhas.length && /^nome[;,\t]/i.test(linhas[0])) linhas.shift();

  return linhas.map((linha) => {
    const separador = linha.includes(';') ? ';' : linha.includes('\t') ? '\t' : ',';
    const [nome, usuario, turma, senha, papel] = linha.split(separador).map((c) => (c || '').trim());
    return {
      nome,
      usuario: (usuario || (nome ? usuarioDe(nome) : '')).toLowerCase().replace(/[^a-z0-9._-]/g, ''),
      turma: turma || null,
      senha: senha || gerarSenha(),
      papel: papel === 'professor' ? 'professor' : 'aluno'
    };
  }).filter((c) => c.nome && c.usuario);
}
