# Design

## Context

O checkout contém apenas planejamento OpenSpec, sem aplicação ou workflows implementados. O usuário criou `jcntck/jcntck.github.io`, protegeu `main` para receber PRs e configurou o Pages para Actions; essas configurações serão verificadas na implementação. Ver motivação e sequência em `proposal.md`. Esta é a única etapa liberada para implementação inicialmente; Google e mangás não são pré-condições do shell.

## Goals / Non-Goals

**Goals:** Entregar uma base pequena, publicável e rastreável; exercitar testes e hospedagem reais antes de integrar outros sistemas.

**Non-Goals:** Criar contrato de biblioteca, autenticação, chamadas ao Drive, formulários de negócio, tema definitivo, microfrontends ou um framework de plugins.

## Decisions

### Estrutura mínima em repositório único

Usar React, TypeScript e Vite com npm e lockfile. `src/app` compõe página inicial, navegação e ponto de registro de módulos; `src/shared/ui` recebe apenas componentes já reutilizados. Não criar estruturas vazias para antecipar toda a aplicação. Um registro simples de entradas de navegação permite adicionar conexão e mangás nas próximas etapas. Usar “My Hub” provisoriamente, sem renomear o repositório.

Alternativas: aplicações por repositório continuam possíveis no Pages, mas adicionam publicação independente desnecessária aqui. Um monorepo de pacotes ou microfrontends seria excessivo. Uma página inicial simples basta para homologar a base.

### Rotas, aparência e versão

Adotar React Router com rotas por hash, iniciando em `#/`. O repositório é o site principal da conta, publicado em `https://jcntck.github.io/`; configurar a base do Vite como `/`. Rotas desconhecidas oferecem retorno ao início. Testes de navegação usam um módulo fictício somente como fixture, sem acrescentar funcionalidade de produção.

A aparência inicial é neutra, legível em celular e computador e operável por teclado. Não escolher agora a identidade visual do módulo de negócio. Ler `0.1.0` de `package.json` e expor essa versão e SHA do commit pelo build como dados públicos; builds locais mostram um identificador de desenvolvimento. Uma versão ou um SHA visível não substitui o registro da execução de entrega.

### Desenvolvimento e versão aprovados antes do merge

Todo trabalho acontece em `dev`, inclusive ajustes de documentação e planejamento. A entrega ocorre por PR de `dev` para `main`, sem commits ou push direto na branch protegida. A versão alvo desta change é `0.1.0`. Na inicialização, criar `package.json` e lockfile com essa versão; atualizações futuras também acontecem em `dev` no PR correspondente.

O workflow não escolhe incrementos automaticamente. Cada change declara sua versão em `proposal.md`; perguntar ao usuário se faltar. Verificar coerência com as changes incluídas na entrega, não com todas as propostas futuras. Não misturar versões diferentes no mesmo PR de entrega sem decisão do usuário.

### Workflow dev: validar o PR

Executar em `pull_request` para `main`, nas atividades de abertura, atualização e reabertura. Conferir origem `dev`, executar `npm ci`, lint, tipos, testes de navegação, build e validação da versão aprovada e dos campos correspondentes no lockfile. Configurar esses checks como obrigatórios na proteção da `main`. O workflow dev não publica, cria tags ou usa permissões de escrita.

Escolher runtime Node suportado pelas dependências na implementação e registrá-lo; fixar dependências e actions. Uma atualização do PR dispara novas verificações. Uma falha mantém o merge bloqueado enquanto os checks obrigatórios não forem aprovados.

### Workflow prod: commit integrado, tag automática e publicação

Executar em `push` para `main`, decorrente do merge do PR sob a proteção definida. Revalidar o commit final e gerar seu artefato: não reutilizar automaticamente um build do commit de teste do PR como se fosse o commit integrado. A sequência é validação/build, tag, deploy e verificação do site real.

Ler a versão de `package.json`, conferir o lockfile e o plano da entrega e criar a tag `v<versão>` apontando exatamente para o commit validado. A primeira será `v0.1.0`. Produção não altera a versão, não cria commits de incremento na `main` e não contorna a proteção. Tag existente no mesmo SHA é uma reexecução válida; no SHA diferente, falhar antes de publicar sem mover ou sobrescrever a tag.

