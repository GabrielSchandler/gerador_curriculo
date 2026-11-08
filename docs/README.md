# Documentação do Currículo Vagas

## Objetivo

O Currículo Vagas é uma aplicação local para transformar oportunidades de emprego em materiais organizados para candidatura. Ela recebe vagas coletadas de fontes autorizadas, identifica aderência ao perfil mestre, gera uma versão direcionada do currículo e mantém o acompanhamento do processo seletivo.

O sistema é assistido por IA, mas não toma decisões irreversíveis: não envia currículo, não se candidata, não manda mensagens e não altera perfis externos sem revisão e autorização do usuário.

## Caminho local

```text
C:\Users\Gabriel\Desktop\PROJETOS\CurriculoVagas
```

## Mapa rápido

```text
CurriculoVagas/
├── data/
│   ├── profile.json             Perfil mestre e dados pessoais
│   ├── jobs.json                Vagas, análises, currículos e histórico
│   └── applications.json        Registros legados de candidaturas
├── public/
│   ├── index.html               Interface do painel
│   ├── app.js                   Renderização e chamadas da API
│   ├── styles.css               Estilos
│   └── generated/curriculos/    DOCX gerados por vaga
├── server.mjs                   API HTTP e servidor local
├── generate_docx.py             Gerador dos DOCX
├── export.py                    Exportação do fluxo individual
├── web-search.mjs               Importador de lotes JSON
├── WEB-JOBS.md                  Contrato de coleta/importação
├── AGENTS.md                    Regras para agentes de código
└── docs/                        Esta documentação operacional
```

## Fluxo completo

```text
Fonte pública autorizada
        ↓
Lote JSON com descrição e fonte
        ↓
POST /api/jobs/import
        ↓
Deduplicação + análise de aderência
        ↓
Ollama local ou fallback seguro
        ↓
Currículo direcionado em data/jobs.json
        ↓
DOCX em public/generated/curriculos/
        ↓
Revisão humana e acompanhamento de status
```

## Início rápido para outro agente

1. Leia `AGENTS.md`, este arquivo, `docs/AGENT-GUIDE.md` e `WEB-JOBS.md`.
2. Execute `npm start` na raiz.
3. Confirme `GET http://localhost:4173/api/health`.
4. Abra `http://localhost:4173`.
5. Antes de importar, consulte `GET http://localhost:4173/api/jobs` para evitar repetir URLs já cadastradas.
6. Importe no máximo dez vagas por lote.
7. Verifique o total em `data/jobs.json` e a existência do DOCX correspondente.

## Limites importantes

- A aplicação é local e não substitui a revisão do candidato.
- Uma vaga pode deixar de estar disponível; sempre confira a fonte antes de candidatar-se.
- Salários e benefícios só devem ser registrados quando divulgados.
- O score é um sinal de triagem, não uma previsão de contratação.
- O conteúdo do currículo deve conter apenas fatos confirmados no perfil mestre.
