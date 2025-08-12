
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
import { FileText, UserCheck, MessageSquare } from "lucide-react";

const pensionServices = ["Pension Department"];

export default function WorkerPensionDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({ newApplications: 0, approvedPensions: 0, openInquiries: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      const q = query(collection(db, "applications"), where("service", "in", pensionServices));
      try {
        const querySnapshot = await getDocs(q);
        const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        setApplications(appsData);

        // Stats
        const newAppsQuery = query(q, where("status", "==", "Pending"));
        const approvedQuery = query(q, where("status", "==", "Approved"));
        
        const [newAppsSnapshot, approvedSnapshot] = await Promise.all([
          getCountFromServer(newAppsQuery),
          getCountFromServer(approvedQuery),
        ]);

        setStats({
          newApplications: newAppsSnapshot.data().count,
          approvedPensions: approvedSnapshot.data().count,
          openInquiries: 0, // Placeholder
        });

      } catch (error) {
        console.error("Error fetching pension applications: ", error);
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
        <h1 className="text-3xl font-bold tracking-tight">Pension Worker Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.newApplications}</div>}
              <p className="text-xs text-muted-foreground">Awaiting document review</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Approved Pensions</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.approvedPensions}</div>}
              <p className="text-xs text-muted-foreground">Actively receiving payments</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Inquiries</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.openInquiries}</div>}
               <p className="text-xs text-muted-foreground">From pensioners and applicants</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pension Applications</CardTitle>
            <CardDescription>Review and process applications for government retiree pensions.</CardDescription>
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
                    Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                    ))
                ) : applications.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No pension-related applications found.</TableCell>
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
                            <Link href={`/worker/applications/${app.id}?from=/worker/pension/dashboard`}>View Application</Link>
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
