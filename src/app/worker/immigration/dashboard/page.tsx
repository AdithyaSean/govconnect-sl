
"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, Timestamp, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Application } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { FileText, Clock, UserCheck } from "lucide-react";

const immigrationServices = ["Passport Services"];

export default function WorkerImmigrationDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({ newApplications: 0, pendingInterviews: 0, approvedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      const q = query(collection(db, "applications"), where("service", "in", immigrationServices));
      try {
        const querySnapshot = await getDocs(q);
        const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        setApplications(appsData);
        
        // Fetch stats
        const newAppsQuery = query(q, where("status", "==", "Pending"));
        const approvedTodayQuery = query(q, where("status", "==", "Approved")); // Simplified for demo
        const interviewsQuery = query(q, where("details.interviewScheduled", "==", true));

        const [newAppsSnapshot, approvedTodaySnapshot, interviewsSnapshot] = await Promise.all([
          getCountFromServer(newAppsQuery),
          getCountFromServer(approvedTodayQuery),
          getCountFromServer(interviewsQuery),
        ]);
        
        setStats({
          newApplications: newAppsSnapshot.data().count,
          pendingInterviews: interviewsSnapshot.data().count,
          approvedToday: approvedTodaySnapshot.data().count
        });

      } catch (error) {
        console.error("Error fetching immigration applications: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);
  
  const formatDate = (date: Timestamp | string) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return date;
    return date.toDate().toLocaleDateString();
  };

  return (
    <AdminLayout workerMode>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Immigration Worker Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.newApplications}</div>}
              <p className="text-xs text-muted-foreground">Awaiting document verification</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Interviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.pendingInterviews}</div>}
              <p className="text-xs text-muted-foreground">Scheduled for in-person visits</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.approvedToday}</div>}
               <p className="text-xs text-muted-foreground">Passports ready for issuance</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Passport Applications</CardTitle>
            <CardDescription>Review and process passport renewal requests.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                ) : applications.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No immigration-related applications found.</TableCell>
                    </TableRow>
                ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.id}</TableCell>
                    <TableCell>{app.user}</TableCell>
                    <TableCell>{formatDate(app.submitted)}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'Approved' ? 'default' : 'secondary'} className={app.status === 'Approved' ? 'bg-green-600' : ''}>{app.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/worker/applications/${app.id}?from=/worker/immigration/dashboard`}>View Application</Link>
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
