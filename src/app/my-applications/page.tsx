
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import type { Application } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Label } from "@/components/ui/label";

const serviceFees = {
    "Passport Services": 3500.00,
    "Driving Licence Services": 2500.00,
    "Land Registry": 1000.00,
    "Missing Documents": 1500.00 // Example fee
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const q = query(collection(db, "applications"), where("userId", "==", user.id));
      
      try {
        const querySnapshot = await getDocs(q);
        const apps = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Application));
        setApplications(apps);
      } catch (error) {
        console.error("Error fetching applications: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);
  
  const formatDate = (date: Timestamp | string) => {
    if (typeof date === 'string') return date;
    if (!date) return 'N/A';
    return date.toDate().toLocaleDateString();
  };
  
  const getPaymentAmount = (service: string, details?: any) => {
      if (service === 'Passport Services') {
          return details?.serviceType === 'new' ? 5000.00 : 3500.00;
      }
      if (service === 'Driving Licence Services') {
          return details?.serviceType === 'new' ? 3500.00 : 2500.00;
      }
      return serviceFees[service] || 0.00;
  }

  return (
    <>
      <DashboardLayout>
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
            <Button asChild className="w-full sm:w-auto"><Link href="/dashboard">Apply for a New Service</Link></Button>
          </div>
          <Card>
              <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                  <CardDescription>Track all your submitted applications and their progress.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Service</TableHead>
                                  <TableHead>Reference ID</TableHead>
                                  <TableHead>Date Submitted</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                  <TableRow key={i}>
                                    <TableCell colSpan={5}>
                                      <Skeleton className="h-8 w-full" />
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : applications.length === 0 ? (
                                  <TableRow>
                                      <TableCell colSpan={5} className="text-center h-24">You have not submitted any applications yet.</TableCell>
                                  </TableRow>
                              ) : (
                                applications.map((app) => (
                                  <TableRow key={app.id}>
                                      <TableCell className="font-medium">{app.service}</TableCell>
                                      <TableCell>{app.id}</TableCell>
                                      <TableCell>{formatDate(app.submitted)}</TableCell>
                                      <TableCell>
                                          <Badge variant={
                                              app.status === 'Approved' || app.status === 'Completed' ? 'default'
                                              : app.status === 'In Review' || app.status === 'In Progress' ? 'secondary'
                                              : app.status === 'Pending Payment' ? 'outline'
                                              : 'destructive'
                                          }
                                          className={
                                              app.status === 'Approved' || app.status === 'Completed' ? 'bg-green-600' : ''
                                          }
                                          >{app.status}</Badge>
                                      </TableCell>
                                      <TableCell className="text-right flex items-center justify-end gap-2">
                                           {app.status === 'Pending Payment' && (
                                              <Button asChild size="sm">
                                                  <Link href={`/payment?service=${encodeURIComponent(app.service)}&amount=${getPaymentAmount(app.service, app.details)}&ref=${app.id}`}>
                                                      Pay Now
                                                  </Link>
                                              </Button>
                                          )}
                                          <Button variant="ghost" size="icon" onClick={() => setSelectedApp(app)}>
                                              <MoreHorizontal className="h-4 w-4" />
                                              <span className="sr-only">View Details</span>
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              )))}
                          </TableBody>
                      </Table>
                  </div>
              </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      <Dialog open={!!selectedApp} onOpenChange={(isOpen) => !isOpen && setSelectedApp(null)}>
        <DialogContent>
            {selectedApp && (
                 <>
                    <DialogHeader>
                        <DialogTitle>Application Details</DialogTitle>
                        <DialogDescription>
                            Viewing details for application #{selectedApp.id}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                           <Label className="text-muted-foreground">Service:</Label>
                           <p className="col-span-2 font-medium">{selectedApp.service}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <Label className="text-muted-foreground">Status:</Label>
                            <div className="col-span-2">
                                <Badge variant={
                                    selectedApp.status === 'Approved' || selectedApp.status === 'Completed' ? 'default'
                                    : selectedApp.status === 'In Review' || selectedApp.status === 'In Progress' ? 'secondary'
                                    : selectedApp.status === 'Pending Payment' ? 'outline'
                                    : 'destructive'
                                }
                                className={
                                    selectedApp.status === 'Approved' || selectedApp.status === 'Completed' ? 'bg-green-600' : ''
                                }
                                >{selectedApp.status}</Badge>
                           </div>
                        </div>
                         <div className="grid grid-cols-3 gap-2">
                           <Label className="text-muted-foreground">Submitted:</Label>
                           <p className="col-span-2 font-medium">{formatDate(selectedApp.submitted)}</p>
                        </div>
                        {selectedApp.workerComment && (
                           <div className="grid grid-cols-3 gap-2 items-start">
                               <Label className="text-muted-foreground">Latest Comment:</Label>
                               <div className="col-span-2 bg-muted p-3 rounded-md">
                                  <p className="font-medium whitespace-pre-wrap">{selectedApp.workerComment}</p>
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
