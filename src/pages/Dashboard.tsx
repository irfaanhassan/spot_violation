
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Plus, MapPin, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportDetail } from "@/components/ReportDetail";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [votesCounts, setVotesCounts] = useState<Record<string, {upvotes: number, downvotes: number}>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const reportsPerPage = 5;

  useEffect(() => {
    fetchReports();
  }, [activeTab, page]);
  
  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Prepare filter based on active tab
      let query = supabase.from('reports').select('*', { count: 'exact' });
      
      if (activeTab === "pending") {
        query = query.eq('status', 'pending');
      } else if (activeTab === "verified") {
        query = query.in('status', ['verified', 'verified_by_community', 'approved_by_admin']);
      } else if (activeTab === "rejected") {
        query = query.in('status', ['rejected', 'invalid_plate']);
      }
      
      // Add pagination
      query = query
        .order('created_at', { ascending: false })
        .range((page - 1) * reportsPerPage, page * reportsPerPage - 1);
      
      const { data, count, error } = await query;
      
      if (error) throw error;
      
      setReports(data || []);
      setTotalPages(Math.ceil((count || 0) / reportsPerPage));
      
      // Fetch votes counts for each report
      if (data && data.length > 0) {
        await fetchVotesCounts(data.map(r => r.id));
      }
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load reports"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchVotesCounts = async (reportIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('report_votes')
        .select('*')
        .in('report_id', reportIds);
      
      if (error) throw error;
      
      // Group votes by report_id and count upvotes/downvotes
      const votesMap: Record<string, {upvotes: number, downvotes: number}> = {};
      
      data?.forEach(vote => {
        if (!votesMap[vote.report_id]) {
          votesMap[vote.report_id] = { upvotes: 0, downvotes: 0 };
        }
        
        if (vote.vote_type === 'upvote') {
          votesMap[vote.report_id].upvotes += 1;
        } else {
          votesMap[vote.report_id].downvotes += 1;
        }
      });
      
      setVotesCounts(votesMap);
      
    } catch (error) {
      console.error("Error fetching votes:", error);
    }
  };
  
  const handleReportClick = (reportId: string) => {
    setSelectedReport(reportId === selectedReport ? null : reportId);
  };
  
  const handleStatusChange = (reportId: string, newStatus: string) => {
    // Update the report status locally
    setReports(prevReports => 
      prevReports.map(report => 
        report.id === reportId ? { ...report, status: newStatus } : report
      )
    );
    
    // Refresh reports after a status change
    fetchReports();
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'verified':
      case 'verified_by_community':
      case 'approved_by_admin':
        return 'success';
      case 'rejected':
      case 'invalid_plate':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="px-4 py-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Traffic Reports</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/app/wallet")} className="hidden md:flex">
            My Wallet
          </Button>
          <Button onClick={() => navigate("/app/report")}>
            <Plus className="h-5 w-5 mr-2" /> Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-pulse">Loading reports...</div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No reports found in this category</p>
            </div>
          ) : (
            <>
              {reports.map(report => (
                <div key={report.id} className="space-y-4">
                  <Card className={`overflow-hidden cursor-pointer ${selectedReport === report.id ? 'ring ring-primary' : ''}`}
                        onClick={() => handleReportClick(report.id)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{report.violation_type}</h3>
                            <Badge variant={getStatusBadgeVariant(report.status)}>
                              {report.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="line-clamp-1">{report.location}</span>
                          </div>
                        </div>
                        
                        {/* Vote counts */}
                        {votesCounts[report.id] && (
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <ThumbsUp className="h-4 w-4 mr-1 text-green-500" />
                              <span className="text-sm">{votesCounts[report.id].upvotes}</span>
                            </div>
                            <div className="flex items-center">
                              <ThumbsDown className="h-4 w-4 mr-1 text-red-500" />
                              <span className="text-sm">{votesCounts[report.id].downvotes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="px-4 py-2 bg-muted/30 flex justify-between">
                      <div className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                      {report.number_plate && (
                        <div className="text-xs font-medium">
                          Plate: {report.number_plate}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                  
                  {/* We're showing the ReportDetail outside the component to avoid the Dialog nesting issue */}
                  {selectedReport === report.id && (
                    <ReportDetail 
                      reportId={report.id}
                      onClose={() => setSelectedReport(null)}
                    />
                  )}
                </div>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(page - 1)}>
                          Previous
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                          isActive={page === index + 1}
                          onClick={() => setPage(index + 1)}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    {page < totalPages && (
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(page + 1)}>
                          Next
                        </PaginationLink>
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
