
"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Application } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const registeredVehiclesServices = ["Registered Vehicles", "New Vehicle Registration", "Vehicle Ownership Transfer"];

export default function WorkerRegisteredVehiclesDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      const q = query(collection(db, "applications"), where("service", "in", registeredVehiclesServices));
      try {
        const querySnapshot = await getDocs(q);
        const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        setApplications(appsData);
      } catch (error) {
        console.error("Error fetching registered vehicles applications: ", error);
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
        <h1 className="text-3xl font-bold tracking-tight">Registered Vehicles Worker Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Service Requests</CardTitle>
            <CardDescription>Manage new vehicle registrations and ownership transfers.</CardDescription>
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
                        <TableCell colSpan={5} className="text-center h-24">No registered vehicle applications found.</TableCell>
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
                        <Link href={`/worker/applications/${app.id}?from=/worker/registered-vehicles/dashboard`}>View Request</Link>
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

    
