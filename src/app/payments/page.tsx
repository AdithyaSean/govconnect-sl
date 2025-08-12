
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import type { Payment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";


export default function PaymentsPage() {
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchPayments = async () => {
            if (!user) {
              setLoading(false);
              return;
            }
            
            setLoading(true);
            try {
                const q = query(collection(db, "payments"), where("userId", "==", user.id));
                const querySnapshot = await getDocs(q);
                const paymentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
                
                // Sort on the client side to avoid needing a composite index
                const sortedPayments = paymentsData.sort((a, b) => {
                    const dateA = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date).getTime();
                    const dateB = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date).getTime();
                    return dateB - dateA;
                });

                setPaymentHistory(sortedPayments);
            } catch (error) {
                console.error("Error fetching payments:", error);
            } finally {
                setLoading(false);
            }
        };

        if(user){
            fetchPayments();
        }
    }, [user]);
    
    const formatDate = (date: Timestamp | string) => {
        if (!date) return 'N/A';
        if (typeof date === 'string') return new Date(date).toLocaleDateString();
        return date.toDate().toLocaleDateString();
    };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                View your past transactions and download receipts.
                </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reference ID</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount (LKR)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6}>
                                        <Skeleton className="h-8 w-full" />
                                    </TableCell>
                                </TableRow>
                             ))
                        ) : paymentHistory.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">You have no payment history.</TableCell>
                            </TableRow>
                        ) : (
                            paymentHistory.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium truncate max-w-28">{payment.applicationRef || payment.id}</TableCell>
                                <TableCell>{payment.service}</TableCell>
                                <TableCell>{formatDate(payment.date)}</TableCell>
                                <TableCell>{payment.amount}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 text-xs rounded-full ${payment.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{payment.status}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/receipt/${payment.id}`}>
                                            View Receipt <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )))}
                    </TableBody>
                </Table>
              </div>
            </CardContent>
             <CardFooter className="flex justify-end">
                <Button variant="outline">Raise a Payment Issue</Button>
             </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
