// Edge Function: send-supplier-email
// Envia email para fornecedor via Resend e regista mensagem no chat

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const RESEND_API_KEY = 'sk-e2fa58f4afb94852b6b71169e54522b1';
const FROM_EMAIL = 'ines.gavinho@gavinhogroup.com';

interface EmailPayload {
  supplier_id: string;
  subject: string;
  content: string;
  procurement_task_id?: string;
  proposal_id?: string;
  proposal_experience_id?: string;
  sender_name?: string;
  sender_user_id?: string;
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const body: EmailPayload = await req.json();
    const { supplier_id, subject, content, procurement_task_id, proposal_id, proposal_experience_id, sender_name, sender_user_id } = body;

    if (!supplier_id || !subject || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields: supplier_id, subject, content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Buscar email do fornecedor no Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://iiiicrfhqwsltswmfvld.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaWljcmZocXdzbHRzd21mdmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTg3ODQsImV4cCI6MjEwMDc3NDc4NH0.2SGIALeLQdaq753_4P_FVni8L_Yyn54T06XPWz3DZOY';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('name, email, contact_email')
      .eq('id', supplier_id)
      .single();

    if (supplierError || !supplier) {
      return new Response(JSON.stringify({ error: 'Fornecedor não encontrado', details: supplierError?.message }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const toEmail = supplier.contact_email || supplier.email;
    if (!toEmail) {
      return new Response(JSON.stringify({ error: 'Fornecedor não tem email configurado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Enviar email via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `300 Human Experience Design <${FROM_EMAIL}>`,
        to: toEmail,
        subject,
        text: content,
        reply_to: FROM_EMAIL,
      }),
    });

    if (!resendRes.ok) {
      const resendErr = await resendRes.text();
      return new Response(JSON.stringify({ error: 'Erro ao enviar email', details: resendErr }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const resendData = await resendRes.json();

    // Registar mensagem na tabela supplier_messages
    const { error: msgError } = await supabase.from('supplier_messages').insert({
      supplier_id,
      proposal_id: proposal_id || null,
      proposal_experience_id: proposal_experience_id || null,
      procurement_task_id: procurement_task_id || null,
      sender_type: 'user',
      sender_user_id: sender_user_id || null,
      sender_name: sender_name || 'Equipa 300',
      content: `[Enviado por email para ${toEmail}]\n\nAssunto: ${subject}\n\n${content}`,
      message_type: 'message',
      is_internal_note: false,
    });

    if (msgError) {
      console.error('Erro ao registar mensagem:', msgError);
    }

    // Atualizar last_contact na procurement_task
    if (procurement_task_id) {
      await supabase.from('procurement_tasks').update({
        last_contact_at: new Date().toISOString(),
        last_contact_method: 'email',
      }).eq('id', procurement_task_id);
    }

    return new Response(JSON.stringify({
      success: true,
      email_id: resendData.id,
      to: toEmail,
      supplier_name: supplier.name,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Internal error', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
