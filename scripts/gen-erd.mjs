// Generates docs/erd.md (Mermaid erDiagram) from packages/db/prisma/schema.prisma.  Run: node scripts/gen-erd.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(new URL('../packages/db/prisma/schema.prisma', import.meta.url), 'utf8');
const models = [...src.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map(([, name, body]) => ({ name, lines: body.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//') && !l.startsWith('@@')) }));
const names = new Set(models.map((m) => m.name));
const enums = new Set([...src.matchAll(/^enum (\w+)/gm)].map((m) => m[1]));
const out = ['# Shekor — entity relationship diagram', '', `Generated from \`packages/db/prisma/schema.prisma\` (${models.length} models). Regenerate with \`node scripts/gen-erd.mjs\`.`, '', '```mermaid', 'erDiagram'];
const rels = [];
for (const m of models) {
  out.push(`  ${m.name} {`);
  for (const l of m.lines) {
    const [field, typeRaw] = l.split(/\s+/);
    if (!typeRaw) continue;
    const base = typeRaw.replace(/[?[\]]/g, '');
    if (names.has(base)) {
      const fk = l.match(/fields: \[(\w+)/);
      if (fk) rels.push(`  ${base} ||--o{ ${m.name} : "${field}"`);
      continue;
    }
    const type = enums.has(base) ? 'enum' : base;
    const key = l.includes('@id') ? ' PK' : l.includes('@unique') ? ' UK' : /Id$/.test(field) && type === 'Int' ? ' FK' : '';
    out.push(`    ${type} ${field}${key}`);
  }
  out.push('  }');
}
out.push(...[...new Set(rels)], '```', '');
writeFileSync(new URL('../docs/erd.md', import.meta.url), out.join('\n'));
console.log(`docs/erd.md: ${models.length} models, ${new Set(rels).size} relations`);
