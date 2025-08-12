
"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, writeBatch, Timestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

const seedData = {
    users: [
        // Citizens
        { id: "user-nimal-silva", name: "Nimal Silva", email: "", nic: "199012345V", role: "Citizen", status: "Active" },
        { id: "user-kamala-perera", name: "Kamala Perera", email: "", nic: "198523456V", role: "Citizen", status: "Active" },
        // Admin
        { id: "super-admin-01", name: "S. Weerasinghe", email: "admin@gov.lk", nic: "", role: "Super Admin", status: "Active" },
        // Workers
        { id: "worker-transport-01", name: "Ravi Fernando", email: "worker.transport@gov.lk", nic: "", role: "worker_transport", status: "Active" },
        { id: "worker-transport-02", name: "Anura Bandara", email: "worker.transport.2@gov.lk", nic: "", role: "worker_transport", status: "Active" },
        { id: "worker-immigration-01", name: "Priya Sharma", email: "worker.immigration@gov.lk", nic: "", role: "worker_immigration", status: "Active" },
        { id: "worker-identity-01", name: "Janaka Pathirana", email: "worker.identity@gov.lk", nic: "", role: "worker_identity", status: "Active" },
        { id: "worker-missingdocs-01", name: "Fathima Rizvi", email: "worker.missingdocuments@gov.lk", nic: "", role: "worker_missingdocuments", status: "Active" },
        { id: "worker-support-01", name: "Saman Kumara", email: "worker.support@gov.lk", nic: "", role: "worker_support", status: "Active" },
        { id: "worker-support-02", name: "Deepa Edirisinghe", email: "worker.support.2@gov.lk", nic: "", role: "worker_support", status: "Active" },
        { id: "worker-health-01", name: "Dr. L. Ranaweera", email: "worker.health@gov.lk", nic: "", role: "worker_health", status: "Active"},
        { id: "worker-tax-01", name: "T. Ekanayake", email: "worker.tax@gov.lk", nic: "", role: "worker_tax", status: "Active"},
        { id: "worker-pension-01", name: "M. de Zoysa", email: "worker.pension@gov.lk", nic: "", role: "worker_pension", status: "Active"},
        { id: "worker-landregistry-01", name: "K. Jayasuriya", email: "worker.landregistry@gov.lk", nic: "", role: "worker_landregistry", status: "Active"},
        { id: "worker-exams-01", name: "Professor A. Perera", email: "worker.exams@gov.lk", nic: "", role: "worker_exams", status: "Active"},
        { id: "worker-finepayment-01", name: "Inspector Silva", email: "worker.finepayment@gov.lk", nic: "", role: "worker_finepayment", status: "Active"},
        { id: "worker-vehicles-01", name: "Vehicle Registrar", email: "worker.registeredvehicles@gov.lk", nic: "", role: "worker_registeredvehicles", status: "Active"},
    ],
    applications: [
        { user: "Nimal Silva", userId: "user-nimal-silva", service: "Renew Driving License", status: "In Progress", submitted: new Date("2024-07-20") },
        { user: "Nimal Silva", userId: "user-nimal-silva", service: "Passport Renewal", status: "Approved", submitted: new Date("2024-06-15") },
        { user: "Nimal Silva", userId: "user-nimal-silva", service: "Fine Payment", status: "Completed", submitted: new Date("2024-07-10") },
        { user: "Kamala Perera", userId: "user-kamala-perera", service: "National ID Services", status: "Pending", submitted: new Date("2024-07-22") },
        { user: "Kamala Perera", userId: "user-kamala-perera", service: "Registered Vehicles", status: "In Review", submitted: new Date("2024-05-30") },
        { user: "Kamala Perera", userId: "user-kamala-perera", service: "Missing Documents", status: 'Pending Payment', submitted: new Date("2024-07-25") },
    ],
    fines: [
        { id: "TFC-2024-001", type: "Speeding Violation", issuedDate: "2024-07-01", amount: "2000.00", dueDate: "2024-07-15", status: "Paid", nic: "199012345V" },
        { id: "PRK-2024-015", type: "Parking Violation", issuedDate: "2024-07-18", amount: "1500.00", dueDate: "2024-08-01", status: "Pending", nic: "198523456V" },
        { id: "TFC-2024-002", type: "Reckless Driving", issuedDate: "2024-06-10", amount: "5000.00", dueDate: "2024-06-24", status: "Paid", nic: "199012345V" },
    ],
    vehicles: [
        { id: "ABC-1234", type: "Car", licensePlate: "CBA-4321", registrationDate: "2020-01-15", chassisNumber: "VEHCHASSIS12345", status: "Active", insuranceExpiry: "2025-01-14", emissionTestExpiry: "2024-12-20", nic: "199012345V" },
        { id: "XYZ-5678", type: "Motorcycle", licensePlate: "BCA-9876", registrationDate: "2018-05-20", chassisNumber: "VEHCHASSIS67890", status: "Active", insuranceExpiry: "2024-08-30", emissionTestExpiry: "2024-10-15", nic: "198523456V" },
    ],
    payments: [
        { service: "Fine Payment", date: new Date("2024-07-10"), amount: "2000.00", status: "Success", userId: "user-nimal-silva" },
        { service: "Passport Renewal Fee", date: new Date("2024-06-15"), amount: "3500.00", status: "Success", userId: "user-nimal-silva" },
        { service: "Driving License Renewal", date: new Date("2023-08-01"), amount: "2500.00", status: "Success", userId: "user-kamala-perera" },
    ],
    supportTickets: [
        { name: "Nimal Silva", email: "nimal.s@example.com", subject: "Passport photo upload failed", message: "I tried to upload my photo for passport renewal, but it keeps giving me an error. Can you please help?", status: "Open", submittedAt: new Date("2024-07-28"), userNic: "199012345V", userId: "user-nimal-silva", reply: ""},
        { name: "Kamala Perera", email: "kamala.p@example.com", subject: "Question about NIC status", message: "My NIC application has been pending for 3 weeks. What is the current status?", status: "Closed", submittedAt: new Date("2024-07-25"), userNic: "198523456V", userId: "user-kamala-perera", reply: "Dear Kamala, your application has been processed and your NIC has been dispatched. You should receive it within 5 working days."},
    ]
};

