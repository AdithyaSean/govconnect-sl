
"use client";

import { use } from 'react';
import { notFound } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import type { Payment, User } from '@/lib/types';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { Printer, Download } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


async function getPaymentData(paymentId: string): Promise<Payment | null> {
    const docRef = doc(db, 'payments', paymentId);
    const docSnap = await getDoc(docRef);

    if(docSnap.exists()){
        return { id: docSnap.id, ...docSnap.data() } as Payment;
    }
    return null;
}

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, loading: authLoading } = useAuth();
    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchPayment = async () => {
            setLoading(true);
            const paymentData = await getPaymentData(id);
            setPayment(paymentData);
            setLoading(false);
        }
        fetchPayment();
    }, [id]);

    const handleDownloadPdf = () => {
        const input = receiptRef.current;
        if (input) {
            html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`receipt-${payment?.id}.pdf`);
            });
        }
    };

    if (loading || authLoading) {
        return (
             <DashboardLayout>
                <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
                    <Card className="max-w-2xl mx-auto mt-10">
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <Skeleton className="h-24 w-full" />
                           <Skeleton className="h-32 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        )
    }

    if (!payment) {
        return notFound();
    }
    
    // Security check: ensure the logged-in user owns this receipt
    if (user && payment.userId !== user.id) {
         return (
            <DashboardLayout>
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-destructive">You are not authorized to view this receipt.</p>
                </div>
            </DashboardLayout>
        );
    }
    
     const formatDate = (date: Timestamp | string) => {
        if (!date) return 'N/A';
        if (typeof date === 'string') return new Date(date).toLocaleString();
        return date.toDate().toLocaleString();
      };


    return (
        <DashboardLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
                <Card className="max-w-2xl mx-auto" id="receipt-content">
                    <div ref={receiptRef} className="bg-card">
                        <CardHeader className="text-center bg-muted/30 p-8">
                            <div className="flex justify-center mb-4">
                                 <img src="https://placehold.co/150x50" alt="GovConnect SL Logo" width={150} height={50} data-ai-hint="logo" />
                            </div>
                            <CardTitle className="text-3xl">Official Receipt</CardTitle>
                            <CardDescription>Thank you for your payment.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-2">BILLED TO</h3>
                                    <p>{user?.name}</p>
                                    <p>{user?.nic}</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-semibold text-muted-foreground mb-2">RECEIPT DETAILS</h3>
                                    <p><span className="font-semibold">Receipt No:</span> {payment.id}</p>
                                    <p><span className="font-semibold">Date:</span> {formatDate(payment.date)}</p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>
                                                <p className="font-medium">{payment.service}</p>
                                                <p className="text-xs text-muted-foreground">Ref: {payment.applicationRef}</p>
                                            </TableCell>
                                            <TableCell className="text-right">LKR {payment.amount}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-2 items-center">
                                <div className="flex justify-center">
                                    <img src={`https://placehold.co/120x120.png`} alt="QR Code" width={120} height={120} data-ai-hint="qr code" />
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground">Total</p>
                                    <p className="text-4xl font-bold">LKR {payment.amount}</p>
                                    <p className={`mt-2 font-semibold ${payment.status === 'Success' ? 'text-green-600' : 'text-red-600'}`}>
                                        Status: {payment.status}
                                    </p>
                                </div>
                            </div>
                            
                             <Separator />

                             <p className="text-xs text-muted-foreground text-center">
                                This is a computer-generated receipt and does not require a signature. If you have any questions about this receipt, please contact our support team.
                            </p>
                        </CardContent>
                    </div>
                </Card>
                <div className="max-w-2xl mx-auto mt-4 flex justify-end gap-2">
                    <Button onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                </div>
            </div>
        </DashboardLayout>
    );
}

