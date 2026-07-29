export type ProjectStatus = 'Estudo' | 'Projeto Executivo' | 'Fornecimento' | 'Instalação' | 'Commissioning' | 'Entregue' | 'Arquivado';
export type ProposalStatus = 'Rascunho' | 'Enviada' | 'Negociação' | 'Aprovada' | 'Rejeitada';
export type TaskStatus = 'Por fazer' | 'Em progresso' | 'Em revisão' | 'Concluída';
export type ChecklistStatus = 'Pendente' | 'Em progresso' | 'Completo' | 'Aprovado';
export type Priority = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
export type InvoiceStatus = 'emitida' | 'pendente' | 'paga';
export type TicketStatus = 'Aberto' | 'Em atendimento' | 'Resolvido' | 'Fechado';

// Supplier types
export type ServiceType = 'purchase' | 'installation' | 'configuration' | 'maintenance';
export type ItemSupplierStatus = 'pending' | 'quoted' | 'ordered' | 'delivered' | 'cancelled';
export type ProcurementTaskType = 'purchase' | 'installation' | 'configuration' | 'delivery_tracking' | 'follow_up';
export type ContactMethod = 'email' | 'phone' | 'chat' | 'in_person';

// Database row types (from Supabase)
export interface Project {
  id: string;
  name: string;
  client_id: string | null;
  address: string | null;
  typology: string | null;
  area_m2: number | null;
  status: string | null;
  phase: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  value: number | null;
  description: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  vat_number: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  services: ServiceType[];
  lead_time_days: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  reference: string | null;
  status: string | null;
  total_amount: number | null;
  valid_until: string | null;
  payment_terms: string | null;
  version: number;
  created_at: string;
}

export interface ProposalExperience {
  id: string;
  proposal_id: string;
  name: string;
  description: string | null;
  amount: number | null;
  order_index: number;
}

export interface ProposalItemSupplier {
  id: string;
  proposal_experience_id: string;
  proposal_id: string;
  supplier_id: string;
  service_type: ServiceType;
  unit_cost: number | null;
  quantity: number;
  total_cost: number | null;
  lead_time_days: number | null;
  status: ItemSupplierStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  supplier?: Supplier;
}

export interface ProcurementTask {
  id: string;
  project_id: string | null;
  proposal_id: string | null;
  proposal_experience_id: string | null;
  supplier_id: string | null;
  item_supplier_id: string | null;
  title: string;
  description: string | null;
  task_type: ProcurementTaskType;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  last_contact_at: string | null;
  last_contact_method: ContactMethod | null;
  last_contact_summary: string | null;
  next_follow_up: string | null;
  supplier_promised_date: string | null;
  actual_delivery_date: string | null;
  linked_task_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  supplier?: Supplier;
  project?: Project;
}

export interface SupplierMessage {
  id: string;
  supplier_id: string;
  proposal_id: string | null;
  proposal_experience_id: string | null;
  procurement_task_id: string | null;
  sender_type: 'user' | 'supplier' | 'system';
  sender_user_id: string | null;
  sender_name: string | null;
  content: string;
  attachments: Array<{ name: string; url: string; size?: number }>;
  is_internal_note: boolean;
  message_type: 'message' | 'quote' | 'order' | 'delivery_update' | 'reminder' | 'system';
  read_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface EquipmentCategory {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}

export interface Equipment {
  id: string;
  category_id: string;
  name: string;
  reference: string | null;
  brand: string | null;
  description: string | null;
  unit_price: number | null;
  supplier: string | null;
  alternatives: string | null;
  justification: string | null;
  specifications_json: Record<string, string> | null;
  datasheet_url: string | null;
  image_url: string | null;
  source_url: string | null;
  firmware_version: string | null;
  status: 'online' | 'offline' | 'unknown' | 'warning' | 'error' | null;
  installation_date: string | null;
  warranty_years: number | null;
  ip_address: string | null;
  mac_address: string | null;
  network_zone: string | null;
  project_id: string | null;
  room_code: string | null;
  created_at: string;
}

export interface EquipmentRelationship {
  id: string;
  source_equipment_id: string;
  target_equipment_id: string;
  relationship_type: 'controls' | 'triggers' | 'part_of' | 'replaces' | 'connected_to';
  notes: string | null;
  created_at: string;
  // joined
  target?: Equipment;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}

export interface ChecklistItem {
  id: string;
  category_id: string;
  text: string;
  order_index: number;
}

export interface ChecklistResponse {
  id: string;
  project_id: string;
  item_id: string;
  status: string | null;
  notes: string | null;
  completed_by: string | null;
  completed_at: string | null;
}

export interface Invoice {
  id: string;
  project_id: string | null;
  client_id: string | null;
  number: string;
  amount: number;
  status: string | null;
  issue_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  created_at: string;
}

export interface MaintenanceTicket {
  id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  severity: string | null;
  status: string | null;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface MaintenanceVisit {
  id: string;
  project_id: string | null;
  client_id: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  type: string | null;
  description: string | null;
  findings: string | null;
  status: string | null;
  technician_id: string | null;
  created_at: string;
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  order_index: number;
}

export interface Document {
  id: string;
  project_id: string | null;
  name: string;
  type: string | null;
  file_url: string | null;
  file_path: string | null;
  description: string | null;
  created_at: string;
}

export interface SystemConfiguration {
  id: string;
  project_id: string;
  name: string;
  template_type: 'basalte_knx' | 'lutron_dali' | 'crestron' | 'savant' | 'custom';
  status: 'draft' | 'review' | 'approved' | 'implemented';
  rooms: SystemRoom[];
  devices: SystemDevice[];
  scenes: SystemScene[];
  integrations: SystemIntegration[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemRoom {
  code: string;
  name: string;
  dots?: SystemDot[];
  lighting?: {
    type?: string;
    temp?: string;
    cri?: string;
    scenes?: string[];
    notes?: string;
  };
  sensors?: string[];
  climate?: string;
  audio?: string;
  notes?: string;
}

export interface SystemDot {
  type: 'DOT4' | 'DOT8' | 'DOT2' | string;
  position?: string;
  buttons: string[];
}

export interface SystemScene {
  name: string;
  trigger?: string;
  actions: string[];
  room_code?: string;
}

export interface SystemDevice {
  name: string;
  brand?: string;
  reference?: string;
  category?: string;
  room_code?: string;
  quantity?: number;
  notes?: string;
}

export interface SystemIntegration {
  system: string;
  role: string;
  model?: string;
  protocols?: string[];
}

export interface TemplateData {
  template_type: SystemConfiguration['template_type'];
  name: string;
  description: string;
  server?: string;
  protocol?: string;
  rooms: SystemRoom[];
  dot_logic?: Record<string, string>;
  scenes: SystemScene[];
  integrations: SystemIntegration[];
  [key: string]: unknown;
}
