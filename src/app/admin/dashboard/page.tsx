
"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpRight, Users, FileText, CircleDollarSign, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Application, Payment, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalApplications: 0,
        totalPayments: 0,
        activeServices: 11 // This can remain static or be fetched from a 'services' collection
    });
    const [recentApplications, setRecentApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats
                const usersSnapshot = await getDocs(collection(db, "users"));
                const appsSnapshot = await getDocs(collection(db, "applications"));
                const paymentsSnapshot = await getDocs(collection(db, "payments"));
                
                const totalPayments = paymentsSnapshot.docs.reduce((acc, doc) => {
                    const payment = doc.data() as Payment;
                    return acc + parseFloat(payment.amount);
                }, 0);

                setStats({
                    totalUsers: usersSnapshot.size,
                    totalApplications: appsSnapshot.size,
                    totalPayments: totalPayments,
                    activeServices: 11 
                });

                // Fetch recent applications
                const recentAppsQuery = query(collection(db, "applications"), orderBy("submitted", "desc"), limit(5));
                const recentAppsSnapshot = await getDocs(recentAppsQuery);
                const apps = recentAppsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Application));
                setRecentApplications(apps);

            } catch (error) {
                console.error("Error fetching dashboard data: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const formatDate = (date: Timestamp | string) => {
        if (!date) return 'N/A';
        if (typeof date === 'string') return date;
        return date.toDate().toLocaleDateString();
    };

  return (
    <AdminLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.totalUsers}</div>}
              <p className="text-xs text-muted-foreground">Registered on the platform</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.totalApplications}</div>}
              <p className="text-xs text-muted-foreground">Submitted across all services</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">LKR {stats.totalPayments.toLocaleString()}</div>}
              <p className="text-xs text-muted-foreground">Processed through the gateway</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeServices}</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="grid gap-2">
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>
                A quick look at the latest applications submitted by users.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1 w-full sm:w-auto">
              <Link href="/admin/applications">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Service</TableHead>
                     <TableHead>Submitted On</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : recentApplications.map((app) => (
                     <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.user}</TableCell>
                      <TableCell>{app.service}</TableCell>
                       <TableCell>{formatDate(app.submitted)}</TableCell>
                      <TableCell>
                          <Badge variant={
                             app.status === 'Approved' ? 'default' 
                             : app.status === 'Pending' ? 'secondary'
                             : 'destructive'
                          }
                           className={
                               app.status === 'Approved' ? 'bg-green-600' : ''
                           }
                          >{app.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
