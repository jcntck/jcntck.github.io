# Configuração Google Drive

A integração usa GIS no navegador, sem backend ou client secret. Só o client ID é público. Não habilite cobrança ou serviços pagos para esta etapa.

1. Crie/selecione um projeto no [Google Cloud](https://console.cloud.google.com/projectcreate). Habilite a [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com).
2. Configure o [Google Auth Platform](https://console.cloud.google.com/auth/overview): nome My Hub, email de suporte e contato. Em Público-alvo, use Externo para contas pessoais; em modo de teste, inclua as contas que usarão a homologação. Em Acesso a dados, declare somente `https://www.googleapis.com/auth/drive.file`.
3. Em [Clientes](https://console.cloud.google.com/auth/clients), crie um ID OAuth do tipo **Aplicativo da Web**. Em Origens JavaScript autorizadas, cadastre exatamente `http://localhost:5173`, `http://localhost:4173` e `https://jcntck.github.io`. Não inclua caminho, fragmento ou barra final. Não há URI de redirecionamento neste fluxo de popup. Guia oficial: [configurar GIS](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid).
4. Copie apenas o client ID terminado em `.apps.googleusercontent.com`. Não copie nem envie client secret. O ID público fornecido pelo titular já está em `src/integrations/google-drive/config.json`, usado por padrão em desenvolvimento e produção. Para usar outro cliente no desenvolvimento, copie `.env.example` para `.env.local`, preencha `VITE_GOOGLE_CLIENT_ID` e reinicie Vite. `.env.local` é ignorado pelo Git.
5. Opcionalmente, para substituir o ID público padrão em produção, em [Settings → Secrets and variables → Actions → Variables](https://github.com/jcntck/jcntck.github.io/settings/variables/actions), crie a variável de repositório `VITE_GOOGLE_CLIENT_ID` com esse ID público. Os workflows Dev e Prod incorporam a variável no build. Sem essa variável, o build utiliza o ID público versionado; não é necessário cadastrar a variável para esta entrega.

O client ID público está configurado; a API, as origens e as contas de teste ainda precisam estar habilitadas no Google Cloud. Não há credenciais nem amostra simulada em produção. Alterar a variável após o build requer reconstruir o artefato pelo workflow.

## Teste local e homologação

A partir de `0.3.0`, entre primeiro no hub conforme [configuração Firebase](firebase-setup.md). O login persiste e a conexão Drive permanece independente. Use **Preparar amostra** e depois **Sincronizar** para controlar o envio; preparar não grava no Drive.

Execute `npm ci`, `npm run dev -- --host localhost` e abra `http://localhost:5173/#/connection`. Para validar o artefato: `npm run build`, `npm run preview -- --host localhost`, abra `http://localhost:4173/#/connection`.

- Conecte a conta A. Antes de gravar, confirme que nenhum arquivo foi criado. Grave amostra, anote somente seu UUID técnico e releia: deve aparecer o mesmo UUID.
- Abra `https://jcntck.github.io/#/connection` após publicação. Conecte a mesma conta em outro dispositivo e compare a amostra. O teste local utiliza o mesmo documento quando utiliza o mesmo projeto OAuth.
- Desconecte e conecte B. Confirme ausência dos dados de A. Grave outra amostra em B; volte para A e confira seu UUID original.
- Recuse o consentimento e feche o popup em tentativas separadas. Nenhum arquivo deve ser criado/alterado. Permita popups se o navegador bloquear.
- Aguarde expiração ou [revogue o acesso](https://myaccount.google.com/connections). Uma operação deve solicitar reconexão; não deve confirmar gravação. Reconecte A para conferir/repetir a mesma tentativa. Trocar para B descarta a tentativa de A.
- Interrompa a rede ao gravar. A interface deve preservar a tentativa e não afirmar sucesso. Reconecte a mesma conta e repita: o UUID da operação permanece estável. Reler pede confirmação para descartar a tentativa local.
- Abra duas abas, carregue ambas, grave na primeira e tente gravar na segunda: deve bloquear divergência detectada. Escolha reler para descartar a tentativa e trazer o documento remoto.
- Inspecione URLs, console, Local Storage, Session Storage e IndexedDB: nenhum token nem dado privado persistido pelo hub. O token existe apenas em memória e no cabeçalho Authorization das requisições HTTPS ao Google. Não copie tokens para evidências.

Use um dispositivo por vez: leitura seguida de escrita não é uma transação. Gravações simultâneas entre a conferência e o envio ainda podem se sobrepor. Não há fila offline durável; fechar a aba descarta tentativas. Desconectar limpa a sessão local e não revoga o consentimento no Google. Para revogar, use o link de gerenciamento.

Não edite manualmente ou compartilhe `my-hub.json` durante a homologação. Arquivo inválido, inacessível ou múltiplos candidatos bloqueiam a escrita, sem criar substitutos. Em produção, registre os resultados sem nomes, emails, tokens ou conteúdo privado em `docs/releases/0.2.2.md`. Testes automatizados não substituem consentimento real nem homologação explícita.
