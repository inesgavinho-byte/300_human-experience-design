import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard, Command } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['?'], description: 'Mostrar atalhos de teclado' },
  { keys: ['⌘', 'K'], description: 'Pesquisar projetos, clientes, propostas...' },
  { keys: ['Esc'], description: 'Fechar modal / palette / menu' },
];

export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating hint */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 hidden lg:flex items-center gap-2 px-3 py-2 rounded-md border border-line bg-ivory/90 backdrop-blur-sm text-olive text-xs font-sans hover:border-ink transition-colors shadow-sm"
        title="Atalhos de teclado"
      >
        <Keyboard size={13} strokeWidth={1.5} />
        <kbd className="px-1.5 py-0.5 rounded bg-line/40 text-[10px] font-mono">?</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-ivory border-line max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <Command size={18} strokeWidth={1.5} className="text-olive" />
              Atalhos de Teclado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <span className="text-sm text-ink font-sans">{s.description}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {s.keys.map((k, ki) => (
                    <kbd
                      key={ki}
                      className="px-2 py-0.5 rounded bg-line/40 text-[11px] font-mono text-ink border border-line"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-line">
            <p className="text-[11px] text-olive font-sans">
              Pressione <kbd className="px-1 rounded bg-line/40 text-[10px] font-mono">?</kbd> em qualquer página para abrir esta ajuda.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
