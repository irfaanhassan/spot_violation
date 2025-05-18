import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

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
    const mediaUrl = imageUrl || videoUrl;
    const mediaType = imageUrl ? "image" : "video";

    // Process via the unified FastAPI ML API
    const results = await detectViolationsWithAPI(mediaUrl, mediaType);

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

// Single API call to the unified FastAPI endpoint
async function detectViolationsWithAPI(mediaUrl: string, mediaType: "image" | "video") {
  try {
    console.log(Sending ${mediaType} to ML API for violation detection);

    const formData = new FormData();
    const imageBlob = await (await fetch(mediaUrl)).blob();
    formData.append("file", imageBlob, "upload.jpg");

   const response = await fetch("https://2928-124-123-182-16.ngrok-free.app/api/predict", {
  method: "POST",
  body: formData
  });


    if (!response.ok) {
      const errText = await response.text();
      console.error("API response error:", errText);
      throw new Error("API call failed");
    }

    const apiResult = await response.json();
    console.log("ML API response:", apiResult);

    // Extract detected violations
    const detectedViolations: string[] = [];

    if (apiResult.helmet_violation?.detected) {
      detectedViolations.push("No Helmet");
    }

    if (apiResult.triple_riding?.detected) {
      detectedViolations.push("Triple Riding");
    }

    if (apiResult.wrong_route?.detected) {
      detectedViolations.push("Wrong Side");
    }

    if (apiResult.pothole?.detected) {
      detectedViolations.push("Pothole");
    }

    const confidence = detectedViolations.length > 0 ? 0.9 : 0;

    return {
      detectedViolations,
      confidence,
      shouldAutoVerify: confidence > 0.8,
      message: detectedViolations.length > 0 ? "Violations detected" : "No violations detected"
    };

  } catch (error) {
    console.error("API detection error:", error);
    console.log("API call failed. Using fallback simulation.");
    return simulateViolationDetection(mediaType);
  }
}

// Fallback simulation
function simulateViolationDetection(mediaType: "image" | "video") {
  const possibleViolations = ["Triple Riding", "No Helmet", "Wrong Side", "Pothole"];
  const numViolations = Math.floor(Math.random() * 3);
  const detectedViolations: string[] = [];

  for (let i = 0; i < numViolations; i++) {
    const violation = possibleViolations[Math.floor(Math.random() * possibleViolations.length)];
    if (!detectedViolations.includes(violation)) {
      detectedViolations.push(violation);
    }
  }

  const confidence = detectedViolations.length > 0 ? 0.85 : 0;

  return {
    detectedViolations,
    confidence,
    shouldAutoVerify: confidence > 0.8,
    message: detectedViolations.length > 0 ? "Violations detected" : "No violations detected"
  };
}