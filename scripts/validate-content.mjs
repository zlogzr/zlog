#!/usr/bin/env node
// Standalone CLI for the content validator (`npm run validate`). The same checks
// also run automatically on every build via the Astro integration.
import { validateContent } from '../src/lib/validate-content.mjs';

const { errors, warnings, count } = validateContent();

for (const w of warnings) console.warn(`⚠️  ${w}`);
for (const e of errors) console.error(`❌  ${e}`);

if (errors.length) {
  console.error(`\n内容校验失败：${errors.length} 个错误，${warnings.length} 个警告（共 ${count} 条内容）`);
  process.exit(1);
}
console.log(`✓ 内容校验通过：${count} 条内容，${warnings.length} 个警告`);
