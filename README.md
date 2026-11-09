# My Hub

Aplicação pessoal com módulos internos. A versão `0.4.2` acrescenta a biblioteca de mangás: título, último capítulo, data da leitura e tempo decorrido, com login Google e sincronização Drive compartilhados.

Para ativar o login, siga [a configuração Firebase](docs/firebase-setup.md). Para a conexão Drive, siga [a configuração Google Drive](docs/google-drive-setup.md). Consulte também [o contrato compartilhado](docs/storage-contract.md) e [as evidências da entrega 0.4.2](docs/releases/0.4.2.md).

## Desenvolvimento local

Usar Node.js 22, atualizado no último patch disponível, e npm. O projeto exige pelo menos Node 22.15; `.nvmrc` seleciona a linha 22.

```sh
nvm use
npm ci
npm run dev
```

O servidor informa o endereço local. Para conferir o pacote de produção:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

O build gera `dist/`, inclusive `version.json`, e usa a raiz `/` por padrão. `APP_BASE_PATH=/outro-caminho/ npm run build` permite usar o mesmo shell sob outro caminho de hospedagem estática. Para testar esse pacote localmente, iniciar também o preview com a mesma variável: `APP_BASE_PATH=/outro-caminho/ npm run preview`. A versão vem de `package.json` e o commit do checkout; em desenvolvimento o rodapé indica “desenvolvimento”.

Para testes reais em navegador:

```sh
npx playwright install chromium
npm run test:browser
```

O Playwright inicia e encerra seu servidor de preview e verifica desktop e celular emulado. Em Linux sem bibliotecas do navegador, usar `npx playwright install --with-deps chromium`. Os relatórios e screenshots ficam em diretórios ignorados pelo Git. Esses testes não substituem a homologação do usuário em um aparelho físico.

## Branches e versões

Toda alteração é feita em `dev` e entregue por PR de `dev` para `main`. Após abrir o PR, o usuário executa a versão localmente e relata os ajustes. Cada fix apontado nessa revisão incrementa a patch version, com pacote, lockfile e versão alvo da change sincronizados no mesmo PR. Nas entregas futuras, o usuário faz o merge pelo GitHub depois de concluir sua avaliação; o agente não integra automaticamente. A autorização para o agente integrar e publicar o PR #1 é uma exceção somente desta primeira entrega. Consultar [AGENTS.md](AGENTS.md) para as regras permanentes. Não fazer push direto em `main`.

Cada change precisa de versão alvo aprovada em `proposal.md`, na seção `## Version`. Na implementação, atualizar `package.json` e os campos de versão do lockfile em `dev`. O arquivo `.release.json` seleciona as changes incluídas na entrega atual; propostas de versões futuras não entram nessa comparação.

```sh
npm run check:release
```

Ao arquivar uma change ainda selecionada na release, registrar seu diretório em `.release.json`, no mapa opcional `archivedChanges` (nome da change → diretório `YYYY-MM-DD-nome` dentro do arquivo OpenSpec). A leitura usa essa referência explícita, sem escolher automaticamente uma proposta histórica.

A validação recusa versão ausente, seleção inválida e divergência entre pacote, lockfile e changes selecionadas. A entrega atual seleciona apenas `add-manga-reading-tracker`, em `0.4.2`, conforme a versão aprovada pelo usuário. As bases homologadas são shell `0.1.0`, Drive `0.2.2` e login `0.3.1`.

## Biblioteca de mangás

Entre com Google e abra **Mangás** (`/#/mangas`). Use a página **Conexão** para conectar o Drive da mesma conta e volte a Mangás. O módulo mostra um alerta com esse acesso quando o Drive estiver desconectado, expirado ou em falha. Em **Cadastrar mangá**, preencha título, último capítulo (inclusive `12.5` ou `Extra 1`) e o dia em que leu; leituras retroativas são aceitas. **Salvar leitura** fecha o formulário, destaca a obra e deixa a alteração pendente na aba. Campos inválidos mantêm o formulário aberto. O feedback informa o salvamento na aba; o foco segue para a obra, inclusive após uma busca. Clique em **Sincronizar** e aguarde **Confirmado no Drive**, após concluir suas edições. Cadastros e correções não disparam envio automático, mesmo se ele estiver ligado em Conexão.

**Link da scan** aceita HTTP/HTTPS e o **Nome da scan** identifica sua origem na lista. Ambos são opcionais; quando não há nome, o domínio do site identifica o link. A aplicação apenas oferece a abertura em nova aba, sem consultar disponibilidade. Remover o endereço remove também o nome associado. Animações discretas acompanham abertura do formulário, salvamento e botões, e são desativadas quando o navegador pede movimento reduzido.

Use **Buscar mangá** para filtrar o título sem distinguir caixa/acentos e **Ordenar por** para nome A–Z/Z–A ou leitura mais antiga/recente. Essas ações são locais e não consomem chamadas Drive.

**Corrigir leitura** mantém a identificação e a data até você alterá-la. A lista mostra a data absoluta e o tempo em dias, meses ou anos completos. Seis meses ou um ano são referências pessoais; não há prazo de retorno nem informação sobre capítulos novos.

Após refresh, o login pode continuar ativo por até 30 dias, mas é preciso reconectar o Drive. Pendências e formulário são voláteis: sincronize antes de sair ou recarregar. Em erro, preserve a aba e reconecte para repetir; em divergência, confira o arquivo e use **Reler do Drive** somente se quiser descartar pendências. Trabalhe em um dispositivo por vez. Não é necessária nova configuração de Firebase ou OAuth para este módulo.

