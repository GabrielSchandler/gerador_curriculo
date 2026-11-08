# Limites entre os projetos

## Projeto de vagas e currículos

Raiz:

```text
C:\Users\Gabriel\Desktop\PROJETOS\CurriculoVagas
```

Responsabilidades:

- coletar e importar vagas autorizadas;
- analisar aderência ao perfil;
- gerar e exportar currículos DOCX;
- acompanhar status e resultados de candidaturas;
- manter o perfil mestre e os dados de vagas.

## Projeto de geração de imagens

Raiz operacional do ComfyUI portátil:

```text
C:\COMFYUI\ComfyUI_windows_portable
```

Responsabilidades:

- ComfyUI e Manager;
- workflows de imagem;
- Juggernaut XL;
- InstantID, InsightFace e ControlNet;
- geração de imagens e, futuramente, LTX-Video.

## O que não fazer

- Não colocar checkpoints, workflows, imagens de referência ou nodes do ComfyUI dentro de `CurriculoVagas`.
- Não colocar `jobs.json`, `profile.json` ou DOCX de candidatura dentro do ComfyUI.
- Não usar o agente de currículos para instalar nodes ou modelos de imagem.
- Não usar o agente de imagens para consultar, editar ou enviar candidaturas.
- Não compartilhar o perfil pessoal do usuário com workflows de imagem sem autorização explícita.

## Referência para outro agente

Se a solicitação mencionar vagas, currículo, candidatura, ATS, Customer Success, suporte, operações ou DOCX, trabalhe em `CurriculoVagas`.

Se mencionar ComfyUI, InstantID, Juggernaut, ControlNet, workflow, checkpoint, imagem, rosto, pose ou vídeo local, trabalhe no projeto ComfyUI e leia a documentação dele antes de agir.
