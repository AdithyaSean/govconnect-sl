
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, doc, updateDoc } from "firebase/firestore";
import type { Application } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Star, MoreHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Rating } from "@/components/rating";


export default function AppointmentsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppForRating, setSelectedAppForRating] = useState<Application | null>(null);
  const [selectedAppForDetails, setSelectedAppForDetails] = useState<Application | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchApplications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const q = query(collection(db, "applications"), where("userId", "==", user.id));
    
    try {
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Application))
        .filter(app => app.details?.appointmentDate);
      setApplications(apps);
    } catch (error) {
      console.error("Error fetching applications: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const { upcomingAppointments, pastAppointments, cancelledAppointments } = useMemo(() => {
    const now = new Date();
    const upcoming: Application[] = [];
    const past: Application[] = [];
    const cancelled: Application[] = [];

    applications.forEach(app => {
        const appDate = (app.details.appointmentDate as Timestamp).toDate();
        if (app.status === 'Rejected' || app.workerComment?.toLowerCase().includes('cancelled by citizen')) {
            cancelled.push(app);
        } else if (appDate > now && (app.status === 'Pending' || app.status === 'In Progress' || app.status === 'Approved')) {
            upcoming.push(app);
        } else {
            past.push(app);
        }
    });
    return { upcomingAppointments: upcoming, pastAppointments: past, cancelledAppointments: cancelled };
  }, [applications]);


  const handleCancelAppointment = async (appId: string) => {
    try {
      const appRef = doc(db, "applications", appId);
      await updateDoc(appRef, { status: 'Rejected', workerComment: 'Appointment cancelled by citizen.' });
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been successfully cancelled.",
      });
      fetchApplications(); // Refresh list
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Cancellation Failed",
        description: "Could not cancel the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Please select a rating.", variant: "destructive" });
      return;
    }
    if (!selectedAppForRating) return;

    setIsSubmitting(true);
    try {
      const appRef = doc(db, "applications", selectedAppForRating.id);
      await updateDoc(appRef, {
        appointmentRating: rating,
        appointmentFeedback: feedback,
        status: 'Completed' // Mark as completed after rating
      });
      toast({
        title: "Feedback Submitted",
        description: "Thank you for rating your appointment!",
      });
      setSelectedAppForRating(null);
      setRating(0);
      setFeedback("");
      fetchApplications(); // Refresh list
    } catch (error) {
      toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (date: Timestamp | string | undefined) => {
    if (!date) return 'N/A';
    if (date instanceof Timestamp) return date.toDate().toLocaleString();
    if (typeof date === 'string') return new Date(date).toLocaleString();
    return 'Invalid Date';
  };

  return (
    <>
      <DashboardLayout>
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled appointments for government services.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={4}><Skeleton className="h-8" /></TableCell></TableRow>
                   : upcomingAppointments.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">No upcoming appointments.</TableCell></TableRow>
                   : upcomingAppointments.map(app => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.service}</TableCell>
                        <TableCell>{formatDate(app.details.appointmentDate)}</TableCell>
                        <TableCell><Badge variant="secondary">{app.status}</Badge></TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedAppForDetails(app)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleCancelAppointment(app.id)}>Cancel</Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Past Appointments</CardTitle>
              <CardDescription>Review your past appointments and provide feedback.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={4}><Skeleton className="h-8" /></TableCell></TableRow>
                   : pastAppointments.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">No past appointments.</TableCell></TableRow>
                   : pastAppointments.map(app => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.service}</TableCell>
                        <TableCell>{formatDate(app.details.appointmentDate)}</TableCell>
                        <TableCell>
                            <Badge className={app.status === 'Completed' || app.status === 'Approved' ? 'bg-green-600' : ''}>
                                {app.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedAppForDetails(app)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          {app.appointmentRating ? (
                            <Rating rating={app.appointmentRating} />
                          ) : ( app.status !== 'Rejected' &&
                             <Button variant="outline" size="sm" onClick={() => setSelectedAppForRating(app)}>Rate Now</Button>
                          )}
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Cancelled / Rejected Appointments</CardTitle>
              <CardDescription>Appointments that were either cancelled by you or rejected by the service.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Original Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={4}><Skeleton className="h-8" /></TableCell></TableRow>
                   : cancelledAppointments.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">No cancelled appointments.</TableCell></TableRow>
                   : cancelledAppointments.map(app => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.service}</TableCell>
                        <TableCell>{formatDate(app.details.appointmentDate)}</TableCell>
                        <TableCell>
                            <Badge variant="destructive">{app.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedAppForDetails(app)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      {/* Rating Dialog */}
      <Dialog open={!!selectedAppForRating} onOpenChange={(isOpen) => !isOpen && setSelectedAppForRating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Appointment</DialogTitle>
            <DialogDescription>
              Your feedback for '{selectedAppForRating?.service}' helps us improve our services.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`h-8 w-8 cursor-pointer ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell us about your experience..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAppForRating(null)}>Cancel</Button>
            <Button onClick={handleRatingSubmit} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Feedback"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Details Dialog */}
      <Dialog open={!!selectedAppForDetails} onOpenChange={(isOpen) => !isOpen && setSelectedAppForDetails(null)}>
        <DialogContent>
            {selectedAppForDetails && (
                 <>
                    <DialogHeader>
                        <DialogTitle>Appointment Details</DialogTitle>
                        <DialogDescription>
                            Viewing details for application #{selectedAppForDetails.id}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                           <Label className="text-muted-foreground">Service:</Label>
                           <p className="col-span-2 font-medium">{selectedAppForDetails.service}</p>
                        </div>
                         <div className="grid grid-cols-3 gap-2">
                           <Label className="text-muted-foreground">Appointment Date:</Label>
                           <p className="col-span-2 font-medium">{formatDate(selectedAppForDetails.details?.appointmentDate)}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <Label className="text-muted-foreground">Status:</Label>
                            <div className="col-span-2">
                                <Badge variant={
                                    selectedAppForDetails.status === 'Approved' || selectedAppForDetails.status === 'Completed' ? 'default'
                                    : selectedAppForDetails.status === 'In Review' || selectedAppForDetails.status === 'In Progress' ? 'secondary'
                                    : selectedAppForDetails.status === 'Pending Payment' ? 'outline'
                                    : 'destructive'
                                }
                                className={
                                    selectedAppForDetails.status === 'Approved' || selectedAppForDetails.status === 'Completed' ? 'bg-green-600' : ''
                                }
                                >{selectedAppForDetails.status}</Badge>
                           </div>
                        </div>
                        {selectedAppForDetails.workerComment && (
                           <div className="grid grid-cols-3 gap-2 items-start">
                               <Label className="text-muted-foreground">Latest Comment:</Label>
                               <div className="col-span-2 bg-muted p-3 rounded-md">
                                  <p className="font-medium whitespace-pre-wrap">{selectedAppForDetails.workerComment}</p>
                               </div>
                           </div>
                        )}
                         {selectedAppForDetails.appointmentRating && (
                           <div className="grid grid-cols-3 gap-2 items-start">
                               <Label className="text-muted-foreground">Your Rating:</Label>
                               <div className="col-span-2">
                                  <Rating rating={selectedAppForDetails.appointmentRating} />
                               </div>
                           </div>
                        )}
                        {selectedAppForDetails.appointmentFeedback && (
                           <div className="grid grid-cols-3 gap-2 items-start">
                               <Label className="text-muted-foreground">Your Feedback:</Label>
                               <div className="col-span-2 bg-muted p-3 rounded-md">
                                  <p className="font-medium whitespace-pre-wrap">{selectedAppForDetails.appointmentFeedback}</p>
                               </div>
                           </div>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                 </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}

    