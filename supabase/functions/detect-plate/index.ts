
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PLATE_RECOGNIZER_API_KEY = Deno.env.get("PLATE_RECOGNIZER_API_KEY") || "650360f1b7de5161ac79f9beba0260328b8b1046";

interface PlateRecognizerResponse {
  results: Array<{
    plate: string;
    region: {
      code: string;
      score: number;
    };
    score: number;
    vehicle: {
      type: string;
    };
  }>;
  error?: string;
}

interface VehicleInfo {
  plate?: string;
  vehicleType?: string;
  isValid: boolean;
  message: string;
}

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
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Processing image:", imageUrl);

    // Fetch the image content
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBlob = await imageResponse.blob();

    // Create form data for the API request
    const formData = new FormData();
    formData.append("upload", imageBlob, "image.jpg");

    // Call the Plate Recognizer API
    const apiResponse = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
      method: "POST",
      headers: {
        "Authorization": `Token ${PLATE_RECOGNIZER_API_KEY}`,
      },
      body: formData,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("API error:", errorText);
      throw new Error(`Plate recognition API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const data: PlateRecognizerResponse = await apiResponse.json();
    console.log("API response:", JSON.stringify(data));

    // Process the results
    let vehicleInfo: VehicleInfo;
    
    if (data.error) {
      vehicleInfo = { 
        isValid: false, 
        message: `API Error: ${data.error}` 
      };
    } else if (data.results && data.results.length > 0) {
      const bestMatch = data.results[0];
      
      // Mock vehicle verification (in a real app, you'd call a vehicle registration database API)
      const isValidPlate = bestMatch.score > 0.7; // Using confidence score as validity check
      
      vehicleInfo = {
        plate: bestMatch.plate,
        vehicleType: bestMatch.vehicle?.type || "Unknown",
        isValid: isValidPlate,
        message: isValidPlate ? 
          "Number plate verified successfully" : 
          "Number plate detected but not verified in database"
      };
    } else {
      vehicleInfo = {
        isValid: false,
        message: "No number plate detected in the image"
      };
    }

    return new Response(
      JSON.stringify(vehicleInfo),
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
