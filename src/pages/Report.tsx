
import { useState, useEffect } from "react";
import { ArrowLeft, Camera, MapPin, Upload } from "lucide-react";
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

// Get violation types from Supabase types
import { Constants } from "@/integrations/supabase/types";
const violationTypes = Constants.public.Enums.violation_type;

const Report = () => {
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [location, setLocation] = useState("Getting your location...");
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [violationType, setViolationType] = useState("");
  const [description, setDescription] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get user's location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });
          
          // Reverse geocoding to get address from coordinates (simplified)
          setLocation(`Current Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          
          // In a real app, you would use a geocoding service like Google Maps API
          // to convert these coordinates to a human-readable address
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation("Location not available");
        }
      );
    } else {
      setLocation("Geolocation not supported by this browser");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapturePhoto = () => {
    document.getElementById("photo-upload")?.click();
  };

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
      let imageUrl = null;
      
      // Upload image if available
      if (photoFile) {
        const fileName = `${user.id}/${Date.now()}-${photoFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('report_images')
          .upload(fileName, photoFile);
          
        if (uploadError) throw uploadError;
        
        // Get public URL for the uploaded image
        const { data: publicUrlData } = supabase.storage
          .from('report_images')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrlData.publicUrl;
      }
      
      // Insert report data into the database
      const { error: insertError } = await supabase.from('reports').insert({
        user_id: user.id,
        violation_type: violationType,
        description,
        number_plate: numberPlate,
        location: location,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
        image_url: imageUrl,
        // Status and points will use default values
      });
      
      if (insertError) throw insertError;
      
      toast({
        title: "Report submitted successfully!",
        description: "You'll be notified when it's reviewed.",
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

      {step === 1 ? (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              Start by taking a photo or uploading evidence of the traffic violation
            </p>
            
            {photo ? (
              <div className="relative mb-4">
                <img 
                  src={photo} 
                  alt="Violation evidence" 
                  className="w-full h-64 object-cover rounded-lg" 
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute bottom-3 right-3 bg-background"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoFile(null);
                  }}
                >
                  Retake
                </Button>
              </div>
            ) : (
              <div className="mb-6 border-2 border-dashed border-muted rounded-lg p-12 text-center">
                <div className="flex flex-col items-center">
                  <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Take a photo or upload from gallery</p>
                  
                  <div className="flex gap-4">
                    <Button onClick={handleCapturePhoto}>
                      <Camera className="h-4 w-4 mr-2" /> Capture
                    </Button>
                    <Button variant="outline" onClick={handleCapturePhoto}>
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                  
                  <input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center p-3 bg-muted rounded-lg">
            <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
            <span className="text-sm">{location}</span>
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            disabled={!photo}
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
                onValueChange={setViolationType}
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
                AI-assisted number plate detection coming soon
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
