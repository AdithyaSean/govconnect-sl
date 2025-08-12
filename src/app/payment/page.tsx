
"use client";

import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, QrCode, Smartphone, University } from "lucide-react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const service = searchParams.get("service") || "Unknown Service";
  const amount = searchParams.get("amount") || "0.00";
  const ref = searchParams.get("ref") || null;
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newPaymentId, setNewPaymentId] = useState<string | null>(null);
  const { user } = useAuth();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ref || !user) {
        toast({ title: "Error", description: "Application reference or user not found.", variant: "destructive"});
        return;
    }

    setIsProcessing(true);

    try {
        // 1. Update application status (if it's an application payment)
        if(ref.length === 20) { // Simple check if it's likely a Firestore ID
            const appRef = doc(db, "applications", ref);
            await updateDoc(appRef, { status: "In Progress" });
        }

        // 2. Create a payment record
        const paymentDocRef = await addDoc(collection(db, "payments"), {
            userId: user.id,
            service: service,
            amount: amount,
            date: serverTimestamp(),
            status: "Success",
            applicationRef: ref
        });
        setNewPaymentId(paymentDocRef.id);

        // 3. Create a notification
         await addDoc(collection(db, "notifications"), {
            userId: user.id,
            title: "Payment Successful",
            description: `Your payment of LKR ${amount} for '${service}' was successful.`,
            href: `/receipt/${paymentDocRef.id}`,
            icon: "CheckCircle",
            read: false,
            createdAt: serverTimestamp()
        });

        setShowSuccessDialog(true);
    } catch(error) {
        console.error("Payment processing error:", error);
        toast({ title: "Payment Failed", description: "Something went wrong. Please try again.", variant: "destructive"});
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Payment Successful!</AlertDialogTitle>
              <AlertDialogDescription>
                Your payment for {service} has been processed successfully. Your
                application status has been updated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-between w-full gap-2 sm:gap-0">
               {newPaymentId && (
                    <Button variant="outline" asChild>
                        <Link href={`/receipt/${newPaymentId}`}>View Receipt</Link>
                    </Button>
                )}
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <Button variant="secondary" asChild>
                    <Link href="/my-applications">My Applications</Link>
                  </Button>
                  <AlertDialogAction asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </AlertDialogAction>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Secure Payment Gateway</CardTitle>
            <CardDescription>
              Complete your payment for the selected government service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Payment Details</h3>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium text-right">{service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference No:</span>
                  <span className="font-medium">{ref}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total Amount:</span>
                  <span>LKR {amount}</span>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">User Information</h3>
                 {user && (
                    <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{user.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">NIC:</span>
                          <span className="font-medium">{user.nic}</span>
                        </div>
                    </>
                )}
              </div>
            </div>

            <Tabs defaultValue="card" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="card"><CreditCard className="mr-2" /> Card</TabsTrigger>
                <TabsTrigger value="mobile"><Smartphone className="mr-2" /> Mobile</TabsTrigger>
                <TabsTrigger value="bank"><University className="mr-2" /> Bank</TabsTrigger>
                <TabsTrigger value="qr"><QrCode className="mr-2" /> QR</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handlePayment}>
                <TabsContent value="card">
                  <Card className="border-t-0 rounded-t-none">
                    <CardHeader>
                      <CardTitle>Credit/Debit Card</CardTitle>
                      <CardDescription>Enter your card details below. All transactions are secure and encrypted.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" placeholder="0000 0000 0000 0000" required />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry</Label>
                          <Input id="expiry" placeholder="MM/YY" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input id="cvc" placeholder="123" required />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                        {isProcessing ? "Processing..." : `Pay LKR ${amount}`}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                 <TabsContent value="mobile">
                   <Card className="border-t-0 rounded-t-none">
                    <CardHeader>
                      <CardTitle>Mobile Payment</CardTitle>
                      <CardDescription>Pay with eZ Cash or mCash.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex gap-4">
                           <Button variant="outline" className="flex-1 h-16"><Image src="https://placehold.co/100x40" width={100} height={40} alt="eZ Cash" data-ai-hint="logo payment" /></Button>
                           <Button variant="outline" className="flex-1 h-16"><Image src="https://placehold.co/100x40" width={100} height={40} alt="mCash" data-ai-hint="logo payment" /></Button>
                       </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobileNumber">Mobile Number</Label>
                            <Input id="mobileNumber" placeholder="07XXXXXXXX" required />
                        </div>
                    </CardContent>
                    <CardFooter>
                       <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                         {isProcessing ? "Processing..." : `Pay LKR ${amount}`}
                       </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                 <TabsContent value="bank">
                   <Card className="border-t-0 rounded-t-none">
                    <CardHeader>
                      <CardTitle>Online Banking</CardTitle>
                      <CardDescription>Select your bank to proceed with the payment.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <Button variant="outline" className="h-20">Bank of Ceylon</Button>
                        <Button variant="outline" className="h-20">People's Bank</Button>
                        <Button variant="outline" className="h-20">Sampath Bank</Button>
                        <Button variant="outline" className="h-20">Commercial Bank</Button>
                        <Button variant="outline" className="h-20">HNB</Button>
                        <Button variant="outline" className="h-20">NDB Bank</Button>
                    </CardContent>
                    <CardFooter>
                       <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                         {isProcessing ? "Processing..." : "Proceed to Bank"}
                       </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                 <TabsContent value="qr">
                   <Card className="border-t-0 rounded-t-none">
                     <CardHeader>
                        <CardTitle>LankaQR Payment</CardTitle>
                        <CardDescription>Scan the QR code with your mobile banking app to complete the payment.</CardDescription>
                     </CardHeader>
                     <CardContent className="flex flex-col items-center justify-center space-y-4">
                         <Image src="https://placehold.co/250x250.png" width={250} height={250} alt="LankaQR" data-ai-hint="qr code" />
                         <p className="text-muted-foreground text-sm">Waiting for payment confirmation...</p>
                     </CardContent>
                   </Card>
                </TabsContent>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
