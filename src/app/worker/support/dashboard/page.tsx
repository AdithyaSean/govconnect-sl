
"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import type { SupportTicket } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function WorkerSupportDashboard() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const { toast } = useToast();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "supportTickets"));
      const ticketsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
      setTickets(ticketsData.sort((a, b) => (b.submittedAt as Timestamp).toMillis() - (a.submittedAt as Timestamp).toMillis()));
    } catch (error) {
      console.error("Error fetching support tickets: ", error);
    } finally {
      setLoading(false);
    }
  };
  
  const createNotification = async (userId: string, title: string, description: string, href: string) => {
    try {
        await addDoc(collection(db, "notifications"), {
            userId,
            title,
            description,
            href,
            icon: "MessageSquare",
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  const formatDate = (date: Timestamp | string) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return new Date(date).toLocaleString();
    return date.toDate().toLocaleString();
  };

  const handleOpenReplyDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyMessage(""); // Clear previous reply message
  };
  
  const handleUpdateTicket = async (updates: Partial<SupportTicket>) => {
    if (!selectedTicket) return;
    try {
      const ticketRef = doc(db, "supportTickets", selectedTicket.id);
      await updateDoc(ticketRef, updates);
      return true;
    } catch (error) {
      console.error("Error updating ticket: ", error);
      toast({
          title: "Error",
          description: "Failed to update ticket. Please try again.",
          variant: "destructive"
      });
      return false;
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    const newReply = `${selectedTicket.reply || ''}\n\n[Support Reply on ${new Date().toLocaleString()}]:\n${replyMessage}`;
    const success = await handleUpdateTicket({ reply: newReply, status: "In Progress" });
    if(success) {
       toast({
            title: "Reply Sent",
            description: "The user has been notified of your response.",
        });
        
        if (selectedTicket.userId) {
            await createNotification(
                selectedTicket.userId,
                "Reply to your support ticket",
                `You have a new reply for your ticket: "${selectedTicket.subject}"`,
                "/support"
            );
        }

        setSelectedTicket(null);
        setReplyMessage("");
        fetchTickets(); // Refresh the list
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    const success = await handleUpdateTicket({ status: "Closed" });
    if(success) {
        toast({
            title: "Ticket Closed",
            description: "The support ticket has been marked as closed.",
        });
        
        if (selectedTicket.userId) {
            await createNotification(
                selectedTicket.userId,
                "Support ticket closed",
                `Your support ticket "${selectedTicket.subject}" has been closed.`,
                "/support"
            );
        }

        setSelectedTicket(null);
        setReplyMessage("");
        fetchTickets();
    }
  };


  return (
    <AdminLayout workerMode>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Support Inbox</h1>
            <Button onClick={fetchTickets}>Refresh Tickets</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>User Support Tickets</CardTitle>
            <CardDescription>View and respond to inquiries submitted by users.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Submitted On</TableHead>
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
                ) : tickets.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No support tickets found.</TableCell>
                    </TableRow>
                ) : tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                        <div className="font-medium">{ticket.name}</div>
                        <div className="text-sm text-muted-foreground">{ticket.email}</div>
                    </TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>{formatDate(ticket.submittedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === 'Open' ? 'destructive' : ticket.status === 'In Progress' ? 'secondary' : 'default'}
                       className={ticket.status === 'Closed' ? 'bg-green-600' : ''}
                      >
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="sm" onClick={() => handleOpenReplyDialog(ticket)}>
                           {'View / Reply'}
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <Dialog open={!!selectedTicket} onOpenChange={(isOpen) => !isOpen && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-2xl">
            {selectedTicket && (
                 <>
                    <DialogHeader>
                        <DialogTitle>Reply to Ticket: {selectedTicket.subject}</DialogTitle>
                        <DialogDescription>
                            From: {selectedTicket.name} ({selectedTicket.email}) on {formatDate(selectedTicket.submittedAt)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-6">
                        <Card className="bg-muted p-4">
                            <h4 className="font-semibold mb-2">User's Message History:</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
                        </Card>
                        {selectedTicket.reply && (
                             <Card className="bg-blue-50 p-4 border-blue-200">
                                <h4 className="font-semibold mb-2 text-blue-900">Your Reply History:</h4>
                                <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedTicket.reply}</p>
                            </Card>
                        )}
                        <div className="space-y-2">
                           <Label htmlFor="reply-message" className="text-left font-semibold">
                                Your New Reply
                           </Label>
                           <Textarea
                                id="reply-message"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                rows={6}
                                placeholder="Type your response here..."
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full">
                        <div>
                             {selectedTicket.status !== "Closed" && (
                                <Button type="button" variant="destructive" onClick={handleCloseTicket}>
                                    Mark as Closed
                                </Button>
                             )}
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="button" onClick={handleSendReply}>Send Reply</Button>
                        </div>
                    </DialogFooter>
                 </>
            )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
