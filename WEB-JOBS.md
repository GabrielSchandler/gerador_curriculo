# Busca e importação de vagas

## Escopo

Este arquivo define o contrato para um agente autorizado coletar vagas na web e entregá-las ao projeto. A coleta é assistida por agente; o servidor local não faz crawling irrestrito sozinho.

## Formato do lote

Crie um JSON com no máximo dez itens por lote. Para buscar mais de dez, use arquivos e importações separadas, sempre conferindo duplicidades.

```json
{
  "jobs": [
    {
      "title": "Cargo divulgado",
      "company": "Empresa divulgada",
      "url": "https://exemplo.com/vaga",
      "source": "Nome da fonte",
      "publishedAt": "Data se estiver divulgada",
      "description": "Texto coletado ou colado da vaga",
      "remote": "Informação explicitamente divulgada",
      "location": "Localização ou restrição geográfica",
      "regime": "CLT, PJ ou outro, se divulgado",
      "salary": "Salário divulgado ou vazio",
      "commission": "Comissão ou variável, se divulgada",
      "benefits": "Benefícios divulgados",
      "schedule": "Jornada ou escala divulgada",
      "requirements": "Requisitos obrigatórios",
      "desiredRequirements": "Requisitos desejáveis",
      "language": "Idioma exigido, se houver",
      "applicationSteps": "Etapas da candidatura"
    }
  ]
}
```

Campos ausentes devem permanecer vazios ou ser omitidos. Não estime salário ou modalidade como se fossem informações divulgadas.

## Regras

- Usar somente páginas públicas, APIs oficiais, alertas ou fontes que permitam a coleta.
- Não contornar CAPTCHA, autenticação, bloqueios ou limites técnicos.
- Não candidatar, enviar mensagem ou alterar LinkedIn.
- Não inserir vagas inventadas ou duplicadas.
- O projeto aceita até dez vagas por lote e faz a análise de aderência localmente.
- O campo `remote` deve refletir o que a fonte divulgou; o analisador também considera `location` e `description` para confirmar a modalidade.
- Use data de coleta e URL da fonte para permitir auditoria posterior.

## Envio ao projeto

```powershell
node web-search.mjs import incoming-jobs.json
```

Depois da importação, confira o painel local. O currículo gerado é um rascunho para revisão.
