# Painel Padap

Painel web para acompanhar os projetos/sistemas hospedados no Railway: nome, versão, data de criação, status (Online / Em testes / Em desenvolvimento / Pausado) e link publicado. Permite cadastrar e excluir (com confirmação) projetos, organizados em cards.

Login simples (usuário + senha) para restringir o acesso — conforme combinado, é uma proteção leve, não crítica.

## Stack

- Node.js + Express (servidor e API)
- Sessão em cookie (`express-session`) para o login
- Armazenamento dos projetos em `data/projects.json` (arquivo local, sem banco de dados)
- Front-end em HTML/CSS/JS puro (sem build step)

## Rodando localmente

```bash
npm install
cp .env.example .env   # opcional, os valores padrão já funcionam
npm start
```

Acesse `http://localhost:3000`. Credenciais padrão:

- **Usuário:** ti@padapagronegocios.com.br
- **Senha:** Padap@123

## Deploy no Railway

1. Suba este projeto para um repositório no GitHub (ou use `railway up` com o Railway CLI direto desta pasta).
2. No Railway, crie um novo projeto a partir do repositório (ou da pasta local).
3. O Railway detecta o Node.js automaticamente pelo `package.json` e usa `npm start` (também há um `Procfile` de reforço).
4. Em **Variables**, defina (opcional, mas recomendado para trocar a senha padrão):
   - `PAINEL_USER`
   - `PAINEL_PASS`
   - `SESSION_SECRET` (qualquer string aleatória)
5. O Railway define `PORT` automaticamente — o servidor já lê essa variável.
6. Gere o domínio público em **Settings → Networking → Generate Domain**.

### ⚠️ Sobre a persistência dos dados

Os projetos cadastrados ficam salvos em `data/projects.json`, dentro do próprio contêiner. Isso funciona bem para uso simples, mas **o sistema de arquivos do Railway não é permanente**: a cada novo deploy (novo build), esse arquivo volta ao estado original do repositório e os cards cadastrados depois do último deploy podem ser perdidos.

Duas formas de resolver, se isso for um problema no seu uso:

1. **Railway Volume** (mais simples): crie um *Volume* no serviço e monte-o na pasta `data/`. Assim o arquivo `projects.json` persiste entre deploys.
2. **Banco de dados** (mais robusto): trocar o arquivo JSON por um banco (ex: PostgreSQL, que o Railway oferece como plugin). Posso te ajudar a migrar para isso quando quiser.

Enquanto o painel for usado sem redeploys frequentes, o arquivo local já resolve.

## Estrutura do projeto

```
painel-padap/
├── server.js              # servidor Express, autenticação e API
├── data/
│   └── projects.json      # "banco de dados" simples dos projetos
├── public/
│   ├── login.html
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── login.js
│       └── app.js
├── package.json
├── Procfile
└── .env.example
```

## API

Todas as rotas abaixo (exceto login) exigem sessão autenticada.

| Método | Rota                 | Descrição                          |
|--------|-----------------------|-------------------------------------|
| POST   | `/api/login`           | Autentica e cria a sessão           |
| POST   | `/api/logout`          | Encerra a sessão                    |
| GET    | `/api/projects`        | Lista todos os projetos             |
| POST   | `/api/projects`        | Cadastra um novo projeto            |
| DELETE | `/api/projects/:id`    | Remove um projeto                   |
