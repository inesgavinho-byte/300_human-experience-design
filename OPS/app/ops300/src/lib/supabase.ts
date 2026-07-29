import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iiiicrfhqwsltswmfvld.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaWljcmZocXdzbHRzd21mdmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTg3ODQsImV4cCI6MjEwMDc3NDc4NH0.2SGIALeLQdaq753_4P_FVni8L_Yyn54T06XPWz3DZOY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string | null;
          avatar_url: string | null;
          created_at: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          notes: string | null;
          created_at: string;
        };
      };
      projects: {
        Row: {
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
        };
      };
      project_phases: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          status: string | null;
          start_date: string | null;
          end_date: string | null;
          order_index: number;
        };
      };
      proposals: {
        Row: {
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
        };
      };
      proposal_experiences: {
        Row: {
          id: string;
          proposal_id: string;
          name: string;
          description: string | null;
          amount: number | null;
          order_index: number;
        };
      };
      tasks: {
        Row: {
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
        };
      };
      equipment_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          order_index: number;
        };
      };
      equipment: {
        Row: {
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
          specifications_json: unknown;
          datasheet_url: string | null;
          image_url: string | null;
          source_url: string | null;
          firmware_version: string | null;
          status: string | null;
          installation_date: string | null;
          warranty_years: number | null;
          ip_address: string | null;
          mac_address: string | null;
          network_zone: string | null;
          project_id: string | null;
          room_code: string | null;
          created_at: string;
        };
      };
      checklist_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          order_index: number;
        };
      };
      checklist_items: {
        Row: {
          id: string;
          category_id: string;
          text: string;
          order_index: number;
        };
      };
      checklist_responses: {
        Row: {
          id: string;
          project_id: string;
          item_id: string;
          status: string | null;
          notes: string | null;
          completed_by: string | null;
          completed_at: string | null;
        };
      };
      invoices: {
        Row: {
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
        };
      };
      maintenance_visits: {
        Row: {
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
        };
      };
      maintenance_tickets: {
        Row: {
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
        };
      };
      documents: {
        Row: {
          id: string;
          project_id: string | null;
          name: string;
          type: string | null;
          file_url: string | null;
          file_path: string | null;
          description: string | null;
          created_at: string;
        };
      };
      system_configurations: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          template_type: string;
          status: string;
          rooms: unknown;
          devices: unknown;
          scenes: unknown;
          integrations: unknown;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