const PASSWORD = "password123";

export default function SeedPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [logs, setLogs] = useState<string[]>([]);
    const [userUidMap, setUserUidMap] = useState<{[key: string]: string}>({});

    const addLog = (message: string) => {
        setLogs(prevLogs => [...prevLogs, message]);
    };

    const handleSeed = async () => {
        setLoading(true);
        setStatus("idle");
        setLogs([]);
        const tempUserUidMap: {[key: string]: string} = {};

        addLog("Starting database reset...");

        try {
            // Step 1: Create/Update all users in Firebase Auth and Firestore
            addLog(`Found ${seedData.users.length} users to process...`);
            for (const user of seedData.users) {
                 const authEmail = user.role === 'Citizen' ? `${user.nic}@citizen.gov.lk` : user.email;
                let authUserUid = '';
                try {
                    addLog(`Processing user: ${user.name} (${authEmail})`);
                    const userCredential = await createUserWithEmailAndPassword(auth, authEmail, PASSWORD);
                    authUserUid = userCredential.user.uid;
                    addLog(` -> Successfully created auth user: ${authUserUid}`);

                } catch (error: any) {
                    if (error.code === 'auth/email-already-in-use') {
                        addLog(` -> Auth user already exists. Signing in to get UID...`);
                        const userCredential = await signInWithEmailAndPassword(auth, authEmail, PASSWORD);
                        authUserUid = userCredential.user.uid;
                        await signOut(auth); // Sign out after operation
                        addLog(` -> UID is ${authUserUid}.`);
                    } else {
                        addLog(` -> Error creating user ${user.name}: ${error.message}`);
                        throw error;
                    }
                }

                const userRef = doc(db, "users", authUserUid);
                // Use the original ID for the map, but the new auth UID for the document ID and 'id' field
                tempUserUidMap[user.id] = authUserUid;
                await setDoc(userRef, { ...user, id: authUserUid, joined: Timestamp.now() });
                addLog(` -> Successfully created/updated Firestore profile for ${user.name} with ID ${authUserUid}.`);
            }
            
            setUserUidMap(tempUserUidMap); // Set the map state

            // Step 2: Seed other collections
            addLog("Seeding other collections (applications, fines, etc.)...");
            const batch = writeBatch(db);

            seedData.applications.forEach(app => {
                const appRef = doc(collection(db, "applications"));
                const userId = tempUserUidMap[app.userId] || app.userId;
                batch.set(appRef, { ...app, submitted: Timestamp.fromDate(app.submitted), userId: userId });
            });

            seedData.fines.forEach(fine => {
                const fineRef = doc(db, "fines", fine.id);
                batch.set(fineRef, fine);
            });

            seedData.vehicles.forEach(vehicle => {
                const vehicleRef = doc(db, "vehicles", vehicle.id);
                batch.set(vehicleRef, vehicle);
            });
            
            seedData.payments.forEach(payment => {
                const paymentRef = doc(collection(db, "payments"));
                const userId = tempUserUidMap[payment.userId] || payment.userId;
                batch.set(paymentRef, { ...payment, date: Timestamp.fromDate(payment.date), userId: userId });
            });
            
            seedData.supportTickets.forEach(ticket => {
                const ticketRef = doc(collection(db, "supportTickets"));
                const userId = tempUserUidMap[ticket.userId] || ticket.userId;
                batch.set(ticketRef, { ...ticket, submittedAt: Timestamp.fromDate(ticket.submittedAt), userId: userId });
            });

            await batch.commit();
            addLog("All collections seeded successfully.");
            setStatus("success");
        } catch (error) {
            console.error("Error seeding database: ", error);
            addLog(`Seeding failed: ${error}`);
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted p-4">
            <Card className="max-w-3xl w-full">
                <CardHeader>
                    <CardTitle>Database Seeder & Resetter</CardTitle>
                    <CardDescription>
                        Use this utility to populate your Firestore database with a clean set of sample data.
                        It creates auth users and overwrites database records.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-destructive-foreground bg-destructive p-3 rounded-md">
                        <span className="font-bold">Warning:</span> This action is irreversible. It will create new users if they don't exist and completely overwrite existing Firestore data for all sample users and related collections.
                    </p>
                    <Button onClick={handleSeed} disabled={loading} className="w-full text-lg py-6">
                        {loading ? "Resetting and Seeding..." : "Reset & Seed Database"}
                    </Button>

                    {logs.length > 0 && (
                        <Card className="bg-background">
                            <CardHeader>
                                <CardTitle className="text-lg">Seeder Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-xs bg-muted p-4 rounded-lg max-h-60 overflow-y-auto font-mono">
                                    {logs.join('\n')}
                                </pre>
                            </CardContent>
                        </Card>
                    )}

                    {status === 'success' && (
                        <Alert variant="default" className="bg-green-50 border-green-200">
                           <CheckCircle className="h-4 w-4 text-green-600" />
                           <AlertTitle className="text-green-800">Seeding Successful!</AlertTitle>
                           <AlertDescription className="text-green-700">
                               Your database has been reset and populated with sample data. You can now use the application. The default password for all users is `password123`.
                                <div className="mt-4 flex gap-4">
                                     <Button asChild variant="outline">
                                         <Link href="/login">Go to Citizen Login</Link>
                                     </Button>
                                     <Button asChild>
                                        <Link href="/admin/login">Go to Admin/Worker Login</Link>
                                     </Button>
                                </div>
                           </AlertDescription>
                        </Alert>
                    )}

                    {status === 'error' && (
                         <Alert variant="destructive">
                           <AlertTriangle className="h-4 w-4" />
                           <AlertTitle>Seeding Failed</AlertTitle>
                           <AlertDescription>
                             There was an error populating the database. Check the seeder log above and the browser console for more details.
                           </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