## Acrescentar um módulo

`src/app/App.tsx` recebe uma lista de `HubModule`, definida em `src/app/navigation.ts`. Cada entrada tem `id`, `label`, `path`, `element` e política opcional `access: public | signed-in` (pessoal por padrão). Menu e rota usam a mesma política; consumidores usam `useHub()` para compartilhar identidade, Drive e sincronização. A composição acontece no ponto de entrada `src/main.tsx`, preservando a página inicial e a navegação compartilhada. Colocar a funcionalidade em `src/modules/<nome>` quando ela existir; não criar placeholders de funcionalidades ainda não implementadas.

As rotas usam fragmentos (`/#/`), portanto acesso direto e atualização não exigem reescrita no Pages. Rotas desconhecidas oferecem uma ação para voltar ao início. Um módulo fictício existe apenas nos testes para comprovar a extensão da navegação.

## CI/CD e publicação

- **Dev**: PR aberto, atualizado ou reaberto para `main`; o check `Dev checks` confere origem `dev` do mesmo repositório, instalação, lint, tipos, testes, versão e build, além de testes em navegador. Não publica e só recebe leitura.
- **Prod**: após merge, `push` em `main` executa validação do commit final, gera o pacote, cria `v<versão>` e publica esse mesmo artefato no Pages. Depois verifica o site real em desktop e celular emulado.
- O job que cria tags recebe escrita de conteúdo; apenas o job de deploy recebe escrita no Pages e token de identidade. Produção não altera o manifesto nem cria commits na branch protegida.
- Uma tag existente no mesmo commit permite reexecução. Tag apontando para outro commit causa falha sem substituição. O workflow recusa entregas automáticas obsoletas quando `main` já avançou.

Configuração necessária no GitHub:

1. Em **Settings → Pages**, selecionar **GitHub Actions** como origem. O endereço é `https://jcntck.github.io/`.
2. Ativar a proteção de `main` exigindo PR e o check **Dev checks**, sem bypass da automação.
3. No ruleset, não usar **Restrict updates** sem uma configuração de atores apropriada: a restrição bloqueia também merges e não substitui **Require a pull request before merging**. Para o fluxo deste projeto, usar PR e checks obrigatórios.
4. No ambiente **github-pages**, permitir publicação a partir de `main`. A publicação usa o `GITHUB_TOKEN` temporário, não um PAT armazenado no código.

Os workflows estão em `.github/workflows/dev.yml` e `prod.yml`, com actions oficiais fixadas por SHA. O pacote Pages é um `artifact.tar` com os arquivos de `dist/`, enviado como artefato `github-pages` pela action de upload já autorizada; isso evita que um helper composto exija outra versão transitiva fora da lista de permissões. O deploy e a criação da tag fazem parte do mesmo workflow: a tag criada pelo `GITHUB_TOKEN` não é usada para disparar uma terceira execução.

### Verificação e evidências

O workflow Prod compara `/version.json`, a versão exibida, o commit e a navegação real no site. Ele aguarda propagação do Pages por um período limitado e falha se a versão ou os recursos não corresponderem. Um HTTP 200 isolado não comprova a entrega.

O resumo da execução e o artefato **release-evidence** registram versão, tag, SHA, URL, link da execução e resultados; os relatórios de navegador ficam anexados. A tag identifica a origem, mas não comprova sucesso do deploy. Consultar [a entrega 0.1.0](docs/releases/0.1.0.md) para o acompanhamento desta etapa.

### Reexecução e recuperação

Para repetir uma entrega que falhou depois de criar a tag, reexecutar o workflow Prod correspondente. Para republicar uma versão conhecida, abrir **Actions → Prod → Run workflow**, manter a branch `main` e informar uma tag existente, como `v0.1.0`. O workflow resolve exatamente essa tag, confere a versão do pacote e a ancestralidade em `main`, executa os checks e publica novamente sem mover a tag.

Na primeira entrega não existe uma versão anterior para rollback; o exercício possível é republicar o próprio `v0.1.0`. A partir da seguinte, uma tag anterior pode ser republicada. A recuperação é explícita e não cria uma versão nova. Após a recuperação, verificar versão, commit e navegação no endereço real.

A homologação exige manifestação explícita do usuário. A integração Google só começa depois que a primeira versão estiver publicada, testada e homologada.

## Dependências e custo

A aplicação é estática, com repositório público e endereço padrão do Pages. Não exige banco, servidor ou domínio contratado; cotas e termos dos provedores continuam aplicáveis. Apenas configuração pública identifica Firebase e OAuth; credenciais de usuário e dados privados não entram no bundle. A sessão Firebase usa persistência gerenciada pelo SDK; tokens Drive permanecem em memória.

Dependências diretas são fixadas e o lockfile é versionado. O override de `minimatch` para `11.0.1` corrige o aviso de amplificação de glob das ferramentas de lint, sem adicionar dependência de execução ao site. Rever o override quando essas ferramentas incorporarem a correção em seus intervalos nativos. Firebase está fixado em `12.19.0`, com App/App Compat compatíveis com Node 22 e gRPC transitivo corrigido em `1.14.7`; somente App e Auth são importados no frontend. Não há serviço Firestore ativado pelo lockfile.
