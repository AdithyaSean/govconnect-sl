
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Fine } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

export function FinePaymentService({ service }) {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFines = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      // In a real app, you would filter by the current user's NIC or a unique ID.
      // The current data model for fines does not have a user field, so we fetch all for now.
      // This is a known limitation of the prototype data.
      const q = query(collection(db, "fines"));
      try {
        const querySnapshot = await getDocs(q);
        const finesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fine));
        setFines(finesData);
      } catch (error) {
        console.error("Error fetching fines: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFines();
  }, [user]);

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Your Fines</CardTitle>
                <CardDescription>
                    Below is a list of all pending and paid fines associated with your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fine ID</TableHead>
                                <TableHead>Fine Type</TableHead>
                                <TableHead>Date Issued</TableHead>
                                <TableHead>Amount (LKR)</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                              Array.from({ length: 4 }).map((_, i) => (
                                <TableRow key={i}>
                                  <TableCell colSpan={7}>
                                    <Skeleton className="h-8 w-full" />
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : fines.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">You have no fines recorded.</TableCell>
                                </TableRow>
                            ) : (
                              fines.map((fine) => (
                                <TableRow key={fine.id}>
                                    <TableCell className="font-medium">{fine.id}</TableCell>
                                    <TableCell>{fine.type}</TableCell>
                                    <TableCell>{fine.issuedDate}</TableCell>
                                    <TableCell>{fine.amount}</TableCell>
                                    <TableCell>{fine.dueDate}</TableCell>
                                    <TableCell>
                                        <Badge variant={fine.status === 'Paid' ? 'default' : 'destructive'}
                                         className={fine.status === 'Paid' ? 'bg-green-600' : ''}
                                        >
                                            {fine.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {fine.status === 'Pending' && (
                                            <Button asChild size="sm">
                                                <Link href={`/payment?service=${encodeURIComponent(fine.type)}&amount=${fine.amount}&ref=${fine.id}`}>
                                                    Pay Now
                                                </Link>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                              ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
