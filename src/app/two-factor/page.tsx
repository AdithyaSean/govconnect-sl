
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { UserSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TwoFactorPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // If a user is not being loaded and is not present, they shouldn't be here.
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this code would be verified. For now, we proceed.
    router.push('/dashboard');
  }

  if (loading || !user) {
      return (
         <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                    <Skeleton className="h-4 w-full mx-auto mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                   <Skeleton className="h-10 w-full" />
                   <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
               <UserSquare className="h-12 w-12 text-primary" />
            </div>
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>
            We've sent a verification code to your registered mobile number ending in ****567. For this demo, any code will work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor="2fa-code">Authentication Code</Label>
                <Input
                    id="2fa-code"
                    type="text"
                    placeholder="123456"
                    required
                />
                </div>
                <Button type="submit" className="w-full">
                    Verify
                </Button>
            </div>
          </form>
           <div className="mt-4 text-center text-sm">
            <button className="underline text-sm">Resend code</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
