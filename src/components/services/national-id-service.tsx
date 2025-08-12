
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '../file-upload';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Calendar } from '../ui/calendar';
import { useState, FormEvent, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';


type UploadedFilesState = {
  [key: string]: string;
};

const STEPS = [
    { id: 1, name: 'Service Type' },
    { id: 2, name: 'Upload Documents' },
    { id: 3, name: 'Schedule Biometrics' },
    { id: 4, name: 'Submit' },
];

const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"];

export function NationalIdService({ service }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [serviceType, setServiceType] = useState("new-id");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesState>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setDate(new Date());
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
  
  const getDocumentsForServiceType = () => {
    switch (serviceType) {
        case 'new-id':
            return { "BirthCertificate": "Birth Certificate", "CertifiedPhoto": "Certified Photo", "GramaNiladhariCertificate": "Grama Niladhari Certificate" };
        case 'update-id':
            return { "CertifiedPhoto": "Certified Photo", "GramaNiladhariCertificate": "Grama Niladhari Certificate", "ProofOfChange": "Proof of Change (e.g., Marriage Cert.)" };
        case 'lost-id':
            return { "PoliceReport": "Police Report (for Lost ID)", "CertifiedPhoto": "Certified Photo" };
        default:
            return {};
    }
  }

  const requiredDocs = getDocumentsForServiceType();
  
  const validateStep = () => {
    if(currentStep === 2) {
       return Object.keys(requiredDocs).every(docKey => uploadedFiles[docKey]);
    }
     if (currentStep === 3) {
      return date && time;
    }
    return true;
  }

  const handleNext = () => {
    if(validateStep()){
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
        toast({
            title: "Incomplete Step",
            description: "Please upload all required documents and select an appointment date and time.",
            variant: "destructive"
        });
    }
  };
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "Please log in to submit.", variant: "destructive" });
        return;
    }
    if (!validateStep()) {
        toast({ title: "Please complete all steps.", variant: "destructive" });
        return;
    }
    
    const appointmentDateTime = new Date(date!);
    const [hours, minutes, ampm] = time.match(/(\d{2}):(\d{2}) (AM|PM)/)!.slice(1);
    let numericHours = parseInt(hours, 10);
    if (ampm === 'PM' && numericHours !== 12) {
        numericHours += 12;
    }
    if (ampm === 'AM' && numericHours === 12) {
        numericHours = 0;
    }
    appointmentDateTime.setHours(numericHours, parseInt(minutes, 10), 0, 0);

    try {
        await addDoc(collection(db, "applications"), {
            service: service.title,
            userId: user.id,
            user: user.name,
            status: "Pending",
            submitted: serverTimestamp(),
            documents: uploadedFiles,
            details: {
                serviceType,
                appointmentDate: Timestamp.fromDate(appointmentDateTime)
            }
        });
        toast({
            title: "Application Submitted",
            description: "Your National ID application has been received.",
        });
        router.push("/my-applications");
    } catch (error) {
        console.error("Error submitting application: ", error);
        toast({ title: "Submission Failed", description: "An error occurred. Please try again.", variant: "destructive"});
    }
  }

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
                <Input placeholder="Enter your Application Reference Number" />
                <Button>Check Status</Button>
            </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Application Process</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            {STEPS.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center text-center w-32">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2",
                                            currentStep > step.id ? "bg-green-600 border-green-600 text-white" : "",
                                            currentStep === step.id ? "border-primary" : "border-muted-foreground",
                                        )}>
                                            {currentStep > step.id ? <Check /> : step.id}
                                        </div>
                                        <p className={cn(
                                            "mt-2 text-sm",
                                            currentStep === step.id ? "font-bold text-primary" : "text-muted-foreground"
                                        )}>{step.name}</p>
                                    </div>
                                    {index < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-border -mx-4 mb-8"></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {currentStep === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 1: Select Service Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup defaultValue={serviceType} onValueChange={(value) => { setServiceType(value); setUploadedFiles({})}}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="new-id" id="r-new-id" />
                                    <Label htmlFor="r-new-id">Apply for New ID (First Time)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="update-id" id="r-update-id" />
                                    <Label htmlFor="r-update-id">Update Details on Existing ID</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="lost-id" id="r-lost-id" />
                                    <Label htmlFor="r-lost-id">Apply for Duplicate of Lost ID</Label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>
                )}
                
                {currentStep === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 2: Upload Required Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(requiredDocs).map(([key, label]) => {
                                const id = `file-upload-${serviceType}-${key}`;
                                return (
                                    <FileUpload
                                        key={id}
                                        id={id}
                                        label={label}
                                        onUploadComplete={(base64) => handleUploadComplete(key, base64)}
                                        onFileRemove={() => handleFileRemove(key)}
                                    />
                                )
                            })}
                        </CardContent>
                    </Card>
                )}

                {currentStep === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 3: Book an Appointment for Biometrics</CardTitle>
                            <CardDescription>Schedule a visit to your nearest Divisional Secretariat for fingerprint and photo capture.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8 items-start">
                             <div className="flex justify-center">
                                {date ? <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border"
                                    /> : <div className="h-[290px] w-[280px] flex items-center justify-center"><p>Loading calendar...</p></div> }
                             </div>
                             <div className="space-y-4">
                                <Label>Select Time Slot</Label>
                                <Select onValueChange={setTime} value={time}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeSlots.map(slot => (
                                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 4 && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Step 4: Review and Submit</CardTitle>
                            <CardDescription>Please review all your details from the previous steps. Click submit to complete your application.</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button size="lg" type="submit">Submit Application</Button>
                        </CardFooter>
                    </Card>
                )}

                 <div className="flex justify-between mt-8">
                    <div>
                    {currentStep > 1 && <Button type="button" variant="secondary" onClick={handleBack}>Back</Button>}
                    </div>
                    <div>
                        {currentStep < STEPS.length ? (
                            <Button type="button" onClick={handleNext}>Next</Button>
                        ) : null}
                    </div>
                </div>
            </div>
        </form>
    </div>
  );
}
