import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { to, subject, html, text }: EmailPayload = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const htmlContent = html || text || "";
    const textContent =
      text ||
      html?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() ||
      "";

    const styledHtml = `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f5f3ef; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #faf8f5; }
    .header { background-color: #1a1a0f; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; color: #f5f3ef; font-family: Georgia, 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; letter-spacing: 2px; }
    .content { padding: 32px 24px; color: #1a1a0f; line-height: 1.6; font-size: 15px; }
    .footer { padding: 24px; text-align: center; color: #8a8578; font-size: 12px; border-top: 1px solid #ddd8cf; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>300 OPS</h1>
    </div>
    <div class="content">
      ${htmlContent}
    </div>
    <div class="footer">
      <p>300 Human Design Experience · Plataforma de Gestão</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "300 OPS <noreply@300-humandesignexperience.pt>",
        to,
        subject,
        html: styledHtml,
        text: textContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return new Response(
        JSON.stringify({ error: "Resend API error", details: errorText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
