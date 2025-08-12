
"use client";

import { useState, useMemo, useEffect, FormEvent } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, getDocs, addDoc, serverTimestamp, Timestamp, doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const roles = [
    "Citizen", "Super Admin", "worker_transport", "worker_immigration", "worker_identity", "worker_health", "worker_tax", "worker_pension", "worker_landregistry", "worker_exams", "worker_finepayment", "worker_registeredvehicles", "worker_missingdocuments", "worker_support"
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState("Citizen");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
    } catch(e) {
        console.error("Error fetching users: ", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const formValues = Object.fromEntries(formData.entries()) as { name: string; email: string; nic: string; password: string};

    if (formValues.password.length < 6) {
        toast({ title: "Weak Password", description: "Password must be at least 6 characters long.", variant: "destructive" });
        return;
    }

    let authEmail = '';
    let userData: Partial<User> = {
        name: formValues.name,
        role: newUserRole,
        status: "Active",
    };

    if (newUserRole === 'Citizen') {
        if (!formValues.nic) {
            toast({ title: "NIC is required for Citizens", variant: "destructive" });
            return;
        }
        authEmail = `${formValues.nic}@citizen.gov.lk`;
        userData.nic = formValues.nic;
        userData.email = ""; // Citizens don't have a login email
    } else {
        if (!formValues.email || !formValues.email.includes('@')) {
            toast({ title: "A valid email is required for Workers/Admins", variant: "destructive" });
            return;
        }
        authEmail = formValues.email;
        userData.email = formValues.email;
        userData.nic = ""; // Workers don't use NIC for login
    }

    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, formValues.password);
        const authUser = userCredential.user;

        // 2. Create user profile in Firestore
        const userRef = doc(db, "users", authUser.uid);
        await setDoc(userRef, {
            ...userData,
            id: authUser.uid,
            joined: serverTimestamp(),
            photoURL: ''
        });
        
        toast({ title: "User Created Successfully", description: `${formValues.name} has been added.`});
        setIsAddUserDialogOpen(false);
        fetchUsers(); // Refresh the user list
        
    } catch(e: any) {
      console.error("Error adding document: ", e);
      toast({ title: "Failed to create user", description: e.message, variant: "destructive"});
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = user.name.toLowerCase().includes(searchLower) ||
                            (user.email && user.email.toLowerCase().includes(searchLower)) ||
                            (user.nic && user.nic.toLowerCase().includes(searchLower));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);
  
  const formatDate = (date: Timestamp | string) => {
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (!date) return 'N/A';
    return date.toDate().toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
           <Button onClick={() => setIsAddUserDialogOpen(true)} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Add New User</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage platform users and their roles.</CardDescription>
             <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, email, or NIC..." 
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email / NIC</TableHead>
                    <TableHead>Role</TableHead>
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
                        <TableCell colSpan={5}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.photoURL} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.role === 'Citizen' ? user.nic : user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'Super Admin' ? 'destructive' : user.role.startsWith('worker_') ? 'outline' : 'secondary'}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Active' ? 'default' : 'destructive'} className={user.status === 'Active' ? 'bg-green-600' : ''}>{user.status}</Badge>
                      </TableCell>
                       <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/users/${user.id}`}>
                                View Profile <ArrowRight className="ml-2 h-4 w-4" />
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

       <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddUser}>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Fill in the details for the new user. An email is required for Admins/Workers, and an NIC is required for Citizens.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role-select" className="text-right">Role</Label>
                <Select name="role" value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger id="role-select" className="col-span-3">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              {newUserRole === 'Citizen' ? (
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nic" className="text-right">NIC</Label>
                  <Input id="nic" name="nic" type="text" className="col-span-3" required />
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input id="email" name="email" type="email" className="col-span-3" required />
                </div>
              )}
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">Password</Label>
                  <Input id="password" name="password" type="password" className="col-span-3" required minLength={6} />
                </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

    