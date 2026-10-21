# Correio da Robótica Coopen

Um correio eletrônico fechado para a turma. Os alunos entram com usuário e senha, escrevem uns para os outros em endereços como `joao.silva@robotica.coopen.com.br`, têm caixa de entrada, enviados, lixeira e resposta — a experiência inteira de e-mail, só que dentro da sala de aula.

As mensagens não saem para a internet: ficam no seu banco de dados. Por isso **não precisa de domínio, nem de DNS, nem de provedor de e-mail, nem de verificação por telefone**, e você cria quantas contas quiser.

Roda em **Vercel** (site) + **Supabase** (banco, login e anexos). Os dois no plano gratuito.

**Tudo é feito pelo navegador.** Não precisa instalar nada nem abrir terminal.

---

## 1. Supabase (banco e login)

1. Crie um projeto em supabase.com. Guarde a senha do banco que ele pedir.
2. No menu lateral, abra **SQL Editor** → **New query**. Abra o arquivo `supabase/schema.sql` desta pasta em qualquer editor de texto (Bloco de Notas serve), copie tudo, cole na janela e clique em **Run**. Tem que aparecer "Success".
3. Vá em **Project Settings → API** e deixe a aba aberta; você copia daqui no passo 3:
   - `Project URL`
   - chave `anon public`
   - chave `service_role` (secreta — nunca chega ao navegador do aluno)
4. Em **Authentication → Sign In / Providers → Email**, desligue **Confirm email**. As contas já nascem confirmadas pelo painel; isso só evita qualquer tentativa de verificação.

## 2. Colocar o código no GitHub

A Vercel publica a partir de um repositório. Dá para fazer arrastando arquivos, sem Git instalado:

1. Descompacte `correio-robotica.zip` em uma pasta do computador.
2. Em github.com, clique em **New repository**. Nome: `correio-robotica`. Marque **Private**. Crie.
3. Na tela seguinte, clique em **uploading an existing file**.
4. Abra a pasta descompactada e **arraste tudo que está dentro dela** (as pastas `app`, `lib`, `supabase` e os arquivos soltos) para a área de upload. Não arraste o zip nem a pasta por fora.
5. Clique em **Commit changes**.

Se o navegador ignorar arquivos que começam com ponto (`.gitignore`, `.env.example`), tudo bem: eles não fazem falta no servidor.

## 3. Vercel (publicar o site)

1. Entre em vercel.com com a conta do GitHub.
2. **Add New → Project** → importe o repositório `correio-robotica`. Ela reconhece o Next.js sozinha; não mexa nas configurações de build.
3. Antes de clicar em Deploy, abra **Environment Variables** e cadastre:

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | o Project URL do passo 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave `anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave `service_role` |
| `DOMINIO_EMAIL` | `robotica.coopen.com.br` |
| `NEXT_PUBLIC_DOMINIO_EMAIL` | `robotica.coopen.com.br` |
| `NEXT_PUBLIC_NOME_APP` | `Correio da Robótica Coopen` |
| `TOKEN_INICIAL` | uma frase secreta que só você sabe |
| `POLITICA_ENVIO` | `interno` |

4. **Deploy**. Em poucos minutos você tem um endereço tipo `correio-robotica.vercel.app`.

O final do endereço dos alunos é só texto: como nada sai para a internet, `robotica.coopen.com.br`, `robotica.coopen` ou o que você preferir funcionam igual. Mude as duas variáveis de domínio antes de criar as contas, porque os endereços já criados não mudam sozinhos.

## 4. Criar sua conta de professora

Abra `https://SEU-ENDERECO.vercel.app/configurar`, informe o `TOKEN_INICIAL` que você escolheu, seu nome, o usuário (ex.: `prof.helo`) e uma senha.

Essa página se fecha sozinha depois da primeira conta de professora: a partir daí não cria mais ninguém.

## 5. Criar as contas dos alunos

Entre no site e vá na aba **Contas**. No bloco **Importar turma inteira**, cole uma linha por aluno:

```
Ana Clara Souza;;Robótica 6º ano;;
Bruno Martins Lima;bruno.lima;Robótica 6º ano;;
Carla Vieira;;Robótica 7º ano;minhasenha123;
```

O formato é `nome;usuario;turma;senha;papel`. Deixe em branco o que quiser automático: o usuário sai do nome (`ana.souza`) e a senha é gerada legível (`sensor-azul-4821`). Dá para colar direto de colunas do Excel ou do Google Planilhas.

Clique em **Criar contas**. A tela mostra a lista com as senhas e um botão **Baixar senhas em CSV** — baixe na hora, porque as senhas ficam guardadas só com hash e não aparecem de novo. Imprima, recorte e distribua. Se alguém perder, você gera outra na mesma tela.

O arquivo `alunos-exemplo.csv` serve de modelo. Para uma conta avulsa depois, use o bloco **Criar conta**.

Pronto. É só passar o endereço do site e as credenciais para a turma.

---

## O que você controla

Na aba **Contas** você bloqueia uma conta em um clique e troca a senha de quem esqueceu. Como professora, você também enxerga as mensagens da turma, o que ajuda a mediar se a brincadeira sair do rumo.

Cada aluno pode mandar no máximo 15 mensagens por hora, 50 por dia e 10 destinatários por vez — o que evita corrente de e-mail e a turma inteira sendo marcada em tudo. Para mudar, cadastre `LIMITE_ENVIOS_HORA`, `LIMITE_ENVIOS_DIA` e `MAX_DESTINATARIOS` na Vercel com outros valores.

Com `POLITICA_ENVIO=interno`, escrever para um endereço de fora (um Gmail, por exemplo) é recusado com uma mensagem explicando. Vale como conteúdo da aula: dá para mostrar por que um endereço precisa existir de verdade para receber algo.

Mudou alguma variável na Vercel? Faça **Redeploy** no último deploy para valer.

---

## Custos

Zero. Supabase e Vercel no plano gratuito aguentam 80 alunos com folga, e não há domínio nem provedor de e-mail envolvido.

## Se um dia quiser e-mail de verdade

O código já está preparado. Seria preciso um subdomínio real com acesso ao DNS, uma conta no Resend com os registros de DKIM, SPF, MX e DMARC publicados, e as variáveis `RESEND_API_KEY` e `RESEND_WEBHOOK_SECRET` cadastradas na Vercel. A partir daí o mesmo site passa a mandar e receber da internet, e `POLITICA_ENVIO` decide quem pode falar com fora. Me chama na hora que for o caso.

## Mexer no site depois

Não precisa de editor instalado. No repositório do GitHub, clique no arquivo e no ícone de lápis; ou aperte a tecla `.` com o repositório aberto, que abre um editor completo no navegador. Ao salvar, a Vercel republica sozinha em um ou dois minutos.

## Estrutura

```
app/caixa           caixa de entrada, enviados e lixeira
app/escrever        nova mensagem e resposta
app/admin           painel da professora: contas e importação da turma
app/configurar      criação da primeira conta de professora
lib/correio.ts      regras de envio, entrega e limites
supabase/schema.sql tabelas, permissões e bucket de anexos
```
