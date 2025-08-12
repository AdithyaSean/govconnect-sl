
"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, getCountFromServer, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Application } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { FilePlus, Clock, Stethoscope } from "lucide-react";

const healthServices = ["Health Services", "National Medical ID Card Application", "Medical Appointment Request"];

export default function WorkerHealthDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({ newAppointments: 0, newIdApplications: 0, pendingReviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      const q = query(collection(db, "applications"), where("service", "in", healthServices));
      try {
        const querySnapshot = await getDocs(q);
        const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        setApplications(appsData);

        // Stats
        const newAppointmentsQuery = query(q, where("service", "==", "Medical Appointment Request"), where("status", "==", "Pending"));
        const newIdQuery = query(q, where("service", "==", "National Medical ID Card Application"), where("status", "==", "In Review"));
        
        const [newAppointmentsSnapshot, newIdSnapshot] = await Promise.all([
          getCountFromServer(newAppointmentsQuery),
          getCountFromServer(newIdQuery),
        ]);

        setStats({
          newAppointments: newAppointmentsSnapshot.data().count,
          newIdApplications: newIdSnapshot.data().count,
          pendingReviews: 0 // Placeholder
        });

      } catch (error) {
        console.error("Error fetching health applications: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);
  
  const formatDate = (date: Timestamp | string | undefined) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date instanceof Timestamp) return date.toDate().toLocaleDateString();
    return 'Invalid Date';
  };

  return (
    <AdminLayout workerMode>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Health Worker Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Appointments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.newAppointments}</div>}
              <p className="text-xs text-muted-foreground">Waiting for confirmation</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Medical ID Applications</CardTitle>
              <FilePlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.newIdApplications}</div>}
              <p className="text-xs text-muted-foreground">To be reviewed and approved</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Report Reviews</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.pendingReviews}</div>}
               <p className="text-xs text-muted-foreground">Medical reports to analyze</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Health Service Requests</CardTitle>
            <CardDescription>Review and process health-related applications from citizens.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                    ))
                ) : applications.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No health-related applications found.</TableCell>
                    </TableRow>
                ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.service}</TableCell>
                    <TableCell>{app.user}</TableCell>
                    <TableCell>{formatDate(app.submitted)}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'Approved' ? 'default' : 'secondary'} className={app.status === 'Approved' ? 'bg-green-600' : ''}>{app.status}</Badge>
                    </TableCell>
                    <TableCell>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/worker/applications/${app.id}?from=/worker/health/dashboard`}>View Application</Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
