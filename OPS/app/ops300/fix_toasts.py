import re

# Tasks.tsx - add toast imports and toast calls
with open('src/pages/Tasks.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace(
    "import type { Task, Project, ProcurementTask, Supplier } from '@/types';",
    "import { toastSuccess, toastError } from '@/lib/toast';\nimport type { Task, Project, ProcurementTask, Supplier } from '@/types';"
)

# Add toastSuccess in moveTask
content = content.replace(
    "if (!error) {\n      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));\n    }",
    "if (!error) {\n      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));\n      toastSuccess('Tarefa movida', `Para: ${newStatus}`);\n    } else {\n      toastError('Erro ao mover tarefa', error.message);\n    }"
)

# Add toastSuccess in moveProcTask
content = content.replace(
    "if (!error) {\n      setProcurementTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));\n    }",
    "if (!error) {\n      setProcurementTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));\n      toastSuccess('Tarefa de procurement movida', `Para: ${newStatus}`);\n    } else {\n      toastError('Erro ao mover tarefa', error.message);\n    }"
)

with open('src/pages/Tasks.tsx', 'w') as f:
    f.write(content)
print('Tasks.tsx done')

# Suppliers.tsx - add toast imports and toast calls
with open('src/pages/Suppliers.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace(
    "import type { Supplier, ServiceType } from '@/types';",
    "import { toastSuccess, toastError } from '@/lib/toast';\nimport type { Supplier, ServiceType } from '@/types';"
)

# Add toastSuccess in save
content = content.replace(
    "setDialogOpen(false);\n      await fetchSuppliers();",
    "setDialogOpen(false);\n      toastSuccess(editing ? 'Fornecedor atualizado' : 'Fornecedor criado', form.name || '');\n      await fetchSuppliers();"
)

# Add toastError in save catch
content = content.replace(
    "setError(err.message || 'Erro ao guardar');",
    "setError(err.message || 'Erro ao guardar');\n      toastError('Erro ao guardar fornecedor', err.message);"
)

with open('src/pages/Suppliers.tsx', 'w') as f:
    f.write(content)
print('Suppliers.tsx done')

# Procurement.tsx - add toast imports and toast calls
with open('src/pages/Procurement.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace(
    "import type { ProcurementTask, Supplier, SupplierMessage, Project } from '@/types';",
    "import { toastSuccess, toastError } from '@/lib/toast';\nimport type { ProcurementTask, Supplier, SupplierMessage, Project } from '@/types';"
)

# Add toastSuccess in sendMessage
content = content.replace(
    "if (!error) {\n      setNewMessage('');",
    "if (!error) {\n      toastSuccess('Mensagem enviada');\n      setNewMessage('');"
)

# Add toastError in sendMessage
# Find the end of sendMessage function and add error toast
content = content.replace(
    "await supabase.from('procurement_tasks').update({\n        last_contact_at: new Date().toISOString(),\n        last_contact_method: 'chat',\n      }).eq('id', selectedTask.id);",
    "await supabase.from('procurement_tasks').update({\n        last_contact_at: new Date().toISOString(),\n        last_contact_method: 'chat',\n      }).eq('id', selectedTask.id);\n    } else {\n      toastError('Erro ao enviar mensagem', error.message);"
)

# Add toastSuccess in updateTaskStatus
content = content.replace(
    "async function updateTaskStatus(taskId: string, status: string) {",
    "async function updateTaskStatus(taskId: string, status: string) {\n    const task = tasks.find(t => t.id === taskId);"
)
content = content.replace(
    "await supabase.from('procurement_tasks').update(updates).eq('id', taskId);\n    await fetchTasks();",
    "await supabase.from('procurement_tasks').update(updates).eq('id', taskId);\n    await fetchTasks();\n    toastSuccess('Tarefa atualizada', `${task?.title || ''} → ${status}`);"
)

with open('src/pages/Procurement.tsx', 'w') as f:
    f.write(content)
print('Procurement.tsx done')
