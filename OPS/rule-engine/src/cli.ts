#!/usr/bin/env node
import { RuleEngine } from './engine.js';
import { builtInRules } from './rules/built-in.js';
import { RuleExecutionContext } from './types.js';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`300 OPS Rule Engine CLI

Usage:
  tsx src/cli.ts evaluate --rule <CODE> [options]
  tsx src/cli.ts list-rules

Options:
  --rule <CODE>          Rule code to evaluate (e.g., ILU-001)
  --room-area <N>        Room area in m²
  --room-function <F>    Room function (e.g., estar, suite)
  --room-orientation <O> Room orientation
  --level <L>            Level: essential | recommended | signature (default: recommended)
  --building-type <T>    Building type
  --help                 Show this help message
`);
}

function parseArgs(argv: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '').replace(/-/g, '_');
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = 'true';
      }
    }
  }
  return parsed;
}

async function main() {
  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const parsed = parseArgs(args);

  if (command === 'list-rules') {
    console.log('Built-in Rules:');
    console.log('');
    for (const rule of builtInRules) {
      console.log(`  ${rule.code} — ${rule.name} [${rule.category}]`);
    }
    process.exit(0);
  }

  if (command === 'evaluate') {
    const ruleCode = parsed['rule'];
    if (!ruleCode) {
      console.error('Error: --rule is required');
      process.exit(1);
    }

    const rule = builtInRules.find((r) => r.code === ruleCode);
    if (!rule) {
      console.error(`Error: Rule "${ruleCode}" not found`);
      process.exit(1);
    }

    const context: RuleExecutionContext = {
      room: {
        area_m2: Number(parsed['room_area'] ?? 0),
        function: parsed['room_function'] ?? '',
        orientation: parsed['room_orientation'] ?? undefined,
      },
      level: (parsed['level'] as any) ?? 'recommended',
      buildingType: parsed['building_type'] ?? undefined,
    };

    const engine = new RuleEngine();
    const result = engine.evaluateRule(rule, context);

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

main();
