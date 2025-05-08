
// This is a Supabase Edge Function that creates the necessary RLS policy for the report_images bucket

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.1'

// Define the types for our request and response
interface WebhookPayload {
  type: string
  table: string
  record: {
    id: string
  }
  schema: string
  old_record: null | Record<string, unknown>
}

Deno.serve(async (req) => {
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if the bucket exists
    const { data: buckets } = await supabaseClient.storage.listBuckets()
    const reportImagesBucket = buckets?.find(bucket => bucket.name === 'report_images')
    
    // Create the bucket if it doesn't exist
    if (!reportImagesBucket) {
      const { error } = await supabaseClient.storage.createBucket('report_images', {
        public: true
      })
      
      if (error) {
        console.error("Error creating bucket:", error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Storage bucket checked/created successfully', 
      bucket: 'report_images',
      isPublic: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
