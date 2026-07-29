'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockEngineeringRules } from '@/lib/mock-data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Play, Eye } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  dimensionamento: 'Dimensionamento',
  compatibilidade: 'Compatibilidade',
  performance: 'Performance',
  seguranca: 'Segurança',
  regulamentar: 'Regulamentar',
  economia: 'Economia',
  sustentabilidade: 'Sustentabilidade',
  outro: 'Outro',
};

export default function RulesPage() {
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [viewRule, setViewRule] = useState<string | null>(null);
  const [testRule, setTestRule] = useState<string | null>(null);

  const handleTest = (rule: (typeof mockEngineeringRules)[0]) => {
    try {
      const fn = new Function('return ' + rule.rule_expression)();
      const input = testInputs[rule.id];
      let result: unknown;
      if (rule.parameters && typeof fn === 'function') {
        result = fn(input);
      } else {
        result = 'Função inválida';
      }
      setTestResults((prev) => ({ ...prev, [rule.id]: String(result) }));
    } catch (e) {
      setTestResults((prev) => ({ ...prev, [rule.id]: `Erro: ${e}` }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regras de Engenharia</h1>
        <p className="text-muted-foreground">Biblioteca de regras parametrizáveis</p>
      </div>

      <DataTable
        data={mockEngineeringRules}
        columns={[
          {
            key: 'code',
            header: 'Código',
            cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
          },
          {
            key: 'name',
            header: 'Nome',
            cell: (row) => <span className="font-medium">{row.name}</span>,
          },
          {
            key: 'category',
            header: 'Categoria',
            cell: (row) => <Badge variant="outline">{categoryLabels[row.category] || row.category}</Badge>,
          },
          {
            key: 'status',
            header: 'Estado',
            cell: (row) => <StatusBadge status={row.approval_status} />,
          },
          {
            key: 'active',
            header: 'Ativa',
            cell: (row) => <span className="text-sm">{row.is_active ? 'Sim' : 'Não'}</span>,
          },
          {
            key: 'actions',
            header: 'Ações',
            cell: (row) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewRule(row.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTestRule(row.id)}>
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* View Dialog */}
      <Dialog open={!!viewRule} onOpenChange={() => setViewRule(null)}>
        <DialogContent className="max-w-2xl">
          {(() => {
            const row = mockEngineeringRules.find((r) => r.id === viewRule);
            if (!row) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{row.code} — {row.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Descrição</span>
                    <p className="text-sm">{row.description || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Expressão ({row.rule_language})</span>
                    <pre className="mt-1 rounded-md bg-muted p-3 text-xs overflow-x-auto">
                      {row.rule_expression}
                    </pre>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Parâmetros</span>
                    <pre className="mt-1 rounded-md bg-muted p-3 text-xs">
                      {JSON.stringify(row.parameters, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={!!testRule} onOpenChange={() => setTestRule(null)}>
        <DialogContent>
          {(() => {
            const row = mockEngineeringRules.find((r) => r.id === testRule);
            if (!row) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Testar Regra: {row.code}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`test-${row.id}`}>Input (JSON ou valor simples)</Label>
                    <Input
                      id={`test-${row.id}`}
                      placeholder='Ex: "estar" ou 45'
                      value={testInputs[row.id] || ''}
                      onChange={(e) => setTestInputs((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                  </div>
                  <Button onClick={() => handleTest(row)}>Executar</Button>
                  {testResults[row.id] && (
                    <div className="rounded-md bg-muted p-3">
                      <span className="text-xs text-muted-foreground">Resultado:</span>
                      <p className="mt-1 font-mono text-sm">{testResults[row.id]}</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
