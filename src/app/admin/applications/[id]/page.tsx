
"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Check, Download, File, User, X, ArrowLeft } from "lucide-react";
import { useEffect, useState, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp, collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { Application, User as AppUser } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";


export default function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [applicant, setApplicant] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  

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
            
            // Now fetch the applicant's data
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

  const handleStatusUpdate = async (status: Application['status']) => {
    if(application) {
      await updateDoc(doc(db, "applications", application.id), { status });
      setApplication(prev => prev ? { ...prev, status } : null);
      toast({
          title: "Status Updated",
          description: `Application has been marked as ${status}.`,
      });
      // Create a notification for the user
      if (application.userId) {
          await createNotification(
              application.userId,
              `Application ${status}`,
              `Your application for '${application.service}' has been ${status.toLowerCase()}.`,
              "/my-applications"
          );
      }
    }
  }

  const formatDate = (date: Timestamp | string) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return date;
    return date.toDate().toLocaleDateString();
  };
  
  if(loading) {
      return (
        <AdminLayout>
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
        <AdminLayout>
            <div className="flex-1 flex items-center justify-center">
                <p>Application not found.</p>
            </div>
        </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/admin/applications"><ArrowLeft /></Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Application Details</h1>
                  <p className="text-muted-foreground">Reviewing application #{application.id}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleStatusUpdate('In Progress')}>Set to In Progress</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate('Approved')}><Check className="mr-2"/>Approve</Button>
                <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')}><X className="mr-2"/>Reject</Button>
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
                </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
