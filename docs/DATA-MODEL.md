# Modelo de dados

## Perfil mestre

Arquivo: `data/profile.json`.

Contém nome, contatos, formação, idiomas, competências, experiências e projetos autorizados. É a fonte de verdade para os currículos. Se uma informação não estiver confirmada ali, o agente deve pedir confirmação ou omiti-la.

## Vaga

Arquivo: `data/jobs.json`.

Campos relevantes:

- `id`: identificador local.
- `title`, `company`, `url`, `source`: identidade e rastreabilidade.
- `description`, `requirements`, `desiredRequirements`: conteúdo usado na análise e geração.
- `remote`, `location`, `regime`, `salary`, `benefits`, `schedule`, `language`: condições divulgadas.
- `analysis`: score, competências encontradas, lacunas e confirmação de remoto.
- `resume`: currículo direcionado em Markdown interno.
- `generation`: origem da geração, como `ollama-local` ou fallback.
- `status`: etapa atual da candidatura.
- `applicationUrl`, `notes`, `nextAction`, `history`: acompanhamento humano.
- `collectedAt`, `createdAt`, `updatedAt`: rastreabilidade temporal.

## Status permitidos

`Encontrada`, `Em análise`, `Materiais em preparação`, `Pronta para revisão`, `Candidatura enviada`, `Contato do recrutador`, `Entrevista`, `Teste`, `Proposta`, `Recusada`, `Encerrada`.

## DOCX

Cada vaga deve possuir um arquivo em `public/generated/curriculos/<id>.docx`. O ID é usado no link para evitar colisão de nomes. O conteúdo do DOCX é destinado à candidatura e não deve conter score, diagnóstico interno, observação “para revisão”, texto oculto ou instruções ao agente.
