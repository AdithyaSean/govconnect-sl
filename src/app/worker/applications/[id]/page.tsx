
"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Check, Download, File, User, X, ArrowLeft } from "lucide-react";
import { useEffect, useState, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp, collection, addDoc, serverTimestamp, setDoc, query, where, getDocs, limit } from "firebase/firestore";
import type { Application, User as AppUser } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";


export default function WorkerApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from');

  const { toast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [applicant, setApplicant] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [targetStatus, setTargetStatus] = useState<Application['status'] | null>(null);
  

  const createNotification = async (userId: string, title: string, description: string, href: string) => {
    try {
        await addDoc(collection(db, "notifications"), {
            userId,
            title,
            description,
            href,
            icon: "CheckCircle",
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
  }

  useEffect(() => {
    const fetchApplication = async () => {
      if (id) {
        try {
          const appDoc = await getDoc(doc(db, "applications", id));
          if (appDoc.exists()) {
            const appData = { id: appDoc.id, ...appDoc.data() } as Application;
            setApplication(appData);
            
            if(appData.userId) {
                const userDoc = await getDoc(doc(db, "users", appData.userId));
                if (userDoc.exists()) {
                    setApplicant({ id: userDoc.id, ...userDoc.data() } as AppUser);
                }
            }
          }
        } catch (error) {
            console.error("Error fetching application data:", error);
        } finally {
            setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [id]);

  const openStatusUpdateDialog = (status: Application['status']) => {
    setTargetStatus(status);
    setComment(application?.workerComment || "");
    setIsStatusUpdateDialogOpen(true);
  }

  const handleStatusUpdate = async () => {
    if(!application || !targetStatus || !applicant) return;

    // --- Special logic for vehicle services ---
    if (targetStatus === 'Approved') {
        if (application.service === 'New Vehicle Registration') {
            const vehicleId = `${application.details.make}-${new Date().getTime()}`;
            await setDoc(doc(db, "vehicles", vehicleId), {
                id: vehicleId,
                type: application.details.vehicleType,
                licensePlate: application.details.licensePlate || `WP-${Math.random().toString().slice(2, 6)}`, // Use provided plate or generate random
                registrationDate: new Date().toLocaleDateString('en-CA'),
                chassisNumber: `CH-${new Date().getTime()}`,
                status: 'Active',
                insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-CA'),
                emissionTestExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-CA'),
                nic: applicant.nic, // Link to the applicant
            });
            toast({ title: "Vehicle Registered", description: "New vehicle has been added to the registry." });
        } else if (application.service === 'Vehicle Ownership Transfer') {
            // Find the new owner's user doc to get their ID
            const newOwnerQuery = query(collection(db, "users"), where("nic", "==", application.details.newOwnerNic), limit(1));
            const newOwnerSnapshot = await getDocs(newOwnerQuery);

            if(newOwnerSnapshot.empty) {
                toast({ title: "Error", description: "New owner not found in the system.", variant: "destructive" });
                return;
            }
            const newOwner = newOwnerSnapshot.docs[0].data() as AppUser;
            
            // Find vehicle by plate
            const vehicleQuery = query(collection(db, "vehicles"), where("licensePlate", "==", application.details.vehicleToTransfer), limit(1));
            const vehicleSnapshot = await getDocs(vehicleQuery);

            if(vehicleSnapshot.empty){
                toast({ title: "Error", description: "Vehicle to transfer not found.", variant: "destructive" });
                return;
            }
            const vehicleDocRef = vehicleSnapshot.docs[0].ref;

            await updateDoc(vehicleDocRef, { nic: newOwner.nic });
            toast({ title: "Ownership Transferred", description: `Vehicle now belongs to ${newOwner.name}.` });
        }
    }
    // --- End special logic ---

    await updateDoc(doc(db, "applications", application.id), { status: targetStatus, workerComment: comment });
    setApplication(prev => prev ? { ...prev, status: targetStatus, workerComment: comment } : null);
    toast({
        title: "Status Updated",
        description: `Application has been marked as ${targetStatus}.`,
    });
    
    if (application.userId) {
        await createNotification(
            application.userId,
            `Application ${targetStatus}`,
            `Your application for '${application.service}' has been ${targetStatus.toLowerCase()}. ${comment ? 'A comment was added.' : ''}`,
            "/my-applications"
        );
    }
    setIsStatusUpdateDialogOpen(false);
    setComment("");
    setTargetStatus(null);
  }
  
  const formatDate = (date: Timestamp | string | undefined) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return new Date(date).toLocaleString();
    if (date instanceof Timestamp) return date.toDate().toLocaleString();
    if (date instanceof Date) return date.toLocaleString();
    return 'Invalid Date';
  };
  
  if(loading) {
      return (
        <AdminLayout workerMode>
            <div className="flex-1 space-y-8 p-8 pt-6">
                <Skeleton className="h-10 w-1/2" />
                 <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-1 space-y-8">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="md:col-span-2 space-y-8">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                 </div>
            </div>
        </AdminLayout>
      )
  }

  if (!application) {
    return (
        <AdminLayout workerMode>
            <div className="flex-1 flex items-center justify-center">
                <p>Application not found.</p>
            </div>
        </AdminLayout>
    )
  }

  return (
    <>
    <AdminLayout workerMode>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
              <div className="flex items-center gap-4">
                {fromPath && (
                  <Button asChild variant="outline" size="icon">
                    <Link href={fromPath}><ArrowLeft /></Link>
                  </Button>
                )}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Application Details</h1>
                    <p className="text-muted-foreground">Reviewing application #{application.id}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => openStatusUpdateDialog('In Progress')}>Set to In Progress</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => openStatusUpdateDialog('Approved')}><Check className="mr-2"/>Approve</Button>
                <Button variant="destructive" onClick={() => openStatusUpdateDialog('Rejected')}><X className="mr-2"/>Reject</Button>
            </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> Applicant Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                   {applicant ? (
                    <>
                         <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Name</span>
                            <span className="font-medium">{applicant.name}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">NIC</span>
                            <span className="font-medium">{applicant.nic}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium">{applicant.email}</span>
                        </div>
                    </>
                   ) : <p className="text-muted-foreground">No applicant details found.</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {application.documents && Object.keys(application.documents).length > 0 ? (
                        Object.entries(application.documents).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-2 rounded-md border">
                               <div className="flex items-center gap-2">
                                  <File className="h-4 w-4 text-muted-foreground"/>
                                  <span className="text-sm font-medium">{key}</span>
                               </div>
                                <Button asChild variant="ghost" size="icon">
                                    <a href={value as string} download={`application-document-${key}`}>
                                        <Download className="h-4 w-4"/>
                                    </a>
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No documents were uploaded.</p>
                    )}
                </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Application Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Service Name</Label>
                        <p className="col-span-2 font-medium">{application.service}</p>
                    </div>
                     <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Current Status</Label>
                        <p className="col-span-2 font-medium">{application.status}</p>
                    </div>
                     <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Date Submitted</Label>
                        <p className="col-span-2 font-medium">{formatDate(application.submitted)}</p>
                    </div>
                    {application.workerComment && (
                        <div className="grid grid-cols-3 items-start gap-4">
                            <Label>Latest Comment</Label>
                            <p className="col-span-2 font-medium bg-muted p-3 rounded-md whitespace-pre-wrap">{application.workerComment}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {application.details && Object.keys(application.details).length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Additional Details</CardTitle>
                        <CardDescription>This application includes extra information submitted by the user.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(application.details).map(([key, value]) => (
                             <div key={key} className="grid grid-cols-3 items-center gap-4">
                                <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                <p className="col-span-2 font-medium">
                                    {key.toLowerCase().includes('date') ? formatDate(value) : String(value)}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>

    <Dialog open={isStatusUpdateDialogOpen} onOpenChange={setIsStatusUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status to "{targetStatus}"</DialogTitle>
            <DialogDescription>
              Add a comment to notify the citizen about this status change. This is optional but recommended.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea 
                id="comment" 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                placeholder="e.g., 'Your documents have been verified. Please await appointment confirmation.'"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleStatusUpdate}>Confirm Update</Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
