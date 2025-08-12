
"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import type { Application, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { services } from "@/lib/data";

const statuses = ['Pending', 'Approved', 'Rejected', 'In Progress', 'Completed', 'In Review', 'Pending Payment'];
const serviceNames = ["all", ...services.map(s => s.title)];


export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [appsSnapshot, usersSnapshot] = await Promise.all([
          getDocs(collection(db, "applications")),
          getDocs(collection(db, "users")),
        ]);

        const apps = appsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Application));
        setApplications(apps);

        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        setUsers(usersData);

      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);
  
  const usersById = useMemo(() => {
      return users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
      }, {} as {[key: string]: User});
  }, [users]);


  const filteredApplications = useMemo(() => {
      return applications.filter(app => {
          const lowercasedQuery = searchQuery.toLowerCase();
          const user = app.userId ? usersById[app.userId] : null;

          const matchesSearch = searchQuery === "" ||
              app.user.toLowerCase().includes(lowercasedQuery) ||
              app.id.toLowerCase().includes(lowercasedQuery) ||
              (user && user.nic.toLowerCase().includes(lowercasedQuery));
          
          const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
          const matchesService = serviceFilter === 'all' || app.service === serviceFilter;

          return matchesSearch && matchesStatus && matchesService;
      });
  }, [searchQuery, applications, usersById, statusFilter, serviceFilter]);

  const formatDate = (date: Timestamp | string) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return date;
    return date.toDate().toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Submitted Applications</CardTitle>
            <CardDescription>View and manage all user applications.</CardDescription>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="relative md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, ID, or NIC..." 
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                </div>
                 <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by service" />
                    </SelectTrigger>
                    <SelectContent>
                        {serviceNames.map(name => <SelectItem key={name} value={name}>{name === 'all' ? 'All Services' : name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium truncate max-w-28">{app.id}</TableCell>
                      <TableCell>{app.user}</TableCell>
                      <TableCell>{app.service}</TableCell>
                      <TableCell>{formatDate(app.submitted)}</TableCell>
                      <TableCell>
                         <Badge variant={
                             app.status === 'Approved' || app.status === 'Completed' ? 'default' 
                             : app.status === 'Pending' ? 'secondary'
                             : app.status === 'In Progress' || app.status === 'In Review' ? 'outline'
                             : 'destructive'
                          }
                          className={
                               app.status === 'Approved' || app.status === 'Completed' ? 'bg-green-600' : ''
                          }
                          >
                          {app.status}
                          </Badge>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/applications/${app.id}`}>
                                View Details
                            </Link>
                        </Button>
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
