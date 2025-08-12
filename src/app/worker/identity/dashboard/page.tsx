
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
import { FileText, Clock, UserCheck } from "lucide-react";

const identityServices = ["National ID Services"];

export default function WorkerIdentityDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({ newApplications: 0, appointmentsToday: 0, approvedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      const q = query(collection(db, "applications"), where("service", "in", identityServices));
      try {
        const querySnapshot = await getDocs(q);
        const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        setApplications(appsData);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const newAppsQuery = query(q, where("status", "==", "Pending"));
        const approvedTodayQuery = query(q, where("status", "==", "Approved")); // Simplified for demo

        const [newAppsSnapshot, approvedTodaySnapshot] = await Promise.all([
          getCountFromServer(newAppsQuery),
          getCountFromServer(approvedTodayQuery)
        ]);

        const appointmentsTodayCount = appsData.filter(app => {
            if (!app.details?.appointmentDate) return false;
            const appDate = (app.details.appointmentDate as Timestamp).toDate();
            return appDate >= today && appDate < tomorrow;
        }).length;

        setStats({
          newApplications: newAppsSnapshot.data().count,
          appointmentsToday: appointmentsTodayCount,
          approvedToday: approvedTodaySnapshot.data().count,
        });

      } catch (error) {
        console.error("Error fetching identity applications: ", error);
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
        <h1 className="text-3xl font-bold tracking-tight">Identity Worker Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.newApplications}</div>}
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.appointmentsToday}</div>}
              <p className="text-xs text-muted-foreground">For biometrics capture</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.approvedToday}</div>}
               <p className="text-xs text-muted-foreground">Processed and completed</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Biometrics Appointments</CardTitle>
            <CardDescription>Upcoming appointments for fingerprint and photo capture for National ID cards.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Appointment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : applications.filter(app => app.details?.appointmentDate).length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">No appointments found.</TableCell>
                    </TableRow>
                ) : (
                applications.filter(app => app.details?.appointmentDate).map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.user}</TableCell>
                    <TableCell>{formatDate(app.details?.appointmentDate)}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'Approved' ? 'default' : 'secondary'} className={app.status === 'Approved' ? 'bg-green-600' : ''}>{app.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/worker/applications/${app.id}?from=/worker/identity/dashboard`}>View Application</Link>
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
