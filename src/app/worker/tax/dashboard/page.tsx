
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
import { FileText, Hourglass, Bell } from "lucide-react";

const taxServices = ["Tax Payments (IRD)", "Tax Document Submission"];

export default function WorkerTaxDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({ newSubmissions: 0, pendingReviews: 0, upcomingDeadlines: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      const q = query(collection(db, "applications"), where("service", "in", taxServices));
      try {
        const querySnapshot = await getDocs(q);
        const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        setApplications(appsData);

        // Stats
        const newSubsQuery = query(q, where("status", "==", "Pending Payment"));
        const pendingReviewsQuery = query(q, where("status", "==", "In Review"));

        const [newSubsSnapshot, pendingReviewsSnapshot] = await Promise.all([
          getCountFromServer(newSubsQuery),
          getCountFromServer(pendingReviewsQuery),
        ]);

        setStats({
          newSubmissions: newSubsSnapshot.data().count,
          pendingReviews: pendingReviewsSnapshot.data().count,
          upcomingDeadlines: 2, // Placeholder
        });

      } catch (error) {
        console.error("Error fetching tax applications: ", error);
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
        <h1 className="text-3xl font-bold tracking-tight">Tax Worker Dashboard</h1>
        
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.newSubmissions}</div>}
              <p className="text-xs text-muted-foreground">New filings and payments</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.pendingReviews}</div>}
              <p className="text-xs text-muted-foreground">Uploaded documents to verify</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.upcomingDeadlines}</div>}
               <p className="text-xs text-muted-foreground">Quarterly and annual filings</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tax Submissions</CardTitle>
            <CardDescription>Review and verify tax-related submissions and document uploads.</CardDescription>
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
                        <TableCell colSpan={5} className="text-center h-24">No tax-related applications found.</TableCell>
                    </TableRow>
                ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.service}</TableCell>
                    <TableCell>{app.user}</TableCell>
                    <TableCell>{formatDate(app.submitted)}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'Approved' || app.status === 'Completed' ? 'default' : 'secondary'} className={app.status === 'Approved' || app.status === 'Completed' ? 'bg-green-600' : ''}>{app.status}</Badge>
                    </TableCell>
                    <TableCell>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/worker/applications/${app.id}?from=/worker/tax/dashboard`}>View Application</Link>
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
