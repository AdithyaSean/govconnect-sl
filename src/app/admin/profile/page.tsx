

"use client";

import { AdminLayout } from "@/components/admin-layout";
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
import { useToast } from "@/hooks/use-toast";
import { FormEvent, useRef, useState, ChangeEvent, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";

export default function AdminProfilePage() {
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarSrc, setAvatarSrc] = useState("https://placehold.co/100x100");
    
    useEffect(() => {
        const savedAvatar = localStorage.getItem('adminAvatar');
        if (savedAvatar) {
            setAvatarSrc(savedAvatar);
        }
    }, []);


    const handleUpdatePassword = (e: FormEvent) => {
        e.preventDefault();
        toast({
            title: "Password Updated",
            description: "Your password has been changed successfully. You will be logged out for security.",
        });
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 500 * 1024) { // 500KB limit
                toast({ title: "File too large", description: "Please select an image smaller than 500KB.", variant: "destructive"});
                return;
            }

            setUploading(true);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result as string;
                // For the simulated admin, we'll use localStorage.
                localStorage.setItem('adminAvatar', base64String);
                setAvatarSrc(base64String);
                toast({
                    title: "Profile Picture Updated",
                    description: "Your new avatar has been saved.",
                });
                setUploading(false);
                // Force a reload to update the layout
                window.location.reload();
            };
            reader.onerror = (error) => {
                 toast({ title: "File Read Error", variant: "destructive"});
                 setUploading(false);
            }
        }
    };

  return (
    <AdminLayout>
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
                                <AvatarImage src={avatarSrc} alt="Admin" data-ai-hint="avatar user" />
                                <AvatarFallback>A</AvatarFallback>
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
                        <CardTitle>Admin User</CardTitle>
                        <CardDescription>admin@gov.lk</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-center">
                        <p className="font-semibold">Role: <span className="font-normal">Super Admin</span></p>
                        <p className="font-semibold">Joined: <span className="font-normal">2024-01-01</span></p>
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
