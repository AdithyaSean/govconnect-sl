import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Wrench className="h-20 w-20 text-primary mb-6" />
        <h1 className="text-4xl font-bold mb-2">Under Maintenance</h1>
        <p className="text-lg text-muted-foreground max-w-md">
            Our platform is currently undergoing scheduled maintenance to improve our services. We apologize for any inconvenience and will be back online shortly.
        </p>
    </div>
  );
}
