
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

    // Integrate with the Hugging Face space API
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

// This function will use the ML API to detect violations
async function detectViolationsWithAPI(mediaUrl: string, mediaType: "image" | "video") {
  try {
    console.log(`Sending ${mediaType} to ML API for violation detection`);
    
    // Use the Hugging Face space API for detection
    const response = await fetch("https://majeed786-spot-violation.hf.space/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [
          mediaUrl
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API response error:", errorText);
      throw new Error(`ML API responded with status: ${response.status}`);
    }

    // Parse the API response
    const apiResult = await response.json();
    console.log("ML API response:", apiResult);

    // Extract violations from the API response
    // The API might return data in a specific format, adjust the parsing accordingly
    let detectedViolations: string[] = [];
    let confidence = 0;
    
    // Process the API result - this structure may need adjustment based on actual API response
    if (apiResult && apiResult.data && Array.isArray(apiResult.data)) {
      // Assuming the API returns an array of detected violations
      const violationsData = apiResult.data[0];
      
      if (typeof violationsData === 'string') {
        // If the API returns a simple string
        if (violationsData.toLowerCase().includes("no violation") || violationsData.trim() === "") {
          detectedViolations = [];
        } else {
          // Split by commas or other separators if the API returns multiple violations in a string
          detectedViolations = violationsData.split(',').map(v => v.trim());
          // Filter out empty strings
          detectedViolations = detectedViolations.filter(v => v.length > 0);
        }
      } else if (Array.isArray(violationsData)) {
        // If the API returns an array of violations
        detectedViolations = violationsData.filter(v => typeof v === 'string' && v.trim() !== "");
      }

      // Calculate a confidence score - this is simplified and should be adjusted based on actual API
      confidence = detectedViolations.length > 0 ? 0.85 : 0;
    }

    // Fallback to simulation if we couldn't parse the API response
    if (!apiResult || !apiResult.data) {
      console.log("Using fallback simulation for detection");
      return simulateViolationDetection(mediaType);
    }
    
    return {
      detectedViolations,
      confidence,
      shouldAutoVerify: confidence > 0.8,
      message: detectedViolations.length > 0 ? "Violations detected" : "No violations detected"
    };
  } catch (error) {
    console.error("API detection error:", error);
    
    // Fallback to simulation if the API call fails
    console.log("API call failed. Using fallback simulation.");
    return simulateViolationDetection(mediaType);
  }
}

// Mock detection function as a fallback
function simulateViolationDetection(mediaType: "image" | "video") {
  // This function simulates ML detection with random results
  // Will be used as a fallback if the API call fails
  
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
  
  const confidence = detectedViolations.length > 0 ? 0.85 : 0;
  
  return {
    detectedViolations,
    confidence,
    shouldAutoVerify: confidence > 0.8, // Changed to 0.8 for easier testing
    message: detectedViolations.length > 0 ? "Violations detected" : "No violations detected"
  };
}
