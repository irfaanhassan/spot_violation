
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// This Edge Function will process an image/video and detect traffic violations
// It's configured to be easily replaced with your ML API when ready

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

    // TODO: This is where you'll integrate your ML API
    // Call the API integration function which will be replaced with your actual API
    const results = await detectViolationsWithAPI(imageUrl || videoUrl, imageUrl ? "image" : "video");
    
    return new Response(
      JSON.stringify(results),
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

// This function will be replaced with your ML API integration
async function detectViolationsWithAPI(mediaUrl: string, mediaType: "image" | "video") {
  try {
    // PLACEHOLDER: Replace this with your actual API call
    // For example:
    // const response = await fetch('https://your-ml-api.com/detect', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ mediaUrl, mediaType })
    // });
    // const data = await response.json();
    
    // For now, use the simulation function
    const detectedViolations = simulateViolationDetection(mediaType);
    const confidence = detectedViolations.length > 0 ? 0.85 : 0;
    
    return {
      detectedViolations,
      confidence,
      shouldAutoVerify: confidence > 0.8, // Changed to 0.8 for easier testing
      message: detectedViolations.length > 0 ? "Violations detected" : "No violations detected"
    };
  } catch (error) {
    console.error("API detection error:", error);
    return {
      detectedViolations: [],
      confidence: 0,
      shouldAutoVerify: false,
      message: "Error processing detection"
    };
  }
}

// Mock detection function - replace with your actual ML model
function simulateViolationDetection(mediaType: "image" | "video") {
  // This function simulates ML detection with random results
  // You'll replace this with your actual ML API integration
  
  const possibleViolations = [
    "Triple Riding", 
    "No Helmet", 
    "Wrong Side", 
    "Signal Jump",
    "Overloading",
    "Others"
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
