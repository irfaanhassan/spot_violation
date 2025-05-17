import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Camera, MapPin, Upload, Video, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Constants } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";

// Get violation types from Supabase types
const violationTypes = Constants.public.Enums.violation_type;

// Define a type for violationType based on the available options
type ViolationType = typeof violationTypes[number];

// Define media type
type MediaType = "image" | "video";

// Declare Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: any) => any;
        Marker: new (options: any) => any;
        Geocoder: new () => any;
      }
    }
  }
}

const Report = () => {
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [media, setMedia] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [location, setLocation] = useState("Getting your location...");
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [violationType, setViolationType] = useState<ViolationType>("No Helmet");
  const [description, setDescription] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // New states for ML detection
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedViolations, setDetectedViolations] = useState<string[]>([]);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  
  // New state for subscription
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // New state for auto-verification
  const [autoVerifyEnabled, setAutoVerifyEnabled] = useState(true);
  const [highConfidenceDetection, setHighConfidenceDetection] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      // Check if the script is already loaded
      if (window.google?.maps) {
        setMapLoaded(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAJZwzmilDdDMv0ogSAEBxPsJxcJMMNz-4&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Google Maps loaded successfully");
        setMapLoaded(true);
      };
      script.onerror = (error) => {
        console.error("Error loading Google Maps:", error);
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();

    return () => {
      // Clean up script if component unmounts before script loads
      const script = document.querySelector('script[src*="maps.googleapis.com"]');
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Get user's location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Got coordinates:", latitude, longitude);
          setCoordinates({ lat: latitude, lng: longitude });
          
          // If Google Maps is loaded, reverse geocode the coordinates
          if (mapLoaded && window.google) {
            const geocoder = new window.google.maps.Geocoder();
            const latlng = { lat: latitude, lng: longitude };
            
            geocoder.geocode({ location: latlng }, (results, status) => {
              if (status === "OK" && results?.[0]) {
                setLocation(results[0].formatted_address);
              } else {
                setLocation(`Current Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
              }
            });
          } else {
            setLocation(`Current Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation("Location not available");
        }
      );
    } else {
      setLocation("Geolocation not supported by this browser");
    }
  }, [mapLoaded]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      
      // Check if the file is a video or an image
      const fileType = file.type.split('/')[0];
      setMediaType(fileType as MediaType);
      
      if (fileType === "video") {
        // Create a URL for the video file
        const videoURL = URL.createObjectURL(file);
        setMedia(videoURL);
        
        // Load video metadata to show preview
        if (videoRef.current) {
          videoRef.current.src = videoURL;
          videoRef.current.load();
        }
      } else if (fileType === "image") {
        // Create a URL for the image file
        const reader = new FileReader();
        reader.onload = () => {
          setMedia(reader.result as string);
          
          // If auto-detect is enabled, run violation detection after image is loaded
          if (autoDetectEnabled) {
            detectViolations(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCaptureMedia = () => {
    document.getElementById("media-upload")?.click();
  };
  
  // New function to detect violations using ML model
  const detectViolations = async (imageUrl?: string) => {
    if (!media && !imageUrl) {
      toast({
        title: "Error",
        description: "Please upload an image or video first",
        variant: "destructive",
      });
      return;
    }
    
    setIsDetecting(true);
    setDetectedViolations([]);
    setHighConfidenceDetection(false);
    
    try {
      // First upload the file to get a public URL if we don't have one
      let mediaUrl = imageUrl;
      
      if (!mediaUrl && mediaFile && user) {
        // Create a temporary file name
        const fileName = `${user.id}/temp-${Date.now()}-${mediaFile.name}`;
        
        // Upload file to bucket temporarily to analyze it
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('report_images')
          .upload(fileName, mediaFile, {
            upsert: true,
            cacheControl: '3600'
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL for the uploaded media
        const { data: publicUrlData } = supabase.storage
          .from('report_images')
          .getPublicUrl(fileName);
          
        mediaUrl = publicUrlData.publicUrl;
      }
      
      if (!mediaUrl) {
        throw new Error("Could not get media URL");
      }
      
      // Call the edge function to detect violations
      const { data, error } = await supabase.functions.invoke('detect-violations', {
        body: {
          imageUrl: mediaType === 'image' ? mediaUrl : null,
          videoUrl: mediaType === 'video' ? mediaUrl : null,
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update the UI with detection results
      if (data.detectedViolations && Array.isArray(data.detectedViolations)) {
        setDetectedViolations(data.detectedViolations);
        setDetectionConfidence(data.confidence || 0);
        setHighConfidenceDetection(data.shouldAutoVerify || false);
        
        // If violations detected, update the form
        if (data.detectedViolations.length > 0 && data.detectedViolations.includes(violationType)) {
          // Set the first detected violation as the selected type
          setViolationType(data.detectedViolations[0] as ViolationType);
        }
      }
      
      toast({
        title: data.detectedViolations.length > 0 ? "Violations Detected!" : "No Violations Detected",
        description: data.message,
      });
      
    } catch (error: any) {
      console.error("Error detecting violations:", error);
      toast({
        variant: "destructive",
        title: "Detection Failed",
        description: error.message || "Could not process the image/video",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Add new useEffect to check subscription status
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_subscribed')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setIsSubscribed(data.is_subscribed || false);
      } catch (error) {
        console.error("Error checking subscription status:", error);
      }
    };
    
    checkSubscriptionStatus();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a report",
      });
      return;
    }
    
    setUploading(true);
    
    try {
      let mediaUrl = null;
      
      // Upload image or video if available
      if (mediaFile) {
        // Create a folder with user ID to organize uploads and satisfy RLS policy
        const fileName = `${user.id}/${Date.now()}-${mediaFile.name}`;
        
        console.log("Uploading to path:", fileName);
        
        // Upload file to bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('report_images')
          .upload(fileName, mediaFile, {
            upsert: true,
            cacheControl: '3600'
          });
          
        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }
        
        console.log("Upload successful:", uploadData);
        
        // Get public URL for the uploaded media
        const { data: publicUrlData } = supabase.storage
          .from('report_images')
          .getPublicUrl(fileName);
          
        mediaUrl = publicUrlData.publicUrl;
        console.log("Media URL:", mediaUrl);
      }

      // Generate a random challan amount between 500 and 5000 for demo purposes
      // In a real application, this would be based on the violation type
      const randomChallanAmount = Math.floor(Math.random() * 4500) + 500;
      
      // Determine if the report should be auto-verified based on ML confidence
      const initialStatus = autoVerifyEnabled && highConfidenceDetection ? 'verified' : 'pending';
      
      // Insert report data into the database - removed media_type field
      const { data: reportData, error: insertError } = await supabase.from('reports').insert({
        user_id: user.id,
        violation_type: violationType,
        description,
        number_plate: numberPlate,
        location: location,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
        image_url: mediaUrl,
        ml_detected: detectedViolations.length > 0,
        ml_confidence: detectionConfidence,
        ml_violations: detectedViolations.length > 0 ? detectedViolations : null,
        challan_amount: randomChallanAmount,
        status: initialStatus,
        // If auto-verified by ML, add points
        points: initialStatus === 'verified' ? 10 : 0
      }).select();
      
      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
      
      if (reportData && reportData.length > 0) {
        // Create a challan payment record for the report
        await supabase.from('challan_payments').insert({
          report_id: reportData[0].id,
          amount: randomChallanAmount,
          status: 'pending'
        });
      }
      
      let toastMessage = "Report submitted successfully!";
      if (autoVerifyEnabled && highConfidenceDetection) {
        toastMessage += " Our AI has automatically verified this violation with high confidence!";
      } else {
        toastMessage += isSubscribed ? 
          " You'll be notified when it's verified and earn rewards when the challan is paid." : 
          " You'll be notified when it's reviewed.";
      }
      
      toast({
        title: "Report submitted",
        description: toastMessage,
      });
      
      navigate("/app");
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast({
        variant: "destructive",
        title: "Error submitting report",
        description: error.message || "Something went wrong",
      });
    } finally {
      setUploading(false);
    }
  };

  // Generate a mini map preview component
  const MapPreview = () => {
    if (!coordinates || !mapLoaded) {
      return (
        <div className="flex items-center p-3 bg-muted rounded-lg">
          <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
          <span className="text-sm">{location}</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="h-32 w-full bg-muted rounded-lg overflow-hidden" id="map-preview">
          {/* The map will be rendered here by Google Maps */}
        </div>
        <div className="flex items-center p-2 bg-muted/50 rounded-lg">
          <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-xs">{location}</span>
        </div>
      </div>
    );
  };

  // Init map when coordinates and Google Maps are available
  useEffect(() => {
    if (coordinates && mapLoaded && window.google) {
      const mapElement = document.getElementById('map-preview');
      if (mapElement) {
        try {
          const map = new window.google.maps.Map(mapElement, {
            center: coordinates,
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
          });
          
          new window.google.maps.Marker({
            position: coordinates,
            map,
          });
          
          console.log("Map initialized successfully");
        } catch (error) {
          console.error("Error initializing map:", error);
        }
      } else {
        console.warn("Map element not found in DOM");
      }
    }
  }, [coordinates, mapLoaded, step]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any created object URLs
      if (media && mediaType === "video") {
        URL.revokeObjectURL(media);
      }
    };
  }, [media, mediaType]);

  return (
    <div className="px-4 py-6 pb-20">
      <div className="flex items-center mb-6">
        {step === 2 && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => setStep(1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">Report Violation</h1>
      </div>

      {!isSubscribed && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Lock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-800">Subscribe to earn rewards</h3>
              <p className="text-sm text-blue-700 mb-2">
                Subscribe to earn 10% of the challan amount when your reports get verified and paid.
              </p>
              <Button asChild size="sm" variant="outline" className="bg-white">
                <Link to="/app/subscription">View Subscription Plans</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              Start by taking a photo/video or uploading evidence of the traffic violation
            </p>
            
            {media ? (
              <div className="relative mb-4">
                {mediaType === "image" ? (
                  <img 
                    src={media} 
                    alt="Violation evidence" 
                    className="w-full h-64 object-cover rounded-lg" 
                  />
                ) : (
                  <video 
                    ref={videoRef}
                    controls
                    className="w-full h-64 object-cover rounded-lg" 
                  >
                    <source src={media} type={mediaFile?.type} />
                    Your browser does not support the video tag.
                  </video>
                )}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  {mediaType === "image" && !isDetecting && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-background"
                      onClick={() => detectViolations()}
                      disabled={isDetecting}
                    >
                      {isDetecting ? "Detecting..." : "Detect Violations"}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-background"
                    onClick={() => {
                      setMedia(null);
                      setMediaFile(null);
                      setDetectedViolations([]);
                      if (mediaType === "video" && media) {
                        URL.revokeObjectURL(media);
                      }
                    }}
                  >
                    Retake
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-6 border-2 border-dashed border-muted rounded-lg p-12 text-center">
                <div className="flex flex-col items-center">
                  <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Upload photo or video evidence</p>
                  
                  <div className="flex gap-4">
                    <Button onClick={handleCaptureMedia}>
                      <Camera className="h-4 w-4 mr-2" /> Capture
                    </Button>
                    <Button variant="outline" onClick={handleCaptureMedia}>
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-4">
                    Supports images and videos up to 25MB
                  </p>
                  
                  <input 
                    id="media-upload" 
                    type="file" 
                    accept="image/*,video/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ML Detection Results */}
          {detectedViolations.length > 0 && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium">AI Detection Results</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Our AI model detected the following violations:
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedViolations.map((violation, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    {violation}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Detection confidence: {Math.round(detectionConfidence * 100)}%
                {highConfidenceDetection && (
                  <span className="text-green-600 ml-2">
                    (High confidence - will be automatically verified)
                  </span>
                )}
              </p>
            </div>
          )}
          
          {isDetecting && (
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-center">
              <div className="mr-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-sm">Analyzing image with AI model...</p>
            </div>
          )}

          <MapPreview />

          <Button 
            className="w-full" 
            size="lg" 
            disabled={!media}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="violation-type">Violation Type</Label>
              <Select 
                value={violationType} 
                onValueChange={(value) => setViolationType(value as typeof violationTypes[number])}
                required
              >
                <SelectTrigger id="violation-type">
                  <SelectValue placeholder="Select violation type" />
                </SelectTrigger>
                <SelectContent>
                  {violationTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {detectedViolations.length > 0 && detectedViolations.includes(violationType) && (
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> 
                  AI verified this violation type
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number-plate">Vehicle Number Plate</Label>
              <Input
                id="number-plate"
                placeholder="Enter vehicle number (e.g., KA01AB1234)"
                value={numberPlate}
                onChange={(e) => setNumberPlate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                AI-assisted number plate detection will run automatically
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Details (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Any additional details about the violation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            {isSubscribed && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-100 mt-2">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                  <p className="text-sm text-green-700">
                    You'll earn 10% of the challan amount when this report is verified and paid
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={uploading}>
            {uploading ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default Report;
