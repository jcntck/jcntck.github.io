# Regras do projeto

Estas regras se aplicam a todo planejamento, desenvolvimento, documentação e entrega deste repositório.

## Branches e revisão

- Trabalhar sempre na branch `dev`. Conferir a branch antes de editar; se estiver em `main`, mudar para `dev` preservando alterações locais. Se `dev` ainda não existir, criá-la sem descartar trabalho existente.
- Entregar alterações por pull request de `dev` para `main`. Não desenvolver, criar commits ou fazer push direto em `main`, nem contornar sua proteção.
- O repositório é `jcntck/jcntck.github.io`; o Pages é publicado por GitHub Actions na raiz de `https://jcntck.github.io/`, com base `/`.

## Versão obrigatória por change

- Cada change OpenSpec deve declarar uma versão alvo SemVer explícita em `proposal.md`, na seção `## Version` (por exemplo, `0.1.0`).
- Solicitar ao usuário a versão de cada change quando ela não tiver sido informada, antes de concluir seu planejamento ou iniciar sua implementação. Não escolher incrementos ou preencher versões provisórias silenciosamente. Se a versão já foi informada pelo usuário, usá-la sem pedir confirmação novamente.
- Changes existentes sem versão precisam dessa definição antes de serem consideradas prontas para implementar. Se o usuário preferir definir depois, registrar a pendência; não inventar uma versão.
- A versão da aplicação fica em `package.json`. Na implementação da entrega, atualizar essa versão e os campos de versão correspondentes do lockfile em `dev`, no mesmo PR do trabalho entregue.
- Se o projeto ainda não tiver `package.json`, criá-lo com a versão aprovada durante a inicialização da aplicação; não criar um manifesto incompleto apenas para cumprir uma alteração de planejamento.
- Conferir coerência entre versão alvo da change entregue, `package.json`, lockfile, identificação pública e tag `v<versão>` antes de publicar. Comparar apenas as changes incluídas na entrega atual; propostas futuras podem ter outras versões.
- Versões aprovadas para as etapas atuais: `add-modular-shell` → `0.1.0`; `add-cloud-library` → `0.2.0`; `add-manga-reading-tracker` → `1.0.0`, concluindo o MVP. Não agrupar changes de versões diferentes numa mesma entrega sem decisão explícita do usuário.

## CI/CD

- Workflow de desenvolvimento: executar ao abrir, atualizar ou reabrir PR para `main`; verificar origem `dev`, instalação pelo lockfile, lint, tipos, testes, build e coerência da versão da entrega. Não publicar neste workflow.
- Configurar os checks de CI como obrigatórios para merge em `main`.
- Workflow de produção: executar no `push` em `main` resultante do merge; validar o commit final, gerar o artefato, criar automaticamente a tag a partir da versão de `package.json`, publicar esse artefato no Pages e verificar o site real.
- Criar tag e publicar no mesmo workflow de produção, sem depender de uma tag criada pelo `GITHUB_TOKEN` para disparar outro workflow.
- O workflow de produção não aumenta a versão nem cria commits na branch protegida. Tag já existente só pode ser reutilizada quando apontar para o mesmo commit; nunca mover ou sobrescrever tag para acomodar uma entrega.
- Manter permissões restritas aos jobs que precisam delas e impedir publicações concorrentes fora de ordem. Checks reprovados impedem a publicação.
- Permitir reexecução e recuperação de versão identificada sem alterar a origem da release. Publicação automática não substitui homologação pelo usuário.

## Etapas e custo

- Seguir a ordem: `add-modular-shell`, `add-cloud-library`, `add-manga-reading-tracker`.
- Iniciar a etapa seguinte somente após publicação, testes em produção e homologação explícita do usuário da etapa anterior.
- Registrar versão, URL, commit, execução, resultados e homologação da entrega sem incluir credenciais ou dados privados.
- O projeto é pessoal e não deve exigir serviços pagos de infraestrutura, banco ou domínio.
