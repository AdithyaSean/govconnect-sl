import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        </div>
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Site Configuration</CardTitle>
                    <CardDescription>Manage global settings for the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="maintenance-mode" className="text-base">Maintenance Mode</Label>
                        <Switch id="maintenance-mode" />
                    </div>
                     <p className="text-sm text-muted-foreground">When enabled, users will see a maintenance page. Admins can still log in.</p>
                </CardContent>
                 <CardFooter>
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Super Admin Actions</CardTitle>
                    <CardDescription>High-level administrative actions.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline">Generate System Report</Button>
                    <Button variant="outline">View Audit Logs</Button>
                    <Button variant="destructive">Clear System Cache</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
