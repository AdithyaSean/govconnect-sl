
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '../file-upload';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar } from '../ui/calendar';
import { useState, FormEvent, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Label } from '../ui/label';
import { Download } from 'lucide-react';

type UploadedFilesState = {
  [key: string]: string;
};

const vaccinationRecords = [
    { name: "COVID-19 (Dose 1)", date: "2021-06-15", provider: "National Hospital" },
    { name: "COVID-19 (Dose 2)", date: "2021-08-20", provider: "National Hospital" },
    { name: "Tetanus Toxoid", date: "2018-03-10", provider: "Local Clinic" },
];

const medicalReports = [
    { name: "Full Blood Count Report", date: "2023-11-05", id: "REP-001" },
    { name: "X-Ray Chest Report", date: "2022-09-21", id: "REP-002" },
]

const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"];

export function HealthServicesService({ service }) {
    const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
    const [appointmentTime, setAppointmentTime] = useState<string>("");
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesState>({});
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        setAppointmentDate(new Date());
    }, []);

    const handleUploadComplete = (docName: string, base64: string) => {
        setUploadedFiles(prev => ({ ...prev, [docName]: base64 }));
    };
    
    const handleFileRemove = (docName: string) => {
        setUploadedFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[docName];
            return newFiles;
        });
    }

    const handleIdCardSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Please log in.", variant: "destructive" });
            return;
        }
        if(!uploadedFiles.nicOrBirthCert || !uploadedFiles.photo) {
            toast({ title: "Please upload both documents.", variant: "destructive" });
            return;
        }
        
        try {
            await addDoc(collection(db, "applications"), {
                service: "National Medical ID Card Application",
                userId: user.id,
                user: user.name,
                status: "In Review",
                submitted: serverTimestamp(),
                documents: uploadedFiles,
            });
            toast({ title: "Application Submitted", description: "Your Medical ID Card application is under review." });
            router.push('/my-applications');
        } catch(error) {
            console.error(error);
            toast({ title: "Submission Failed", variant: "destructive"});
        }
    }
    
    const handleAppointmentSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Please log in.", variant: "destructive" });
            return;
        }

        const formData = new FormData(e.target as HTMLFormElement);
        const appointmentDetails = Object.fromEntries(formData.entries());
        
        if(!appointmentDetails.hospital || !appointmentDetails.speciality || !appointmentDate || !appointmentTime) {
             toast({ title: "Please select hospital, speciality, date, and time.", variant: "destructive" });
            return;
        }

        const finalAppointmentDate = new Date(appointmentDate);
        const [hours, minutes, ampm] = appointmentTime.match(/(\d{2}):(\d{2}) (AM|PM)/)!.slice(1);
        let numericHours = parseInt(hours, 10);
        if (ampm === 'PM' && numericHours !== 12) {
            numericHours += 12;
        }
        if (ampm === 'AM' && numericHours === 12) {
            numericHours = 0;
        }
        finalAppointmentDate.setHours(numericHours, parseInt(minutes, 10), 0, 0);
        
        try {
             await addDoc(collection(db, "applications"), {
                service: "Medical Appointment Request",
                userId: user.id,
                user: user.name,
                status: "Pending",
                submitted: serverTimestamp(),
                details: {
                    ...appointmentDetails,
                    appointmentDate: Timestamp.fromDate(finalAppointmentDate)
                }
            });
            toast({ title: "Appointment Requested", description: "Your request has been sent. You will be notified upon confirmation." });
            router.push('/my-applications');
        } catch(error) {
             console.error(error);
             toast({ title: "Request Failed", variant: "destructive"});
        }
    }


  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>My Vaccination Records</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vaccine Name</TableHead>
                            <TableHead>Date Administered</TableHead>
                            <TableHead>Provider</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vaccinationRecords.map((record) => (
                            <TableRow key={record.name}>
                                <TableCell className="font-medium">{record.name}</TableCell>
                                <TableCell>{record.date}</TableCell>
                                <TableCell>{record.provider}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <Button variant="outline">Download Full Report</Button>
             </CardFooter>
        </Card>
        
        <form onSubmit={handleAppointmentSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Book a Hospital/Clinic Appointment</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Hospital/Clinic</Label>
                            <Select name="hospital">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hospital-colombo">National Hospital, Colombo</SelectItem>
                                    <SelectItem value="hospital-kandy">Teaching Hospital, Kandy</SelectItem>
                                    <SelectItem value="clinic-galle">Family Clinic, Galle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Speciality/Service</Label>
                            <Select name="speciality">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a service" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="opd">General OPD</SelectItem>
                                    <SelectItem value="cardiology">Cardiology</SelectItem>
                                    <SelectItem value="dental">Dental</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Time</Label>
                             <Select onValueChange={setAppointmentTime} value={appointmentTime}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a time slot" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeSlots.map(slot => (
                                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        {appointmentDate ? <Calendar
                            mode="single"
                            selected={appointmentDate}
                            onSelect={setAppointmentDate}
                            className="rounded-md border"
                        /> : <div className="h-[290px] w-[280px] flex items-center justify-center"><p>Loading calendar...</p></div> }
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit">Request Appointment</Button>
                </CardFooter>
            </Card>
        </form>

        <form onSubmit={handleIdCardSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Apply for National Medical ID Card</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FileUpload
                        id="nic-bc-upload"
                        label="Upload Copy of NIC/Birth Certificate" 
                        onUploadComplete={(base64) => handleUploadComplete("nicOrBirthCert", base64)}
                        onFileRemove={() => handleFileRemove("nicOrBirthCert")}
                    />
                    <FileUpload
                        id="photo-upload-medical"
                        label="Upload Passport-size Photograph"
                        onUploadComplete={(base64) => handleUploadComplete("photo", base64)}
                        onFileRemove={() => handleFileRemove("photo")}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit">Submit Application</Button>
                </CardFooter>
            </Card>
        </form>

        <Card>
            <CardHeader>
                <CardTitle>Download Medical Reports</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Report Name</TableHead>
                            <TableHead>Date Issued</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {medicalReports.map((report) => (
                            <TableRow key={report.id}>
                                <TableCell className="font-medium">{report.name}</TableCell>
                                <TableCell>{report.date}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent>
                <p><strong>Suwa Seriya (Ambulance):</strong> 1990</p>
                <p><strong>National Hospital Colombo:</strong> 011-2691111</p>
            </CardContent>
        </Card>
    </div>
  );
}
