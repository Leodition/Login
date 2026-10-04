# Central de acessos Leodition

Site estático publicado pelo GitHub Pages em https://login.leodition.com.br/.

Integra os acessos já existentes do acervo e da reprografia. A API, os usuários, as permissões e as senhas permanecem no repositório privado `Leodition/acervo-leoalfa`, no serviço ativo `https://acervo-leoalfa.onrender.com`.

- `index.html`: formulário, sistemas permitidos e contatos.
- `app.mjs`: autenticação, escolha do sistema, troca de conta e redefinição obrigatória.
- `admin.mjs` e `admin.css`: painel AdmLeodition, sites e acessos, configurações iniciais e visualização de contas pelo fluxo de senha mestra já existente.
- `style.css`: tema escuro responsivo.
- `CNAME`: domínio existente.
- `.nojekyll`: publica os arquivos diretamente, sem transformar módulos e HTML.

Nenhuma senha, chave privada ou credencial de banco deve ser incluída neste repositório. Tokens de sessão ficam no navegador autenticado. A entrada entre domínios usa código de uso único (90 segundos), estado e PKCE; a URL não contém senha nem token de sessão.

Os logins individuais continuam disponíveis. Biblioteca, relatórios, comunidade e reprografia recebem destinos determinados pela API; administradores escolhem o sistema. A central respeita redefinição obrigatória e acesso administrativo por senha mestra.

Os testes de API e navegador estão em `Leodition/acervo-leoalfa`: `tests/central-access.cjs` e `tests/central-login-ui.cjs`. A documentação de integração está em `docs/central-login.md` nesse repositório.
