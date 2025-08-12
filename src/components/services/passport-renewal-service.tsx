
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '../file-upload';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { FormEvent, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from '../ui/calendar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

type UploadedFilesState = {
  [key: string]: string;
};

const STEPS = [
    { id: 1, name: 'Service Type' },
    { id: 2, name: 'Application Form' },
    { id: 3, name: 'Upload Documents' },
    { id: 4, name: 'Schedule Biometrics' },
    { id: 5, name: 'Submit' },
];

const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"];

export function PassportRenewalService({ service }) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("");
  const [serviceType, setServiceType] = useState('renewal');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesState>({});
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [formValues, setFormValues] = useState({
      fullName: '',
      nicNumber: '',
      oldPassport: '',
      expiryDate: '',
      contactNumber: '',
      email: '',
  });

  useEffect(() => {
    if(user){
        setFormValues(prev => ({
            ...prev,
            fullName: user.name || '',
            nicNumber: user.nic || '',
            email: user.email || '',
        }));
    }
  }, [user]);

  const requiredDocs = serviceType === 'renewal' 
    ? { oldPassport: "Scanned Copy of Old Passport", photo: "Recent Passport-size Photograph", nic: "Copy of NIC" }
    : { birthCertificate: "Copy of Birth Certificate", photo: "Recent Passport-size Photograph", nic: "Copy of NIC" };

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

  const handleServiceTypeChange = (value: string) => {
    setServiceType(value);
    setUploadedFiles({}); // Reset uploads when changing service type
  }
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const validateStep = () => {
    if(currentStep === 2) {
        if(!formValues.fullName || !formValues.nicNumber || !formValues.contactNumber || !formValues.email) return false;
        if(serviceType === 'renewal' && (!formValues.oldPassport || !formValues.expiryDate)) return false;
    }
    if(currentStep === 3) {
        return Object.keys(requiredDocs).every(docKey => uploadedFiles[docKey]);
    }
     if(currentStep === 4) {
        return date !== undefined && time !== "";
    }
    return true;
  }

  const handleNext = () => {
    if(validateStep()){
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
        toast({
            title: "Incomplete Step",
            description: "Please fill all required fields, upload documents, or select a date and time before proceeding.",
            variant: "destructive"
        });
    }
  };
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "Please log in to submit.", variant: "destructive" });
        return;
    }
    
    if (!validateStep()) {
        toast({ title: "Please complete all steps before submitting.", variant: "destructive" });
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
            status: "Pending Payment",
            submitted: serverTimestamp(),
            documents: uploadedFiles,
            details: { ...formValues, appointmentDate: Timestamp.fromDate(appointmentDateTime), serviceType }
        });
        setShowPaymentDialog(true);
    } catch (error) {
         console.error("Error submitting application: ", error);
         toast({ title: "Submission Failed", description: "An error occurred. Please try again.", variant: "destructive"});
    }
  }

  return (
    <>
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
                                <div className="flex flex-col items-center text-center w-24">
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
                        <CardTitle>Step 1: Select Service</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup defaultValue={serviceType} onValueChange={handleServiceTypeChange} className="flex gap-8">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="renewal" id="r-renewal" />
                                <Label htmlFor="r-renewal">Renew Existing Passport</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new" id="r-new" />
                                <Label htmlFor="r-new">Apply for New Passport</Label>
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>
            )}

            {currentStep === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Step 2: {serviceType === 'renewal' ? 'Passport Renewal Form' : 'New Passport Application Form'}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" name="fullName" placeholder="As it appears on your NIC" required value={formValues.fullName} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nicNumber">NIC Number</Label>
                            <Input id="nicNumber" name="nicNumber" placeholder="e.g., 199012345V" required value={formValues.nicNumber} onChange={handleFormChange} />
                        </div>
                        {serviceType === 'renewal' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="oldPassport">Old Passport Number</Label>
                                    <Input id="oldPassport" name="oldPassport" placeholder="e.g., N1234567" required value={formValues.oldPassport} onChange={handleFormChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expiryDate">Date of Expiry</Label>
                                    <Input id="expiryDate" name="expiryDate" type="date" required value={formValues.expiryDate} onChange={handleFormChange} />
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="contactNumber">Contact Number</Label>
                            <Input id="contactNumber" name="contactNumber" type="tel" placeholder="+94 77 123 4567" required value={formValues.contactNumber} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" placeholder="you@example.com" required value={formValues.email} onChange={handleFormChange}/>
                        </div>
                    </CardContent>
                </Card>
            )}

            {currentStep === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Step 3: Upload Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {Object.entries(requiredDocs).map(([key, label]) => (
                             <FileUpload 
                                key={key}
                                id={`file-upload-${key}`}
                                label={label}
                                onUploadComplete={(base64) => handleUploadComplete(key, base64)}
                                onFileRemove={() => handleFileRemove(key)}
                            />
                         ))}
                    </CardContent>
                </Card>
            )}

            {currentStep === 4 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Step 4: Book an Appointment for Biometrics</CardTitle>
                        <CardDescription>Schedule a visit to the Immigration Department for fingerprint and photo capture.</CardDescription>
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
            
            {currentStep === 5 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Step 5: Review and Submit</CardTitle>
                        <CardDescription>
                            Please review all your details from the previous steps. The total fee is LKR {serviceType === 'renewal' ? '3,500.00' : '5,000.00'}. Click submit to save your application and proceed to payment.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button size="lg" type="submit">
                            Save and Proceed to Payment
                        </Button>
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
     <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proceed to Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Your application has been saved. Would you like to proceed to the payment gateway now to complete your submission? The fee is LKR {serviceType === 'renewal' ? '3,500.00' : '5,000.00'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push('/my-applications')}>
              Pay Later
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(`/payment?service=${encodeURIComponent(service.title)}&amount=${serviceType === 'renewal' ? '3500.00' : '5000.00'}&ref=${user?.id}`)}>
              Pay Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
