
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Loader2 } from "lucide-react";
import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("personal-info");
  const { user, loading, refetch } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', nic: '', contactNumber: '+94 77 123 4567' });

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        nic: user.nic || '',
        contactNumber: '+94 77 123 4567' // This can be updated if stored in user doc
      });
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
        return;
    }

    const file = event.target.files[0];
    if (file.size > 500 * 1024) { // 500KB limit for base64
        toast({ title: "File too large", description: "Please select an image smaller than 500KB.", variant: "destructive"});
        return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        try {
            const base64String = reader.result as string;
            const userDocRef = doc(db, "users", user.id);
            await updateDoc(userDocRef, { photoURL: base64String });

            toast({ title: "Success", description: "Profile picture updated successfully!"});
            refetch(); // Refetch user data to show the new picture
        } catch (error) {
            console.error("Error uploading file: ", error);
            toast({ title: "Upload Failed", description: "Could not upload your profile picture. Please try again.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };
    reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({ variant: "destructive", title: "File Read Error", description: "Could not process the selected file." });
        setUploading(false);
    };
  };

  if (loading || !user) {
    return (
        <DashboardLayout>
             <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-10 w-1/2" />
                 <Card>
                    <CardHeader className="text-center">
                        <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                        <Skeleton className="h-8 w-1/3 mx-auto" />
                        <Skeleton className="h-6 w-1/2 mx-auto" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
             </div>
        </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
              <TabsTrigger value="personal-info">Personal Information</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="personal-info">
                <Card>
                    <CardHeader className="text-center">
                         <div className="relative mx-auto w-24 h-24 mb-4 group cursor-pointer" onClick={handleAvatarClick}>
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={user.photoURL || `https://placehold.co/100x100`} alt={user.name} data-ai-hint="avatar user" />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
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
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <div className="space-y-1">
                            <Label htmlFor="name">Full Name</Label>
                             <Input id="name" value={formData.name} disabled />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                             <Input id="email" value={formData.email} disabled />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="nic">NIC Number</Label>
                             <Input id="nic" value={formData.nic} disabled />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="contactNumber">Contact Number</Label>
                             <Input id="contactNumber" value={formData.contactNumber} disabled />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="password">
                 <Card>
                    <CardHeader>
                        <CardTitle>Update Password</CardTitle>
                        <CardDescription>
                        Change your password here. After saving, you'll be logged out for security purposes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-w-2xl mx-auto">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-start max-w-2xl mx-auto">
                         <Button type="submit">Update Password</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
