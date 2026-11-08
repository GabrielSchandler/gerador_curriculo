# Agente do projeto Currículo Vagas

Este é um sistema local para busca assistida de vagas, análise de aderência, geração de currículos direcionados e acompanhamento de candidaturas. A documentação completa está em `docs/README.md`.

## Regra principal de separação

Este projeto não é o projeto de geração de imagens. Não altere o ComfyUI, workflows, checkpoints, InstantID, ControlNet ou LTX-Video a partir desta pasta. A geração de imagens fica separada em `C:\COMFYUI\ComfyUI_windows_portable` e possui sua própria documentação em `C:\Users\Gabriel\Desktop\PROJETOS\ComfyUI\README.md`, quando disponível.

Também não misture este contexto com o agente geral em `C:\Users\Gabriel\Desktop\PROJETOS\.local-agent`.

## Como operar

1. Leia `docs/README.md`, `docs/AGENT-GUIDE.md` e `WEB-JOBS.md` antes de alterar o projeto.
2. Confira se o servidor local está disponível em `http://localhost:4173`.
3. Para buscar vagas, use fontes públicas ou integrações autorizadas. Não contorne login, CAPTCHA, paywall, robots, bloqueios ou limites técnicos.
4. Priorize trabalho 100% remoto e registre separadamente CLT, PJ, salário, benefícios, requisitos e fonte. Nunca preencha informações desconhecidas por estimativa.
5. Envie lotes JSON para `POST http://localhost:4173/api/jobs/import` usando `node web-search.mjs import arquivo.json`. O endpoint aceita até dez vagas por lote; para mais vagas, use lotes separados.
6. Confira duplicidades, total importado, currículos gerados e links DOCX.
7. Gere ou atualize os DOCX com `python generate_docx.py` usando o Python empacotado documentado em `docs/AGENT-GUIDE.md`.
8. Não envie candidaturas, mensagens ou alterações em perfis sem aprovação explícita do usuário.

## Dados sensíveis e qualidade

- `data/profile.json` contém dados pessoais do usuário. Não publique, não envie para fontes externas e não copie para prompts além do necessário.
- `data/jobs.json` é o banco local das vagas, análises, currículos e histórico.
- `public/generated/curriculos/` contém os DOCX gerados; não apague documentos sem confirmação.
- Currículos devem usar apenas fatos confirmados. Não invente experiências, métricas, senioridade, salários ou conhecimentos.
- Não use texto oculto, palavras invisíveis ou keyword stuffing. Palavras-chave devem estar visíveis e contextualizadas.
