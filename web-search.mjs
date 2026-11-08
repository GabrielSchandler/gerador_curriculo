import fs from 'node:fs/promises';
const file = process.argv[3];
if (process.argv[2] !== 'import' || !file) throw new Error('Uso: node web-search.mjs import arquivo.json');
const payload = JSON.parse(await fs.readFile(file, 'utf8'));
if (!Array.isArray(payload.jobs) || payload.jobs.length === 0) throw new Error('O arquivo precisa conter jobs com pelo menos uma vaga.');
const response = await fetch('http://localhost:4173/api/jobs/import', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ jobs:payload.jobs.slice(0, 10) }) });
const result = await response.json();
if (!response.ok) throw new Error(result.error || 'Falha ao importar vagas.');
console.log(JSON.stringify(result, null, 2));