Criar tag e fazer deploy no mesmo workflow. O `GITHUB_TOKEN` não dispara normalmente outro workflow por uma tag que ele próprio criou, portanto a tag não é o gatilho de produção. Conceder `contents: write` apenas ao job que cria a tag. Empacotar `dist` no formato `artifact.tar` exigido pelo Pages e enviar como artefato `github-pages` com a action oficial de upload já autorizada, evitando a versão transitiva adicional do helper composto. Usar actions oficiais do Pages, ambiente `github-pages`, `pages: write` e `id-token: write` apenas no job de deploy, dependente do build validado e da confirmação da tag. Verificar as permissões e refs do ambiente para publicações provenientes de `main`.

Controlar concorrência para impedir que entregas se sobreponham ou uma execução obsoleta substitua uma mais recente. Se houver falha depois de criar a tag, reexecutar a mesma entrega sem incrementar versão nem trocar seu commit. A existência da tag não comprova sucesso do deploy. Uma entrada manual pode republicar um commit de release conhecido para recuperação, sem criar uma nova release ou alterar código de origem.

Alternativa: gatilho por tag e incremento feito por bot foram descartados porque a regra escolhida é merge como início da entrega e versionamento definido em `dev`. Manter somente dois workflows principais torna esse fluxo explícito e evita automação que escreva na branch protegida.

### Verificação em produção e recuperação

Após o deploy, usar a URL retornada pelo Pages e aguardar disponibilidade com tentativas limitadas. Verificar em navegador a página inicial, recursos, rota direta e versão/commit esperados. HTTP 200 sozinho não comprova que o JavaScript carregou. Se falhar, marcar o resultado como falha e não considerar a versão validada.

Registrar em `docs/releases/0.1.0.md` o endereço, commit, tag, link da execução, resultados, data e situação de homologação. Não registrar tokens ou dados pessoais. Na primeira entrega ainda não há uma versão anterior para rollback: testar republicação do mesmo commit e registrar a limitação. Nas seguintes, republicar um commit de release anterior conhecido, com os mesmos checks e nova verificação de produção; não mover uma tag existente.

## Risks / Trade-offs

- [Base incorreta quebra recursos no Pages] → Usar `/` para o site principal e testar preview e endereço real após o deploy.
- [Job publica código diferente do verificado] → Executar checks, gerar artefato e publicar o mesmo commit rastreado.
- [Versão já publicada é reutilizada para outro commit] → Conferir tag e SHA, falhar sem sobrescrever e definir uma nova versão em `dev`.
- [Regras do ambiente impedem o deploy] → Conferir ambiente `github-pages`, origem `main` e permissões durante a primeira entrega.
- [Site público recebe dados privados por acidente] → Manter o pacote limitado ao shell e inspecionar artefatos; não criar credenciais nesta etapa.
- [Mudanças de plano ou cotas] → Usar repositório público e endereço padrão no plano gratuito e conferir condições ao configurar.

## Delivery and Homologation

Implementar em `dev` com pacote e lockfile em `0.1.0`; abrir PR para `main`; executar os checks reais; após o merge, confirmar criação automática da tag e deploy pelo workflow prod; verificar produção e republicação; apresentar evidências ao usuário. Somente uma manifestação explícita do usuário homologa a etapa, registrada no documento de release. A proposta aprovada não é homologação de software ainda não entregue.

Depois da homologação, `add-cloud-library` pode começar. Essa dependência é uma regra do planejamento e precisa ser conferida ao aplicar a próxima proposta; o OpenSpec não a impõe automaticamente. Este trabalho cria apenas os documentos; execução do pipeline e publicação pertencem à aplicação desta mudança.

## References

- [Workflows oficiais do Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
- [Publicação estática com Vite](https://vite.dev/guide/static-deploy.html).
- [Eventos do GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
- [Acionamento de workflows e GITHUB_TOKEN](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
