
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// This Edge Function will process an image/video and detect traffic violations
// It's currently set up as a placeholder for your ML model integration

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { 
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse the request body
    const { imageUrl, videoUrl } = await req.json();

    if (!imageUrl && !videoUrl) {
      return new Response(
        JSON.stringify({ error: "Media URL is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Processing media:", imageUrl || videoUrl);

    // TODO: This is where you would integrate your ML model
    // For now, we'll return mock detection results

    // Mock violation detection - replace with your actual ML model integration
    const detectedViolations = simulateViolationDetection(imageUrl ? "image" : "video");
    
    return new Response(
      JSON.stringify({
        detectedViolations,
        confidence: detectedViolations.length > 0 ? 0.85 : 0,
        message: detectedViolations.length > 0 ? "Violations detected" : "No violations detected"
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Function error:", error.message);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Mock detection function - replace with your actual ML model
function simulateViolationDetection(mediaType: "image" | "video") {
  // This function simulates ML detection with random results
  // You'll replace this with your actual ML model integration
  
  const possibleViolations = [
    "Triple Riding", 
    "No Helmet", 
    "Wrong Side", 
    "Signal Jumping"
  ];
  
  // For demo purposes: randomly detect 0-2 violations
  const numViolations = Math.floor(Math.random() * 3);
  const detectedViolations = [];
  
  for (let i = 0; i < numViolations; i++) {
    const randomIndex = Math.floor(Math.random() * possibleViolations.length);
    const violation = possibleViolations[randomIndex];
    
    // Avoid duplicates
    if (!detectedViolations.includes(violation)) {
      detectedViolations.push(violation);
    }
  }
  
  return detectedViolations;
}
