import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

interface ProductData {
  name: string;
  brand: string;
  reference: string;
  description: string;
  category: string;
  unit_price: number | null;
  specifications: Record<string, string>;
  datasheet_url: string;
  image_url: string | null;
}

async function fetchPageContent(url: string): Promise<{ text: string; status: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,pt-PT;q=0.8,pt;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'DNT': '1',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { text: '', status: response.status };
    }

    const html = await response.text();

    // Extract text content from HTML (basic stripping)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit content length to avoid token limits
    return { text: text.slice(0, 8000), status: response.status };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { text: '', status: 408 };
    }
    throw err;
  }
}

async function extractWithDeepSeek(url: string, content: string): Promise<ProductData> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const prompt = `You are a product data extractor for a smart home equipment catalog.
Extract structured product data from the following webpage content.

URL: ${url}

Webpage content:
${content || '[No content fetched — page may be protected or require JavaScript]'}

Extract as JSON with this exact structure:
{
  "name": "Product full name",
  "brand": "Brand/manufacturer name",
  "reference": "Product model/reference number",
  "description": "Concise product description in Portuguese (Portugal)",
  "category": "One of: Iluminação, Áudio, Vídeo, HVAC, Rede, Segurança, Automação, Controlo, Outro",
  "unit_price": 123.45,
  "specifications": {
    "key1": "value1",
    "key2": "value2"
  },
  "datasheet_url": "URL to datasheet or product page",
  "image_url": "URL to main product image or null"
}

Rules:
- Use Portuguese (Portugal) for the description.
- If price is not found, set unit_price to null.
- specifications should be an object with technical specs as key-value pairs.
- If any field is not found, use empty string for strings and null for others.
- Be precise with the reference/model number.
- If the content is empty, infer what you can from the URL itself (domain, path).`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content_text = data.choices?.[0]?.message?.content || '';

  // Parse JSON from response
  let jsonStr = content_text;
  const codeBlockMatch = content_text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }

  const parsed = JSON.parse(jsonStr) as ProductData;

  // Ensure datasheet_url falls back to input URL
  parsed.datasheet_url = parsed.datasheet_url || url;

  return parsed;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch page content
    const { text: pageContent, status } = await fetchPageContent(validatedUrl.toString());

    let usedFallback = false;
    let extractionNote = '';

    if (status !== 200 || !pageContent) {
      usedFallback = true;
      extractionNote = `Page fetch returned status ${status}. Using URL-based inference.`;
    }

    // Extract with DeepSeek (always — even if page content is empty, DeepSeek can infer from URL)
    const productData = await extractWithDeepSeek(validatedUrl.toString(), pageContent);

    return new Response(
      JSON.stringify({
        success: true,
        data: productData,
        meta: {
          fetch_status: status,
          used_fallback: usedFallback,
          note: extractionNote,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Scrape error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
