# Firebase Auth — configuração e teste

O projeto usa somente Firebase Authentication com Google no plano gratuito **Spark**. O frontend permanece no GitHub Pages; documentos e dados de módulos continuam no Drive. Não habilite Blaze, Firestore, Cloud Functions, Storage ou Analytics. Dependências do pacote Firebase podem aparecer no lockfile; o código importa apenas App e Auth.

## Configuração manual do titular

1. No [console Firebase](https://console.firebase.google.com/), adicione Firebase ao projeto Google existente, quando possível, ou selecione o projeto `myhub-847d2` informado. Confira **Spark** no plano do projeto. [Planos e cotas oficiais](https://firebase.google.com/pricing).
2. Em **Project settings → General → Your apps**, registre/selecione o app Web. Não é necessário configurar Firebase Hosting nem Analytics. A [configuração pública do app](https://firebase.google.com/docs/web/setup#register-app) fornecida pelo usuário já está em `src/integrations/firebase/config.json`: somente `apiKey`, `authDomain`, `projectId` e `appId` são usados. Não envie conta de serviço, chave privada ou client secret.
3. Em [Authentication → Sign-in method](https://console.firebase.google.com/project/myhub-847d2/authentication/providers), habilite **Google**, selecione o email público de suporte e salve. Guia: [login Google com Firebase](https://firebase.google.com/docs/auth/web/google-signin). Não acrescente escopos Drive a esse provedor de login.
4. Em [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/myhub-847d2/authentication/settings), inclua `localhost`, `127.0.0.1` se usar esse endereço, e `jcntck.github.io`. Domínios não incluem protocolo, porta ou caminho. Localhost pode não ser cadastrado automaticamente em projetos recentes.
5. O login Firebase usa o cliente OAuth do provedor configurado no Firebase; a conexão Drive continua usando o client ID público da etapa anterior, com `drive.file` e `openid`. Mantenha [as origens e a Drive API](google-drive-setup.md) corretas e, se o consentimento estiver em teste, cadastre as contas usadas. O retorno do Firebase para OAuth usa o domínio `authDomain` e o caminho `/__/auth/handler` mostrado no console; ao personalizar o cliente OAuth, cadastre exatamente o URI apresentado pelo Firebase. Não substitua esse URI pela rota hash do hub.
6. Confira [Authentication → Usage](https://console.firebase.google.com/project/myhub-847d2/authentication/usage) e os limites no console/documentação. O projeto não muda de plano automaticamente nem contrata capacidade. Erros `auth/quota-exceeded` ou `auth/too-many-requests` exibem mensagem recuperável e não são contornados abrindo serviços pagos.

A chave `apiKey` desse objeto identifica o app e é pública. Revise as restrições aplicáveis às APIs Firebase conforme [orientação oficial sobre API keys](https://firebase.google.com/docs/projects/api-keys). Não aplique restrições que impeçam as APIs de autenticação necessárias. Dados sensíveis da conta e tokens nunca devem ser enviados como evidência.

## Execução local

```sh
git switch dev
git pull origin dev
npm ci
npm run dev -- --host localhost
```

Abra `http://localhost:5173/`. A configuração pública recebida já é o padrão; `.env.local` não é necessário para Firebase. Para usar outro projeto, sobrescreva as variáveis `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID` de `.env.example` e reinicie Vite. O build recebe essas mesmas variáveis opcionais do repositório; seus valores são públicos. Nunca inclua client secret, conta de serviço ou chave privada.

Para testar o artefato, execute `npm run build`, `npm run preview -- --host localhost` e abra `http://localhost:4173/`.

## Roteiro de avaliação

- Sem login: Início público, botão de entrada e ausência de Conexão no menu. Abrir `/#/connection` deve levar à entrada; após login válido, voltar a Conexão. Rota desconhecida mantém o 404. Durante restauração não mostrar dados pessoais nem redirecionar antes de verificar a sessão.
- Após entrar, confirme a foto Google no círculo do cabeçalho, com nome e ações de conta preservados. Se a conta não tiver foto ou a imagem falhar, são mostradas as iniciais. Isso não exige nova permissão/configuração.
- Entre com Google e confirme que não foi pedido Drive. Recarregue ou feche/reabra: login deve voltar após verificação, mantendo a rota. Use duas abas e saia em uma: a outra deve remover conteúdo pessoal.
- O prazo máximo é **30 dias desde a autenticação**, e refresh/renovação do ID token não o prolongam. Testes automatizados controlam o relógio; não são evidência de esperar fisicamente 30 dias. Logout ou sessão invalidada podem encerrar antes.
- Se o navegador bloquear persistência, o hub informa login temporário. Restaurar com rede indisponível deve mostrar erro recuperável, sem dar acesso apenas pelo perfil em cache.
- Conecte Drive com a mesma conta do login. O refresh restaura só o login; Drive pede reconexão. Recusar/fechar popup, revogar ou expirar autorização Drive não deve encerrar o login. Selecione B no Drive enquanto o login é A: bloquear antes de ler arquivos. Para usar B, troque o login explicitamente.
- Em Conexão, clique **Preparar amostra**: ainda não há gravação. Clique **Sincronizar**: conferir a mesma conta, leitura de base e confirmação remota. Reler deve mostrar o mesmo UUID; o link abre o arquivo privado na conta que tiver permissão. Sem pendência, sincronizar só lê e não cria arquivo vazio.
- Durante um envio, prepare outra amostra: a primeira confirmação deve deixar a nova alteração pendente. Falha de rede/resposta perdida deve manter a identidade da tentativa para repetir. Divergência entre abas não sobrescreve automaticamente; reler pede decisão de descartar alterações locais.
- Ative **Sincronizar automaticamente nesta sessão** e prepare amostra: envio após breve espera, sem cliques extras enquanto Drive estiver válido. Erro, conflito e expiração pausam a automação; ela não abre popup automaticamente. Sem alteração não há polling. Ao recarregar/sair/trocar conta volta ao modo manual; não há tarefa com navegador fechado.
- Alterações pendentes existem somente na memória desta aba. Login persistente não as recupera após refresh. Sair/trocar conta remove dados e pendências; o navegador avisa ao sair com alterações quando puder.
- Inspecione Local/Session Storage e IndexedDB: credenciais **Firebase Auth gerenciadas pelo SDK** são esperadas. Não deve haver token Google Drive, cópias próprias de credenciais ou documento privado persistido pelo hub. URLs, logs e pacote não contêm credenciais de usuário. Não publique dumps/prints de tokens.

Após merge pelo usuário, repetir o roteiro no [Pages](https://jcntck.github.io/). Registrar resultados sanitizados em `docs/releases/0.3.1.md`. Login, consentimento e persistência reais aguardam a configuração e avaliação do titular; os testes simulados não os substituem.
