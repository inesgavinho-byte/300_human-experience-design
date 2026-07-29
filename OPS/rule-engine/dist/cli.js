#!/usr/bin/env node
"use strict";
// ============================================================================
// 300 OPS Rule Engine CLI
// ============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const rule_engine_1 = require("./engine/rule-engine");
function printUsage() {
    console.log(`
300 OPS Rule Engine CLI

Usage:
  node dist/cli.js evaluate --rule <CODE> --room '{JSON}' --level <LEVEL>
  node dist/cli.js test --rule <CODE>
  node dist/cli.js list-rules

Commands:
  evaluate    Evaluate a single rule with given context
  test        Run built-in tests for a rule
  list-rules  List all registered built-in rules

Options:
  --rule, -r      Rule code (e.g., ILU-001)
  --room          Room JSON object
  --level, -l     Solution level: essential | recommended | signature (default: recommended)
  --project       Project JSON object
  --requirements  Requirements JSON array
  --help, -h      Show this help

Examples:
  node dist/cli.js evaluate --rule ILU-001 --room '{"area_m2": 58, "function": "estar"}' --level recommended
  node dist/cli.js evaluate --rule CLI-001 --room '{"area_m2": 30, "function": "suite"}'
  node dist/cli.js test --rule ILU-001
  node dist/cli.js list-rules
`);
}
function parseArgs(args) {
    const parsed = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--help' || arg === '-h') {
            parsed.help = 'true';
        }
        else if (arg === '--rule' || arg === '-r') {
            parsed.rule = args[++i];
        }
        else if (arg === '--room') {
            parsed.room = args[++i];
        }
        else if (arg === '--level' || arg === '-l') {
            parsed.level = args[++i];
        }
        else if (arg === '--project') {
            parsed.project = args[++i];
        }
        else if (arg === '--requirements') {
            parsed.requirements = args[++i];
        }
        else if (!parsed.command) {
            parsed.command = arg;
        }
    }
    return parsed;
}
function buildContext(args) {
    const project = args.project
        ? JSON.parse(args.project)
        : {
            id: 'cli-test',
            name: 'CLI Test Project',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    const room = args.room
        ? JSON.parse(args.room)
        : undefined;
    if (room && !room.id) {
        room.id = 'cli-room';
        room.detection_state = 'confirmed';
    }
    const requirements = args.requirements
        ? JSON.parse(args.requirements)
        : [];
    const level = (args.level ?? 'recommended');
    return {
        project,
        room,
        requirements,
        solutionLevel: level,
        equipmentLibrary: [],
    };
}
async function cmdEvaluate(args) {
    if (!args.rule) {
        console.error('Error: --rule is required for evaluate command');
        process.exit(1);
    }
    const engine = new rule_engine_1.RuleEngine();
    // Import and register built-in rules
    const builtinRules = await Promise.resolve().then(() => __importStar(require('./rules/built-in')));
    for (const key of Object.keys(builtinRules)) {
        const rule = builtinRules[key];
        if (rule && rule.code) {
            engine.registerBuiltinRule(rule);
        }
    }
    const context = buildContext(args);
    console.log(`\nEvaluating rule: ${args.rule}`);
    console.log('Context:', JSON.stringify(context, null, 2));
    console.log('');
    try {
        const result = await engine.evaluateBuiltinRule(args.rule, context);
        console.log('─'.repeat(60));
        console.log('Result:');
        console.log('─'.repeat(60));
        console.log(`Rule Code:    ${result.ruleCode}`);
        console.log(`Confidence:   ${result.confidence}`);
        console.log(`Execution:    ${result.executionTimeMs}ms`);
        console.log(`Outputs:`);
        console.log(JSON.stringify(result.outputs, null, 2));
        if (result.errors.length > 0) {
            console.log('\nErrors:');
            result.errors.forEach(e => console.log(`  ❌ ${e}`));
        }
        if (result.logs.length > 0) {
            console.log('\nLogs:');
            result.logs.forEach(l => console.log(`  📝 ${l}`));
        }
        console.log('─'.repeat(60));
    }
    catch (err) {
        console.error(`Error evaluating rule: ${err?.message ?? String(err)}`);
        process.exit(1);
    }
}
async function cmdTest(args) {
    if (!args.rule) {
        console.error('Error: --rule is required for test command');
        process.exit(1);
    }
    const engine = new rule_engine_1.RuleEngine();
    const builtinRules = await Promise.resolve().then(() => __importStar(require('./rules/built-in')));
    for (const key of Object.keys(builtinRules)) {
        const rule = builtinRules[key];
        if (rule && rule.code) {
            engine.registerBuiltinRule(rule);
        }
    }
    const testCases = getTestCasesForRule(args.rule);
    console.log(`\nRunning tests for rule: ${args.rule}`);
    console.log(`Test cases: ${testCases.length}`);
    console.log('');
    let passed = 0;
    let failed = 0;
    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        try {
            const result = await engine.evaluateBuiltinRule(args.rule, tc.context);
            const success = tc.assert(result.outputs);
            if (success) {
                passed++;
                console.log(`  ✅ Test ${i + 1}: ${tc.name}`);
            }
            else {
                failed++;
                console.log(`  ❌ Test ${i + 1}: ${tc.name}`);
                console.log(`     Expected condition not met`);
                console.log(`     Got: ${JSON.stringify(result.outputs)}`);
            }
        }
        catch (err) {
            failed++;
            console.log(`  ❌ Test ${i + 1}: ${tc.name}`);
            console.log(`     Error: ${err?.message ?? String(err)}`);
        }
    }
    console.log('');
    console.log('─'.repeat(60));
    console.log(`Results: ${passed} passed, ${failed} failed, ${testCases.length} total`);
    console.log('─'.repeat(60));
    process.exit(failed > 0 ? 1 : 0);
}
function getTestCasesForRule(ruleCode) {
    const baseProject = {
        id: 'test',
        name: 'Test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    const makeRoom = (area, func) => ({
        id: 'test-room',
        floor_id: 'test-floor',
        name: 'Test Room',
        function: func,
        area_m2: area,
        detection_state: 'confirmed',
    });
    const makeContext = (room, level = 'recommended') => ({
        project: baseProject,
        room,
        requirements: [],
        solutionLevel: level,
        equipmentLibrary: [],
    });
    switch (ruleCode) {
        case 'ILU-001':
            return [
                {
                    name: 'Sala 16m² → 4-6 spots',
                    context: makeContext(makeRoom(16, 'estar')),
                    assert: (o) => o.spots?.min === 4 && o.spots?.max === 6,
                },
                {
                    name: 'Sala 58m² → 15-20 spots',
                    context: makeContext(makeRoom(58, 'estar')),
                    assert: (o) => o.spots?.min === 15 && o.spots?.max === 20,
                },
                {
                    name: 'Quarto 12m² → 3-4 spots',
                    context: makeContext(makeRoom(12, 'suite')),
                    assert: (o) => o.spots?.min === 3 && o.spots?.max === 4,
                },
            ];
        case 'ILU-002':
            return [
                {
                    name: 'Essential → 2 circuitos',
                    context: makeContext(makeRoom(20, 'estar'), 'essential'),
                    assert: (o) => o.circuits_iluminacao === 2,
                },
                {
                    name: 'Recommended → 3 circuitos',
                    context: makeContext(makeRoom(20, 'estar'), 'recommended'),
                    assert: (o) => o.circuits_iluminacao === 3,
                },
                {
                    name: 'Signature + sala grande → 5 circuitos',
                    context: makeContext(makeRoom(58, 'estar'), 'signature'),
                    assert: (o) => o.circuits_iluminacao === 5,
                },
            ];
        case 'CLI-001':
            return [
                {
                    name: 'Sala pequena → sem zona',
                    context: makeContext(makeRoom(15, 'wc')),
                    assert: (o) => o.zones === 0,
                },
                {
                    name: 'Sala grande → com zona',
                    context: makeContext(makeRoom(30, 'estar')),
                    assert: (o) => o.zones === 1,
                },
                {
                    name: 'Suite → com zona',
                    context: makeContext(makeRoom(20, 'suite')),
                    assert: (o) => o.zones === 1,
                },
            ];
        case 'AUD-001':
            return [
                {
                    name: 'WC → sem áudio',
                    context: makeContext(makeRoom(5, 'wc')),
                    assert: (o) => o.zones === 0 && o.speakers === 0,
                },
                {
                    name: 'Estar essential → 2 colunas',
                    context: makeContext(makeRoom(30, 'estar'), 'essential'),
                    assert: (o) => o.speakers === 2,
                },
                {
                    name: 'Estar signature → 5 colunas + sub',
                    context: makeContext(makeRoom(30, 'estar'), 'signature'),
                    assert: (o) => o.speakers === 5 && o.subwoofer === true,
                },
            ];
        default:
            return [
                {
                    name: 'Smoke test — rule executes without error',
                    context: makeContext(makeRoom(20, 'estar')),
                    assert: (o) => typeof o === 'object',
                },
            ];
    }
}
async function cmdListRules() {
    const builtinRules = await Promise.resolve().then(() => __importStar(require('./rules/built-in')));
    console.log('\n300 OPS Rule Engine — Built-in Rules');
    console.log('═'.repeat(60));
    for (const key of Object.keys(builtinRules)) {
        const rule = builtinRules[key];
        if (rule && rule.code) {
            console.log(`  ${rule.code.padEnd(8)} ${rule.name}`);
            console.log(`           Category: ${rule.category}`);
            if (rule.description) {
                console.log(`           ${rule.description}`);
            }
            console.log('');
        }
    }
    console.log('═'.repeat(60));
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help || (!args.command && process.argv.length <= 2)) {
        printUsage();
        process.exit(0);
    }
    switch (args.command) {
        case 'evaluate':
            await cmdEvaluate(args);
            break;
        case 'test':
            await cmdTest(args);
            break;
        case 'list-rules':
            await cmdListRules();
            break;
        default:
            console.error(`Unknown command: ${args.command}`);
            printUsage();
            process.exit(1);
    }
}
main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map