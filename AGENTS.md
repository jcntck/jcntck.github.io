# Regras do projeto

Estas regras se aplicam a todo planejamento, desenvolvimento, documentação e entrega deste repositório.

## Branches e revisão

- Trabalhar sempre na branch `dev`. Conferir a branch antes de editar; se estiver em `main`, mudar para `dev` preservando alterações locais. Se `dev` ainda não existir, criá-la sem descartar trabalho existente.
- Entregar alterações por pull request de `dev` para `main`. Não desenvolver, criar commits ou fazer push direto em `main`, nem contornar sua proteção.
- Ao concluir o plano inicial de implementação e as verificações locais, abrir imediatamente o PR `dev` → `main` e liberar a versão para teste do usuário, apresentando as instruções de execução. Não esperar os comentários de teste para abrir o PR.
- A partir dessa entrega para teste com PR aberto, toda alteração solicitada pelo usuário nesse ciclo é um patch fix: incrementar a versão patch em `package.json`, lockfile e versão alvo da change antes de enviar os novos commits ao mesmo PR. Essa autorização é permanente e não exige nova confirmação de versão. Aguardar a avaliação e corrigir os problemas em `dev`.
- Nas entregas futuras, o merge pelo GitHub é feito exclusivamente pelo usuário. Não realizar merge, auto-merge ou bypass em seu lugar; CI verde significa pronto para sua revisão, não autorização para integrar.
- Exceção restrita à primeira entrega: o usuário autorizou o agente a integrar o PR #1, publicar `v0.1.0` e republicar a mesma tag para testar recuperação. Essa autorização não se aplica a outros PRs ou versões.
- O repositório é `jcntck/jcntck.github.io`; o Pages é publicado por GitHub Actions na raiz de `https://jcntck.github.io/`, com base `/`.

## Versão obrigatória por change

- Cada change OpenSpec deve declarar uma versão alvo SemVer explícita em `proposal.md`, na seção `## Version` (por exemplo, `0.1.0`).
- Solicitar ao usuário a versão de cada change quando ela não tiver sido informada, antes de concluir seu planejamento ou iniciar sua implementação. Não escolher incrementos ou preencher versões provisórias silenciosamente. Se a versão já foi informada pelo usuário, usá-la sem pedir confirmação novamente.
- Após o PR ser aberto, cada correção apontada pelo usuário incrementa a versão patch atual (por exemplo, `0.2.0` → `0.2.1` → `0.2.2`). Essa regra é uma autorização permanente para o incremento patch dessas correções; não pedir novamente uma versão para cada fix.
- Em cada fix, alinhar `package.json`, os campos de versão do lockfile e a versão alvo da change entregue antes de enviar os novos commits ao mesmo PR; manter evidências e referências de entrega coerentes. Só gerar a tag da versão final quando o usuário fizer o merge.
- A versão inicial de uma nova change continua exigindo definição do usuário quando não tiver sido fornecida. Não confundir os fixes de revisão com uma nova change.
- Changes existentes sem versão precisam dessa definição antes de serem consideradas prontas para implementar. Se o usuário preferir definir depois, registrar a pendência; não inventar uma versão.
- A versão da aplicação fica em `package.json`. Na implementação da entrega, atualizar essa versão e os campos de versão correspondentes do lockfile em `dev`, no mesmo PR do trabalho entregue.
- Se o projeto ainda não tiver `package.json`, criá-lo com a versão aprovada durante a inicialização da aplicação; não criar um manifesto incompleto apenas para cumprir uma alteração de planejamento.
- Conferir coerência entre versão alvo da change entregue, `package.json`, lockfile, identificação pública e tag `v<versão>` antes de publicar. Comparar apenas as changes incluídas na entrega atual; propostas futuras podem ter outras versões.
- Versões aprovadas para as etapas atuais: `add-modular-shell` → `0.1.0`; `add-cloud-library` → `0.2.0` (entrega final homologada `0.2.2`); `add-google-sign-in` → `0.3.0`; `add-manga-reading-tracker` → `0.4.0` (patch atual `0.4.5`), conforme revisão do usuário. Não agrupar changes de versões diferentes numa mesma entrega sem decisão explícita do usuário.

## CI/CD

- Workflow de desenvolvimento: executar ao abrir, atualizar ou reabrir PR para `main`; verificar origem `dev`, instalação pelo lockfile, lint, tipos, testes, build e coerência da versão da entrega. Não publicar neste workflow.
- Configurar os checks de CI como obrigatórios para merge em `main`.
- Workflow de produção: executar no `push` em `main` resultante do merge; validar o commit final, gerar o artefato, criar automaticamente a tag a partir da versão de `package.json`, publicar esse artefato no Pages e verificar o site real.
- Criar tag e publicar no mesmo workflow de produção, sem depender de uma tag criada pelo `GITHUB_TOKEN` para disparar outro workflow.
- O workflow de produção não aumenta a versão nem cria commits na branch protegida. Tag já existente só pode ser reutilizada quando apontar para o mesmo commit; nunca mover ou sobrescrever tag para acomodar uma entrega.
- Manter permissões restritas aos jobs que precisam delas e impedir publicações concorrentes fora de ordem. Checks reprovados impedem a publicação.
- Permitir reexecução e recuperação de versão identificada sem alterar a origem da release. Publicação automática não substitui homologação pelo usuário.

## Etapas e custo

- Seguir a ordem: `add-modular-shell`, `add-cloud-library`, `add-google-sign-in`, `add-manga-reading-tracker`.
- Iniciar a etapa seguinte somente após publicação, testes em produção e homologação explícita do usuário da etapa anterior.
- Registrar versão, URL, commit, execução, resultados e homologação da entrega sem incluir credenciais ou dados privados.
- O projeto é pessoal e não deve exigir serviços pagos de infraestrutura, banco ou domínio.

- BaaS é autorizado quando limitado ao plano gratuito e suas cotas, sem migração automática para plano pago. Para login, foi aprovado Firebase Auth no Spark; não ativar cobrança.
