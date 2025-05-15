import { useState, useEffect } from "react";
import { AlertTriangle, MapPin, Calendar, Info, Award, Car, Video } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoteButtons } from "@/components/VoteButtons";
import { supabase } from "@/integrations/supabase/client";
import { Constants } from "@/integrations/supabase/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ReportDetailProps {
  reportId: string;
  onStatusChange?: (newStatus: string) => void;
}

// Define a type for the report that includes media_type
interface ReportWithMediaType {
  id: string;
  created_at: string;
  user_id: string;
  violation_type: string;
  description: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  number_plate: string | null;
  status: string;
  points: number;
  updated_at: string;
  media_type?: 'image' | 'video'; // Add this as optional
}

export function ReportDetail({ reportId, onStatusChange }: ReportDetailProps) {
  const [report, setReport] = useState<ReportWithMediaType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [isPlateDetecting, setIsPlateDetecting] = useState(false);
  
  const { user } = useAuth();
  
  // Fetch the report details
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single();
          
        if (error) {
          throw error;
        }
        
        setReport(data as ReportWithMediaType);
        
        // If the report has an image, try to detect the number plate
        // Only try to detect if it's an image type (or if media_type is undefined, assume it's an image for backward compatibility)
        if (data.image_url && 
           (!data.media_type || data.media_type === 'image') && 
           !data.number_plate && 
           data.status === 'pending') {
          detectNumberPlate(data.image_url);
        }
        
      } catch (err: any) {
        setError(err.message);
        toast.error("Failed to load report details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [reportId]);
  
  // Fetch votes for this report
  useEffect(() => {
    const fetchVotes = async () => {
      try {
        // Get all votes for this report
        const { data: votesData, error: votesError } = await supabase
          .from('report_votes')
          .select('*')
          .eq('report_id', reportId);
          
        if (votesError) {
          throw votesError;
        }
        
        // Count upvotes and downvotes
        const upvoteCount = votesData.filter(vote => vote.vote_type === 'upvote').length;
        const downvoteCount = votesData.filter(vote => vote.vote_type === 'downvote').length;
        
        setUpvotes(upvoteCount);
        setDownvotes(downvoteCount);
        
        // Check if current user has voted
        if (user) {
          const userVoteObj = votesData.find(vote => vote.user_id === user.id);
          if (userVoteObj) {
            setUserVote(userVoteObj.vote_type as 'upvote' | 'downvote');
          }
        }
        
      } catch (err: any) {
        console.error("Error fetching votes:", err);
      }
    };
    
    if (reportId) {
      fetchVotes();
    }
  }, [reportId, user]);
  
  const detectNumberPlate = async (imageUrl: string) => {
    try {
      setIsPlateDetecting(true);
      
      // Call the edge function to detect the plate
      const { data, error } = await supabase.functions.invoke('detect-plate', {
        body: { imageUrl }
      });
      
      if (error) {
        throw error;
      }
      
      setVehicleInfo(data);
      
      // If plate was detected successfully, update the report
      if (data.isValid && data.plate) {
        const { error: updateError } = await supabase
          .from('reports')
          .update({ 
            number_plate: data.plate 
          })
          .eq('id', reportId);
          
        if (updateError) {
          throw updateError;
        }
        
        // Update local state
        setReport(prev => ({
          ...prev,
          number_plate: data.plate
        }));
        
        toast.success("Number plate detected successfully");
      } else if (!data.isValid) {
        // If plate is invalid, update report status
        const { error: updateStatusError } = await supabase
          .from('reports')
          .update({ 
            status: 'invalid_plate' 
          })
          .eq('id', reportId);
          
        if (updateStatusError) {
          throw updateStatusError;
        }
        
        // Update local state
        setReport(prev => ({
          ...prev,
          status: 'invalid_plate'
        }));
        
        // Notify parent component about status change
        if (onStatusChange) {
          onStatusChange('invalid_plate');
        }
        
        toast.error("Invalid number plate detected");
      }
      
    } catch (err: any) {
      console.error("Error detecting number plate:", err);
      toast.error("Failed to detect number plate");
    } finally {
      setIsPlateDetecting(false);
    }
  };
  
  // Handle vote changes
  const handleVoteChange = async () => {
    // Refetch report to get updated status
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (error) {
        throw error;
      }
      
      // If status changed, update local state
      if (data.status !== report.status) {
        setReport(prev => ({
          ...prev,
          status: data.status
        }));
        
        // Notify parent component about status change
        if (onStatusChange) {
          onStatusChange(data.status);
        }
        
        // Show appropriate toast based on new status
        if (data.status === 'verified_by_community') {
          toast.success("Report has been verified by the community");
        } else if (data.status === 'rejected') {
          toast.error("Report has been rejected by the community");
        }
      }
      
    } catch (err: any) {
      console.error("Error refetching report:", err);
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center">Loading report details...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }
  
  if (!report) {
    return <div className="p-4 text-center">Report not found</div>;
  }
  
  // Format report data for display
  const formattedDate = new Date(report.created_at).toLocaleDateString();
  
  // Determine if this is a video or image (default to image if not specified)
  const isVideo = report.media_type === 'video';
  
  return (
    <Card className="overflow-hidden">
      {report.image_url && (
        <div className="relative">
          {isVideo ? (
            <video 
              controls
              className="w-full h-48 object-cover"
            >
              <source src={report.image_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img 
              src={report.image_url} 
              alt="Violation evidence" 
              className="w-full h-48 object-cover" 
            />
          )}
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex justify-between items-center">
              <Badge variant={
                report.status === 'verified' || report.status === 'verified_by_community' || report.status === 'approved_by_admin' ? 'success' :
                report.status === 'rejected' || report.status === 'invalid_plate' ? 'destructive' :
                'default'
              }>
                {report.status.replace(/_/g, ' ')}
              </Badge>
              
              <div className="flex items-center gap-2">
                {isVideo && (
                  <Video className="h-4 w-4 text-white" />
                )}
                
                <VoteButtons
                  reportId={reportId}
                  initialUpvotes={upvotes}
                  initialDownvotes={downvotes}
                  userVote={userVote}
                  onVoteChange={handleVoteChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{report.violation_type}</h3>
          
          <div className="flex items-center text-sm text-muted-foreground gap-1">
            <MapPin className="h-4 w-4" />
            <span>{report.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        {report.description && (
          <div>
            <h4 className="text-sm font-medium flex items-center gap-1 mb-1">
              <Info className="h-4 w-4" /> Additional Details
            </h4>
            <p className="text-sm text-muted-foreground">{report.description}</p>
          </div>
        )}
        
        {/* Number Plate Information */}
        <div className="border rounded-md p-3 bg-muted/30">
          <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
            <Car className="h-4 w-4" /> Vehicle Information
          </h4>
          
          {isPlateDetecting ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-pulse text-sm">Detecting number plate...</div>
            </div>
          ) : report.number_plate ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Number Plate:</span>
                <span className="text-sm font-medium">{report.number_plate} ✅</span>
              </div>
              
              {vehicleInfo && vehicleInfo.vehicleType && (
                <div className="flex justify-between">
                  <span className="text-sm">Vehicle Type:</span>
                  <span className="text-sm font-medium">{vehicleInfo.vehicleType}</span>
                </div>
              )}
            </div>
          ) : report.status === 'invalid_plate' ? (
            <div className="text-sm text-red-500">Invalid or no plate detected</div>
          ) : isVideo ? (
            <div className="text-sm text-muted-foreground">Number plate detection not available for videos</div>
          ) : (
            <div className="text-sm text-muted-foreground">No plate information available</div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 bg-muted/40 flex justify-between items-center">
        <div className="flex items-center text-sm">
          <Award className="h-4 w-4 mr-1 text-yellow-500" />
          <span>{report.points} points</span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          ID: {reportId.slice(0, 8)}...
        </div>
      </CardFooter>
    </Card>
  );
}
