
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FormEvent, useEffect, useState } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { SupportTicket } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";


export default function SupportPage() {
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [userReply, setUserReply] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!user) {
            toast({
                title: "Not Logged In",
                description: "You must be logged in to submit a ticket.",
                variant: "destructive"
            });
            return;
        }

        const formData = new FormData(e.target as HTMLFormElement);
        const ticketData = {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          subject: formData.get("subject") as string,
          message: formData.get("message") as string,
          status: "Open",
          submittedAt: serverTimestamp(),
          userNic: user.nic,
          userId: user.id,
          reply: ""
        };

        try {
            await addDoc(collection(db, "supportTickets"), ticketData);
            toast({
                title: "Support Ticket Submitted",
                description: "Thank you for contacting us. Our team will get back to you shortly.",
            });
            (e.target as HTMLFormElement).reset();
            fetchTickets(); // Refresh the list after submission
        } catch (error) {
             toast({
                title: "Submission Failed",
                description: "There was an error submitting your ticket. Please try again.",
                variant: "destructive"
            });
            console.error("Error adding document: ", error);
        }
    }
    
    const fetchTickets = async () => {
        if (!user) {
            setLoadingTickets(false);
            return;
        };

        setLoadingTickets(true);
        try {
            const q = query(collection(db, "supportTickets"), where("userNic", "==", user.nic));
            const querySnapshot = await getDocs(q);
            const userTickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket))
                .sort((a, b) => (b.submittedAt as Timestamp).toMillis() - (a.submittedAt as Timestamp).toMillis());
            setTickets(userTickets);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoadingTickets(false);
        }
    }

    const handleUserReply = async (ticketId: string, currentMessage: string) => {
        if (!userReply.trim()) return;
        const ticketRef = doc(db, "supportTickets", ticketId);
        
        try {
            const newMessage = `${currentMessage}\n\n[User Reply on ${new Date().toLocaleString()}]:\n${userReply}`;
            await updateDoc(ticketRef, {
                message: newMessage,
                status: "Open" // Re-open the ticket for the worker to see
            });
            toast({
                title: "Reply Sent",
                description: "Your reply has been sent to the support team."
            });
            setUserReply("");
            fetchTickets(); // Refresh to show the updated message
        } catch (error) {
            console.error("Error sending reply:", error);
            toast({
                title: "Reply Failed",
                description: "Could not send your reply. Please try again.",
                variant: "destructive"
            });
        }
    };
    
    useEffect(() => {
        if(!authLoading && user){
            fetchTickets();
        }
    }, [user, authLoading]);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Support & Resources</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>My Support Tickets</CardTitle>
                        <CardDescription>View your past inquiries and responses from our support team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                           {loadingTickets ? (
                             <Skeleton className="h-20 w-full" />
                           ) : tickets.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">You have not submitted any support tickets yet.</p>
                           ) : (
                                tickets.map(ticket => (
                                    <AccordionItem value={ticket.id} key={ticket.id}>
                                        <AccordionTrigger>
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <span className="truncate">{ticket.subject}</span>
                                                <Badge variant={ticket.status === 'Open' ? 'destructive' : ticket.status === 'Closed' ? 'default' : 'secondary'}  
                                                className={ticket.status === 'Closed' ? 'bg-green-600' : ''}
                                                >
                                                    {ticket.status}
                                                </Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-sm mb-1">Your Message History:</h4>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">{ticket.message}</p>
                                            </div>
                                             {ticket.reply && (
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-1">Support Reply History:</h4>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-primary/10 p-3 rounded-md">{ticket.reply}</p>
                                                </div>
                                            )}
                                            {ticket.status !== 'Closed' && (
                                                <div className="pt-4 border-t">
                                                    <Label htmlFor="user-reply" className="font-semibold">Send a Reply</Label>
                                                    <Textarea 
                                                        id="user-reply"
                                                        className="mt-2"
                                                        placeholder="Type your reply here..."
                                                        value={userReply}
                                                        onChange={(e) => setUserReply(e.target.value)}
                                                    />
                                                    <Button className="mt-2" onClick={() => handleUserReply(ticket.id, ticket.message)}>Send Reply</Button>
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))
                           )}
                        </Accordion>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                        <CardDescription>Find quick answers to common questions about our services.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>How do I reset my password?</AccordionTrigger>
                                <AccordionContent>
                                You can reset your password by clicking the "Forgot Password" link on the login page and following the on-screen instructions.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>What documents are needed for a new NIC?</AccordionTrigger>
                                <AccordionContent>
                                For a new National ID card, you typically need your birth certificate, certified photos, and a certificate from your Grama Niladhari.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>How can I track my application status?</AccordionTrigger>
                                <AccordionContent>
                                 You can track the status of all your submitted applications under the "My Applications" section in the main navigation.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>Is my data secure on this platform?</AccordionTrigger>
                                <AccordionContent>
                                 Yes, we use industry-standard encryption and security protocols to protect all your personal information and application data.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
            
            <form onSubmit={handleSubmit} className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Support</CardTitle>
                        <CardDescription>Can't find an answer? Fill out the form below to open a support ticket.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" defaultValue={user?.name} placeholder="Your Name" required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={user?.email} placeholder="Your Email Address" required/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" name="subject" placeholder="e.g., Issue with Passport Application" required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" name="message" placeholder="Please describe your issue in detail." required/>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Submit Ticket</Button>
                    </CardFooter>
                </Card>
            </form>

        </div>

      </div>
    </DashboardLayout>
  );
}
