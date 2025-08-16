import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question } = await req.json()
    
    console.log('Flowise Edge Function called with question:', question)

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call Flowise RAG endpoint
    const flowiseResponse = await fetch(
      'https://srv938896.hstgr.cloud/api/v1/prediction/d800a991-bf6d-4c73-aa66-b71413aff520',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          temperature: 0.1,
          topK: 3
        }),
      }
    )

    console.log('Flowise response status:', flowiseResponse.status)

    if (!flowiseResponse.ok) {
      const errorText = await flowiseResponse.text()
      console.error('Flowise API error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `Flowise API error: ${flowiseResponse.status}`,
          details: errorText 
        }),
        { 
          status: flowiseResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await flowiseResponse.json()
    console.log('Flowise response data:', data)

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})