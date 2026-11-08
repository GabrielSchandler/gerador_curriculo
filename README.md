# Currículo Vagas — Gerador de currículos direcionados

Sistema local para organizar a busca de emprego remoto, gerar currículos direcionados para cada vaga e acompanhar as candidaturas.
A local-first tool to organize a remote job search, generate a tailored résumé for each job posting and track applications.

[🇧🇷 Português](#-português) · [🇺🇸 English](#-english)

---

## 🇧🇷 Português

Sistema local-first para organizar uma busca de emprego remoto, analisar a aderência entre uma vaga e o perfil mestre, gerar um currículo direcionado em DOCX e acompanhar o andamento de cada candidatura.

### Onde está o projeto

`C:\Users\Gabriel\Desktop\PROJETOS\CurriculoVagas`

Este diretório é independente do agente geral e independente do projeto de geração de imagens ComfyUI. A documentação operacional para outros agentes está em `docs/`.

### Iniciar o site

```powershell
copy data\profile.example.json data\profile.json   # na primeira vez: preencha com o seu perfil
npm start
```

Abra <http://localhost:4173>.

O projeto não envia candidaturas automaticamente. O usuário revisa o currículo, abre o link da vaga e altera o status manualmente.

### Funcionalidades

- Importação de lotes de vagas em JSON.
- Deduplicação por URL ou combinação empresa + título.
- Análise local de aderência, competências encontradas e confirmação de modalidade remota.
- Revisão opcional pelo Ollama `qwen2.5:7b-instruct`, com fallback seguro.
- Geração de currículo direcionado para cada vaga.
- Exportação de DOCX com layout profissional e compatível com ATS.
- Histórico de status: encontrada, análise, revisão, candidatura enviada, contato, entrevista, teste, proposta, recusada e encerrada.
- Registro de salário, benefícios, link, observações e próxima ação.

### Dados pessoais fora do GitHub

O `data/profile.json` (seu perfil, com dados pessoais), o `data/jobs.json` (banco local das vagas), os lotes importados (`incoming-*.json`) e os currículos gerados (`public/generated/`) estão no `.gitignore`. Eles ficam só no seu computador. O arquivo `data/profile.example.json` mostra o formato esperado.

### Documentação

- `docs/README.md`: visão geral e mapa do projeto.
- `docs/AGENT-GUIDE.md`: procedimentos reproduzíveis para outro agente.
- `docs/DATA-MODEL.md`: formato dos arquivos e cuidados com dados.
- `docs/PROJECT-BOUNDARIES.md`: separação formal entre vagas/currículos e geração de imagens.
- `WEB-JOBS.md`: contrato para coleta e importação de vagas.
- `AGENTS.md`: regras que devem ser lidas automaticamente por agentes de código.

### Modelos locais

O `qwen2.5:7b-instruct` é usado para redação e revisão de currículos quando o Ollama está disponível. O modelo coder é reservado ao agente geral de desenvolvimento. A geração de imagens não usa este projeto.

---

## 🇺🇸 English

A local-first system that organizes a remote job search. It scores how well each job matches a master profile, generates a tailored résumé as a DOCX file and tracks the status of every application.

The tool never applies on its own: the user reviews the résumé, opens the job link and updates the status manually.

### Features

- Import job batches as JSON (up to 10 per batch).
- Deduplication by URL, or by company + title.
- Local match analysis: skills found and confirmation that the job is really remote.
- Optional review by a local LLM (Ollama `qwen2.5:7b-instruct`), with a safe fallback.
- A tailored résumé for each job, exported as an ATS-friendly DOCX.
- Status history: found, analysis, review, applied, contact, interview, test, offer, rejected and closed.
- Tracking of salary, benefits, link, notes and next action.

### Tech stack

Node.js (HTTP server and API, no framework) · vanilla HTML/CSS/JS front end · Python (`generate_docx.py`) for DOCX generation · Ollama (optional)

### Running

```bash
cp data/profile.example.json data/profile.json   # then fill in your profile
npm start                                         # http://localhost:4173
```

### Personal data

`data/profile.json` (your personal profile), `data/jobs.json` (the local job database), the imported batches (`incoming-*.json`) and the generated résumés (`public/generated/`) are **kept out of Git** in `.gitignore`. They stay only on your computer. `data/profile.example.json` shows the expected format.

### Documentation

- `docs/README.md`: overview and project map.
- `docs/AGENT-GUIDE.md`: step-by-step procedures for coding agents.
- `docs/DATA-MODEL.md`: file formats and data-handling rules.
- `WEB-JOBS.md`: the contract for collecting and importing jobs.
