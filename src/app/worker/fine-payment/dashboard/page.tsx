
"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, getCountFromServer, Timestamp, doc, updateDoc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Application, Fine, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ReceiptText, AlertTriangle, CheckCircle, User as UserIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WorkerFinePaymentDashboard() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [stats, setStats] = useState({ pendingFines: 0, paidToday: 0, disputedFines: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [citizen, setCitizen] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    setLoading(true);
    const finesQuery = query(collection(db, "fines"));
    try {
      const querySnapshot = await getDocs(finesQuery);
      const finesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fine));
      setFines(finesData);

      const pendingQuery = query(collection(db, "fines"), where("status", "==", "Pending"));
      const paidQuery = query(collection(db, "fines"), where("status", "==", "Paid"));

      const [pendingSnapshot, paidSnapshot] = await Promise.all([
        getCountFromServer(pendingQuery),
        getCountFromServer(paidQuery),
      ]);

      setStats({
        pendingFines: pendingSnapshot.data().count,
        paidToday: paidSnapshot.data().count, // Note: This is total paid, not just today
        disputedFines: 0 // Placeholder
      });

    } catch (error) {
      console.error("Error fetching fines data: ", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenVerifyDialog = async (fine: Fine) => {
    setSelectedFine(fine);
    setCitizen(null); // Reset previous citizen data
    setIsDialogOpen(true);

    // Fetch citizen details based on NIC
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("nic", "==", fine.nic), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setCitizen({ id: userDoc.id, ...userDoc.data() } as User);
    } else {
        console.warn(`No citizen found with NIC: ${fine.nic}`);
    }
  };
  
  const handlePaymentVerification = async (newStatus: 'Paid' | 'Rejected') => {
      if(!selectedFine) return;
      
      const fineRef = doc(db, "fines", selectedFine.id);
      try {
        await updateDoc(fineRef, { status: newStatus });
        toast({
            title: `Payment ${newStatus}`,
            description: `The fine has been successfully marked as ${newStatus}.`,
        });
        setIsDialogOpen(false);
        setSelectedFine(null);
        fetchDashboardData(); // Refresh the data
      } catch(error) {
        console.error("Error updating fine status: ", error);
        toast({
            title: "Update Failed",
            description: "Could not update the fine status. Please try again.",
            variant: "destructive"
        });
      }
  }
  
  return (
    <AdminLayout workerMode>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Fine Payment Worker Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Fines</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.pendingFines}</div>}
              <p className="text-xs text-muted-foreground">Total number of unpaid fines</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Fines</CardTitle>
              <ReceiptText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.paidToday}</div>}
              <p className="text-xs text-muted-foreground">Total fines settled</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disputed Fines</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.disputedFines}</div>}
               <p className="text-xs text-muted-foreground">Under review or appealed</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Fines</CardTitle>
            <CardDescription>Review and verify fine payments from citizens.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fine ID</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                    ))
                ) : fines.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No fines found.</TableCell>
                    </TableRow>
                ) : (
                fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell className="font-medium">{fine.id}</TableCell>
                    <TableCell>{fine.nic}</TableCell>
                    <TableCell>LKR {fine.amount}</TableCell>
                    <TableCell>
                      <Badge variant={fine.status === 'Paid' ? 'default' : 'destructive'} className={fine.status === 'Paid' ? 'bg-green-600' : ''}>{fine.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenVerifyDialog(fine)}>Verify Payment</Button>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Verify Fine Payment</DialogTitle>
              <DialogDescription>
                Review the details below and verify the payment status.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <Card>
                    <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">Citizen Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {citizen ? (
                             <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Name:</span> {citizen.name}</p>
                                <p><span className="font-medium">NIC:</span> {citizen.nic}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Loading citizen info...</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
                        <ReceiptText className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">Fine Details</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p><span className="font-medium">Fine ID:</span> {selectedFine?.id}</p>
                        <p><span className="font-medium">Amount:</span> LKR {selectedFine?.amount}</p>
                        <p><span className="font-medium">Type:</span> {selectedFine?.type}</p>
                        <p><span className="font-medium">Issued Date:</span> {selectedFine?.issuedDate}</p>
                        <p><span className="font-medium">Current Status:</span> {selectedFine?.status}</p>
                    </CardContent>
                </Card>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="button" variant="destructive" onClick={() => handlePaymentVerification('Rejected')}>Reject Payment</Button>
              <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={() => handlePaymentVerification('Paid')}>Approve Payment</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}

