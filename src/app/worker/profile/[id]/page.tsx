
"use client";

import { use, useEffect, useState, FormEvent, useRef, ChangeEvent } from "react";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Loader2 } from "lucide-react";

export default function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { toast } = useToast();
    const [worker, setWorker] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchWorker = async () => {
        if (id) {
            setLoading(true);
            try {
                const userDoc = await getDoc(doc(db, "users", id));
                if (userDoc.exists()) {
                    const userData = { id: userDoc.id, ...userDoc.data() } as User;
                    if (userData.role.startsWith('worker_') || userData.role === 'Super Admin') {
                        setWorker(userData);
                    } else {
                       notFound(); // Not a worker or admin
                    }
                } else {
                    notFound();
                }
            } catch (error) {
                console.error("Error fetching worker data:", error);
                notFound();
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchWorker();
    }, [id]);

    const handleUpdatePassword = (e: FormEvent) => {
        e.preventDefault();
        toast({
            title: "Password Updated",
            description: "Your password has been changed successfully. You will be logged out.",
        });
        // In a real app, you would log the user out here.
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !worker) {
            return;
        }

        const file = event.target.files[0];
        if (file.size > 500 * 1024) { // 500KB limit
            toast({ title: "File too large", description: "Please select an image smaller than 500KB.", variant: "destructive"});
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64String = reader.result as string;
                const userDocRef = doc(db, "users", worker.id);
                await updateDoc(userDocRef, { photoURL: base64String });

                toast({ title: "Success", description: "Profile picture updated successfully!"});
                fetchWorker(); // Refetch worker data
            } catch (error) {
                console.error("Error uploading file: ", error);
                toast({ title: "Upload Failed", variant: "destructive" });
            } finally {
                setUploading(false);
            }
        };
        reader.onerror = (error) => {
             toast({ title: "File Read Error", variant: "destructive"});
             setUploading(false);
        }
    };


    if (loading) {
        return (
            <AdminLayout workerMode>
                <div className="flex-1 space-y-8 p-8 pt-6">
                    <Skeleton className="h-10 w-1/2" />
                     <div className="grid gap-8 md:grid-cols-3">
                        <div className="md:col-span-1">
                            <Skeleton className="h-64 w-full" />
                        </div>
                        <div className="md:col-span-2">
                             <Skeleton className="h-48 w-full" />
                        </div>
                     </div>
                </div>
            </AdminLayout>
        )
    }

    if (!worker) {
        return notFound();
    }

  return (
    <AdminLayout workerMode>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                 <Card>
                    <CardHeader className="text-center">
                        <div className="relative mx-auto w-24 h-24 mb-4 group cursor-pointer" onClick={handleAvatarClick}>
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={worker.photoURL || "https://placehold.co/100x100"} alt={worker.name} data-ai-hint="avatar user" />
                                <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {uploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg"
                                disabled={uploading}
                            />
                        </div>
                        <CardTitle>{worker.name}</CardTitle>
                        <CardDescription>{worker.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-center">
                        <p className="font-semibold">Role: <span className="font-normal">{worker.role}</span></p>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                 <form onSubmit={handleUpdatePassword}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Update Password</CardTitle>
                            <CardDescription>
                            Change your password here. After saving, you'll be logged out for security purposes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" required />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Update Password</Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
      </div>
    </AdminLayout>
  );
}
