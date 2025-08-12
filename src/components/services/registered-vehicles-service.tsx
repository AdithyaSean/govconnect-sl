
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, FormEvent } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, addDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import type { Vehicle } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FileUpload } from '../file-upload';

type UploadedFilesState = {
  [key: string]: string;
};

export function RegisteredVehiclesService({ service }) {
    const { toast } = useToast();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [registrationFiles, setRegistrationFiles] = useState<UploadedFilesState>({});
    const [transferFiles, setTransferFiles] = useState<UploadedFilesState>({});

    const fetchVehicles = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        // Query vehicles collection where the NIC matches the current user's NIC
        const q = query(collection(db, "vehicles"), where("nic", "==", user.nic));
        try {
            const querySnapshot = await getDocs(q);
            const vehiclesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
        } catch (error) {
            console.error("Error fetching vehicles: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, [user]);

    const handleDownload = (plate: string) => {
        toast({
            title: "Download Started",
            description: `Downloading registration for vehicle ${plate}.`,
        });
    };

    const handleRegistrationSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return toast({ title: "Please log in.", variant: "destructive"});
        
        const formData = new FormData(e.target as HTMLFormElement);
        const registrationDetails = Object.fromEntries(formData.entries());

        try {
            await addDoc(collection(db, "applications"), {
                service: "New Vehicle Registration",
                userId: user.id,
                user: user.name,
                status: "Pending",
                submitted: serverTimestamp(),
                details: registrationDetails,
                documents: registrationFiles
            });
            toast({ title: "Registration Submitted", description: "Your application is under review. You will be notified upon approval."});
        } catch(err) {
            toast({ title: "Submission Failed", variant: "destructive"});
        }
    };
    
    const handleTransferSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return toast({ title: "Please log in.", variant: "destructive"});

        const formData = new FormData(e.target as HTMLFormElement);
        const transferDetails = Object.fromEntries(formData.entries());

        try {
            await addDoc(collection(db, "applications"), {
                service: "Vehicle Ownership Transfer",
                userId: user.id,
                user: user.name,
                status: "Pending",
                submitted: serverTimestamp(),
                details: transferDetails,
                documents: transferFiles
            });
            toast({ title: "Transfer Request Submitted", description: "Your request is under review. You will be notified upon approval."});
        } catch(err) {
            toast({ title: "Submission Failed", variant: "destructive"});
        }
    };

  
    return (
        <Tabs defaultValue="my-vehicles" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="my-vehicles">My Vehicles</TabsTrigger>
                <TabsTrigger value="register">Register New Vehicle</TabsTrigger>
                <TabsTrigger value="transfer">Transfer Ownership</TabsTrigger>
            </TabsList>
            <TabsContent value="my-vehicles">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Registered Vehicles</CardTitle>
                        <CardDescription>
                            Below is a list of all vehicles registered under your NIC.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>License Plate</TableHead>
                                        <TableHead>Vehicle Type</TableHead>
                                        <TableHead>Registration Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Chassis Number</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 2 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={6}>
                                                <Skeleton className="h-8 w-full" />
                                            </TableCell>
                                        </TableRow>
                                        ))
                                    ) : vehicles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24">You have no vehicles registered.</TableCell>
                                        </TableRow>
                                    ) : (
                                        vehicles.map((vehicle) => (
                                            <TableRow key={vehicle.id}>
                                                <TableCell className="font-medium">{vehicle.licensePlate}</TableCell>
                                                <TableCell>{vehicle.type}</TableCell>
                                                <TableCell>{vehicle.registrationDate}</TableCell>
                                                <TableCell>
                                                    <Badge variant={vehicle.status === 'Active' ? 'default' : 'secondary'}
                                                        className={vehicle.status === 'Active' ? 'bg-green-600' : ''}>
                                                        {vehicle.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{vehicle.chassisNumber}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleDownload(vehicle.licensePlate)}>
                                                        <Download className="h-4 w-4" />
                                                        <span className="sr-only">Download Certificate</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-4">
                        <h3 className="font-semibold">Important Dates</h3>
                        <div className="flex flex-wrap gap-4">
                            {vehicles.map(vehicle => (
                                <div key={vehicle.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50 text-sm">
                                    <Bell className="h-4 w-4 text-primary" />
                                    <div>
                                        <span className="font-semibold">{vehicle.licensePlate}: </span>
                                        <span className="text-muted-foreground">Insurance expires on {vehicle.insuranceExpiry}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardFooter>
                </Card>
            </TabsContent>
             <TabsContent value="register">
                <form onSubmit={handleRegistrationSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>New Vehicle Registration</CardTitle>
                            <CardDescription>Fill in the details below to register a new vehicle.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-plate">License Plate</Label>
                                    <Input id="reg-plate" name="licensePlate" placeholder="e.g., CBA-1234" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-type">Vehicle Type</Label>
                                    <Input id="reg-type" name="vehicleType" placeholder="e.g., Car, Motorcycle" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="reg-make">Make</Label>
                                    <Input id="reg-make" name="make" placeholder="e.g., Toyota, Honda" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-model">Model</Label>
                                    <Input id="reg-model" name="model" placeholder="e.g., Corolla, Civic" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="reg-year">Year of Manufacture</Label>
                                    <Input id="reg-year" name="year" type="number" placeholder="e.g., 2023" />
                                </div>
                            </div>
                             <FileUpload 
                                label="Bill of Sale / Invoice" 
                                id="bill-of-sale-upload"
                                onUploadComplete={(b64) => setRegistrationFiles(p => ({...p, billOfSale: b64}))}
                                onFileRemove={() => setRegistrationFiles(p => { delete p.billOfSale; return {...p}})}
                            />
                             <FileUpload 
                                label="Import Documents / Previous Registration"
                                id="import-docs-upload"
                                onUploadComplete={(b64) => setRegistrationFiles(p => ({...p, importDocs: b64}))}
                                onFileRemove={() => setRegistrationFiles(p => { delete p.importDocs; return {...p}})}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Submit for Registration</Button>
                        </CardFooter>
                    </Card>
                </form>
            </TabsContent>
             <TabsContent value="transfer">
                <form onSubmit={handleTransferSubmit}>
                    <Card>
                         <CardHeader>
                            <CardTitle>Transfer Vehicle Ownership</CardTitle>
                            <CardDescription>Enter the license plate of the vehicle and provide the new owner's details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="transfer-plate">Vehicle License Plate to Transfer</Label>
                                <Input id="transfer-plate" name="vehicleToTransfer" placeholder="e.g., CBA-1234" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-owner-name">New Owner's Full Name</Label>
                                    <Input id="new-owner-name" name="newOwnerName" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-owner-nic">New Owner's NIC</Label>
                                    <Input id="new-owner-nic" name="newOwnerNic" />
                                </div>
                            </div>
                             <FileUpload 
                                label="Signed Transfer Papers (MTA-6)" 
                                id="transfer-papers-upload"
                                onUploadComplete={(b64) => setTransferFiles(p => ({...p, transferPapers: b64}))}
                                onFileRemove={() => setTransferFiles(p => { delete p.transferPapers; return {...p}})}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Submit Transfer Request</Button>
                        </CardFooter>
                    </Card>
                </form>
            </TabsContent>
        </Tabs>
    );
}
