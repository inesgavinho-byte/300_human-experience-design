import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertTriangle, Plus, Trash2, Edit3, Check, X,
  ChevronDown, ChevronUp, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ChecklistCategory, ChecklistItem, ChecklistResponse } from '@/types';

const STATUS_OPTIONS = ['Pendente', 'Em progresso', 'Completo', 'Aprovado'] as const;

const statusColors: Record<string, string> = {
  'Pendente': 'bg-line/40 text-ink',
  'Em progresso': 'bg-amber-50 text-amber-700 border-amber-200',
  'Completo': 'bg-ink text-ivory',
  'Aprovado': 'bg-green-700 text-ivory',
};

interface MergedItem extends ChecklistItem {
  response?: ChecklistResponse;
}

export default function Documentation() {
  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [responses, setResponses] = useState<ChecklistResponse[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  /* Create / Edit dialogs */
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ChecklistCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [itemForm, setItemForm] = useState({ text: '', category_id: '' });

  const [noteItemId, setNoteItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  /* ─── Fetch data ─── */
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');
        const [categoriesRes, itemsRes, responsesRes] = await Promise.all([
          supabase.from('checklist_categories').select('*').order('order_index', { ascending: true }),
          supabase.from('checklist_items').select('*').order('order_index', { ascending: true }),
          supabase.from('checklist_responses').select('*'),
        ]);
        if (categoriesRes.error) throw categoriesRes.error;
        if (itemsRes.error) throw itemsRes.error;
        if (responsesRes.error) throw responsesRes.error;
        setCategories(categoriesRes.data || []);
        setItems(itemsRes.data || []);
        setResponses(responsesRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar checklist');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const mergedItems: MergedItem[] = items.map(item => ({
    ...item,
    response: responses.find(r => r.item_id === item.id),
  }));

  const total = mergedItems.length;
  const completed = mergedItems.filter(i => i.response?.status === 'Completo' || i.response?.status === 'Aprovado').length;
  const inProgress = mergedItems.filter(i => i.response?.status === 'Em progresso').length;
  const pending = total - completed - inProgress;

  const categoryStats = categories.map(cat => {
    const catItems = mergedItems.filter(i => i.category_id === cat.id);
    const done = catItems.filter(i => i.response?.status === 'Completo' || i.response?.status === 'Aprovado').length;
    return { section: cat.name, total: catItems.length, done, pct: catItems.length > 0 ? Math.round((done / catItems.length) * 100) : 0 };
  });

  const filteredItems = activeCategory
    ? mergedItems.filter(i => i.category_id === activeCategory)
    : mergedItems;

  /* ─── Status update ─── */
  async function updateStatus(itemId: string, status: string) {
    const existing = responses.find(r => r.item_id === itemId);
    if (existing) {
      const { error } = await supabase.from('checklist_responses').update({
        status,
        completed_at: status === 'Completo' || status === 'Aprovado' ? new Date().toISOString() : null,
      }).eq('id', existing.id);
      if (error) { toast.error('Erro: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('checklist_responses').insert({
        item_id: itemId,
        status,
        completed_at: status === 'Completo' || status === 'Aprovado' ? new Date().toISOString() : null,
      });
      if (error) { toast.error('Erro: ' + error.message); return; }
    }
    toast.success('Estado atualizado');
    const { data } = await supabase.from('checklist_responses').select('*');
    if (data) setResponses(data);
  }

  async function saveNote(itemId: string) {
    const existing = responses.find(r => r.item_id === itemId);
    if (existing) {
      const { error } = await supabase.from('checklist_responses').update({ notes: noteText }).eq('id', existing.id);
      if (error) { toast.error('Erro: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('checklist_responses').insert({ item_id: itemId, notes: noteText, status: 'Pendente' });
      if (error) { toast.error('Erro: ' + error.message); return; }
    }
    toast.success('Nota guardada');
    setNoteItemId(null);
    setNoteText('');
    const { data } = await supabase.from('checklist_responses').select('*');
    if (data) setResponses(data);
  }

  /* ─── Category CRUD ─── */
  function openCatDialog(cat?: ChecklistCategory) {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, description: cat.description || '' });
    } else {
      setEditingCat(null);
      setCatForm({ name: '', description: '' });
    }
    setCatDialogOpen(true);
  }

  async function saveCategory() {
    if (!catForm.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (editingCat) {
      const { error } = await supabase.from('checklist_categories').update({
        name: catForm.name.trim(),
        description: catForm.description.trim() || null,
      }).eq('id', editingCat.id);
      if (error) { toast.error('Erro: ' + error.message); return; }
      toast.success('Categoria atualizada');
    } else {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order_index)) : -1;
      const { error } = await supabase.from('checklist_categories').insert({
        name: catForm.name.trim(),
        description: catForm.description.trim() || null,
        order_index: maxOrder + 1,
      });
      if (error) { toast.error('Erro: ' + error.message); return; }
      toast.success('Categoria criada');
    }
    setCatDialogOpen(false);
    const { data } = await supabase.from('checklist_categories').select('*').order('order_index', { ascending: true });
    if (data) setCategories(data);
  }

  async function deleteCategory(catId: string) {
    const catItems = items.filter(i => i.category_id === catId);
    if (catItems.length > 0 && !confirm(`Esta categoria tem ${catItems.length} item(s). Eliminar mesmo assim?`)) return;
    await supabase.from('checklist_items').delete().eq('category_id', catId);
    const { error } = await supabase.from('checklist_categories').delete().eq('id', catId);
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.success('Categoria eliminada');
    setCategories(prev => prev.filter(c => c.id !== catId));
    setItems(prev => prev.filter(i => i.category_id !== catId));
    if (activeCategory === catId) setActiveCategory(null);
  }

  /* ─── Item CRUD ─── */
  function openItemDialog(item?: ChecklistItem) {
    if (item) {
      setEditingItem(item);
      setItemForm({ text: item.text, category_id: item.category_id });
    } else {
      setEditingItem(null);
      setItemForm({ text: '', category_id: activeCategory || (categories[0]?.id ?? '') });
    }
    setItemDialogOpen(true);
  }

  async function saveItem() {
    if (!itemForm.text.trim()) { toast.error('Texto obrigatório'); return; }
    if (!itemForm.category_id) { toast.error('Categoria obrigatória'); return; }
    if (editingItem) {
      const { error } = await supabase.from('checklist_items').update({
        text: itemForm.text.trim(),
        category_id: itemForm.category_id,
      }).eq('id', editingItem.id);
      if (error) { toast.error('Erro: ' + error.message); return; }
      toast.success('Item atualizado');
    } else {
      const catItems = items.filter(i => i.category_id === itemForm.category_id);
      const maxOrder = catItems.length > 0 ? Math.max(...catItems.map(i => i.order_index)) : -1;
      const { error } = await supabase.from('checklist_items').insert({
        text: itemForm.text.trim(),
        category_id: itemForm.category_id,
        order_index: maxOrder + 1,
      });
      if (error) { toast.error('Erro: ' + error.message); return; }
      toast.success('Item criado');
    }
    setItemDialogOpen(false);
    const { data } = await supabase.from('checklist_items').select('*').order('order_index', { ascending: true });
    if (data) setItems(data);
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Eliminar este item?')) return;
    await supabase.from('checklist_responses').delete().eq('item_id', itemId);
    const { error } = await supabase.from('checklist_items').delete().eq('id', itemId);
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.success('Item eliminado');
    setItems(prev => prev.filter(i => i.id !== itemId));
    setResponses(prev => prev.filter(r => r.item_id !== itemId));
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Documentação</h1>
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Documentação</h1>
          <p className="text-olive text-sm mt-1 font-sans">Checklist de entrega — {completed}/{total} itens concluídos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCatDialog()} className="border-line text-ink font-sans">
            <Plus size={14} className="mr-1" /> Categoria
          </Button>
          <Button variant="outline" onClick={() => openItemDialog()} className="border-line text-ink font-sans">
            <Plus size={14} className="mr-1" /> Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Total</p>
            <p className="text-2xl font-serif text-ink mt-1">{total}</p>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Completos</p>
            <p className="text-2xl font-serif text-ink mt-1">{completed}</p>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Em progresso</p>
            <p className="text-2xl font-serif text-ink mt-1">{inProgress}</p>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Pendentes</p>
            <p className="text-2xl font-serif text-ink mt-1">{pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Scorecard */}
      <Card className="border-line bg-ivory">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-ink">Scorecard por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryStats.map(s => (
            <div key={s.section}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-ink font-sans">{s.section}</span>
                <span className="text-olive font-sans text-xs">{s.done}/{s.total}</span>
              </div>
              <Progress value={s.pct} className="h-1.5 bg-line" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Filter + Items */}
      <Card className="border-line bg-ivory">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="font-serif text-lg text-ink">Itens do Checklist</CardTitle>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1 text-xs rounded-full border font-sans ${activeCategory === null ? 'bg-ink text-ivory border-ink' : 'border-line text-olive hover:border-ink'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 text-xs rounded-full border font-sans flex items-center gap-1 ${activeCategory === cat.id ? 'bg-ink text-ivory border-ink' : 'border-line text-olive hover:border-ink'}`}
              >
                {cat.name}
                <button
                  onClick={e => { e.stopPropagation(); openCatDialog(cat); }}
                  className="hover:text-ivory/80 ml-0.5"
                >
                  <Edit3 size={9} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }}
                  className="hover:text-red-300 ml-0.5"
                >
                  <Trash2 size={9} />
                </button>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <p className="text-sm text-olive font-sans py-4 text-center">
              {activeCategory ? 'Sem itens nesta categoria. Adicione um item.' : 'Sem itens no checklist. Adicione uma categoria e itens.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item, idx) => {
                const category = categories.find(c => c.id === item.category_id);
                const currentStatus = item.response?.status || 'Pendente';
                const isExpanded = noteItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`border rounded-md overflow-hidden transition-colors ${
                      currentStatus === 'Aprovado' ? 'border-green-200 bg-green-50/30' :
                      currentStatus === 'Completo' ? 'border-ink/20 bg-line/10' :
                      currentStatus === 'Em progresso' ? 'border-amber-200 bg-amber-50/20' :
                      'border-line bg-ivory'
                    }`}
                  >
                    {/* Main row */}
                    <div className="flex items-start gap-3 p-3">
                      <span className="text-[10px] text-olive font-sans mt-1 shrink-0 w-5">{idx + 1}</span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink font-sans">{item.text}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] text-olive font-sans">{category?.name || '—'}</span>
                          {item.response?.notes && (
                            <span className="text-[10px] text-olive/70 font-sans italic max-w-xs truncate">
                              Nota: {item.response.notes}
                            </span>
                          )}
                          {item.response?.completed_at && (
                            <span className="text-[10px] text-green-600 font-sans">
                              ✓ {new Date(item.response.completed_at).toLocaleDateString('pt-PT')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status selector */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {STATUS_OPTIONS.map(st => (
                          <button
                            key={st}
                            onClick={() => updateStatus(item.id, st)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-sans border transition-colors ${
                              currentStatus === st
                                ? statusColors[st] + ' border-current'
                                : 'border-line text-olive hover:border-ink/40'
                            }`}
                          >
                            {st === currentStatus && <Check size={8} className="inline mr-0.5" />}
                            {st}
                          </button>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setNoteItemId(isExpanded ? null : item.id);
                            setNoteText(item.response?.notes || '');
                          }}
                          className="p-1 hover:bg-line/40 rounded"
                          title="Notas"
                        >
                          {isExpanded ? <ChevronUp size={13} className="text-olive" /> : <ChevronDown size={13} className="text-olive" />}
                        </button>
                        <button onClick={() => openItemDialog(item)} className="p-1 hover:bg-line/40 rounded" title="Editar">
                          <Edit3 size={13} className="text-olive" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1 hover:bg-red-50 rounded" title="Eliminar">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded note */}
                    {isExpanded && (
                      <div className="border-t border-line/50 px-3 py-3 bg-line/10">
                        <label className="text-[10px] uppercase tracking-wider text-olive font-sans mb-1 block">Notas / Observações</label>
                        <Textarea
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          rows={2}
                          placeholder="Adicione notas sobre este item..."
                          className="bg-ivory border-line text-ink text-xs font-sans"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button size="sm" variant="ghost" onClick={() => { setNoteItemId(null); setNoteText(''); }} className="text-olive h-7 text-xs">
                            <X size={12} className="mr-1" /> Cancelar
                          </Button>
                          <Button size="sm" onClick={() => saveNote(item.id)} className="bg-ink text-ivory hover:bg-ink/90 h-7 text-xs">
                            <Save size={12} className="mr-1" /> Guardar Nota
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Category Dialog ─── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="bg-ivory border-line max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-ink">
              {editingCat ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-olive text-xs font-sans">Nome *</label>
              <Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="bg-ivory border-line text-ink mt-1" />
            </div>
            <div>
              <label className="text-olive text-xs font-sans">Descrição</label>
              <Textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} rows={2} className="bg-ivory border-line text-ink mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)} className="border-line text-ink">Cancelar</Button>
            <Button onClick={saveCategory} className="bg-ink text-ivory hover:bg-ink/90">
              <Save size={14} className="mr-1" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Item Dialog ─── */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="bg-ivory border-line max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-ink">
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-olive text-xs font-sans">Texto do Item *</label>
              <Textarea value={itemForm.text} onChange={e => setItemForm({ ...itemForm, text: e.target.value })} rows={3} className="bg-ivory border-line text-ink mt-1" />
            </div>
            <div>
              <label className="text-olive text-xs font-sans">Categoria *</label>
              <select
                value={itemForm.category_id}
                onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-ivory border border-line rounded-md text-ink text-sm font-sans"
              >
                <option value="">Selecionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)} className="border-line text-ink">Cancelar</Button>
            <Button onClick={saveItem} className="bg-ink text-ivory hover:bg-ink/90">
              <Save size={14} className="mr-1" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
