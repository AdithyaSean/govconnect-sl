
"use client";

import Link from "next/link";
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
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import type { User } from "@/lib/types";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Clear any previous session info
    localStorage.removeItem("workerId");
    localStorage.removeItem("workerRole");

    if (isAdmin) {
      // Simulate admin login
      router.push("/admin/dashboard");
      setLoading(false);
      return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({ title: "Login Failed", description: "No user profile found for this email.", variant: "destructive" });
            setLoading(false);
            return;
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as User;

        if (userData.role.startsWith("worker_")) {
            localStorage.setItem("workerId", userData.id);
            localStorage.setItem("workerRole", userData.role);
            let dashboardPath = userData.role.replace('worker_', '');
            if(dashboardPath === 'finepayment') dashboardPath = 'fine-payment';
            if(dashboardPath === 'registeredvehicles') dashboardPath = 'registered-vehicles';
            
            router.push(`/worker/${dashboardPath}/dashboard`);

        } else if (userData.role === "Super Admin" && email.endsWith('@gov.lk')) {
            router.push("/admin/dashboard");
        } else {
            toast({ title: "Access Denied", description: "This login is for authorized workers and admins only.", variant: "destructive" });
        }

    } catch (error: any) {
        console.error("Login error: ", error);
        if (error.code === 'auth/invalid-credential') {
          toast({ title: "Login Failed", description: "Invalid email or password. Please try again.", variant: "destructive" });
        } else {
          toast({ title: "An Error Occurred", description: "Something went wrong. Please try again.", variant: "destructive" });
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin & Worker Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@gov.lk or worker.transport@gov.lk"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="is-admin" checked={isAdmin} onCheckedChange={(checked) => setIsAdmin(checked as boolean)} />
                <Label htmlFor="is-admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Simulate Admin Login (No DB check)
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="underline">
              Return to Citizen Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
