
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '../file-upload';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar } from '../ui/calendar';
import { useState, FormEvent, useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

type UploadedFilesState = {
  [key: string]: string;
};

const STEPS = [
    { id: 1, name: 'Service Type' },
    { id: 2, name: 'Application Form' },
    { id: 3, name: 'Upload Documents' },
    { id: 4, name: 'Schedule & Submit' },
];

const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"];

export function RenewDrivingLicenseService({ service }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState<string>("");
    const [serviceType, setServiceType] = useState('renewal');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesState>({});
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [formValues, setFormValues] = useState({
        fullName: '',
        nic: '',
        licenseNumber: '',
        expiryDate: '',
        address: ''
    });

    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        setDate(new Date());
         if(user){
            setFormValues(prev => ({
                ...prev,
                fullName: user.name || '',
                nic: user.nic || ''
            }));
        }
    }, [user]);

    const requiredDocs = serviceType === 'renewal' 
        ? ["oldLicense", "medicalReport"] 
        : ["nicCopy", "medicalReport", "birthCertificate"];

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
        setUploadedFiles({});
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
    }

    const validateStep = () => {
        if(currentStep === 2){
            if(!formValues.fullName || !formValues.nic || !formValues.address) return false;
            if(serviceType === 'renewal' && (!formValues.licenseNumber || !formValues.expiryDate)) return false;
        }
        if(currentStep === 3){
            return requiredDocs.every(doc => uploadedFiles[doc]);
        }
        return true;
    }

    const handleNext = () => {
        if(validateStep()){
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
        } else {
            toast({
                title: "Incomplete Step",
                description: "Please fill all required fields or upload all required documents before proceeding.",
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
        if (!validateStep() || !date || !time) {
            toast({ title: "Please complete all steps.", variant: "destructive" });
            return;
        }

        const appointmentDateTime = new Date(date);
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
            toast({
                title: "Application Saved Successfully",
                description: "Your application has been saved. Please proceed with the payment to complete the process.",
            });
            setShowPaymentDialog(true);
        } catch (error) {
            console.error("Error submitting application: ", error);
            toast({ title: "Submission Failed", description: "An error occurred. Please try again.", variant: "destructive"});
        }
    }

    const handleSaveDraft = () => {
        toast({ title: "Draft Saved", description: "Your application progress has been saved." });
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
                                <div className="flex flex-col items-center text-center">
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
                    <CardContent className="space-y-6">
                        <RadioGroup defaultValue={serviceType} onValueChange={handleServiceTypeChange} className="flex gap-8">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="renewal" id="dl-renewal" />
                                <Label htmlFor="dl-renewal">Renew Existing Licence</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new" id="dl-new" />
                                <Label htmlFor="dl-new">Apply for New Licence</Label>
                            </div>
                        </RadioGroup>
                        <div>
                             <h3 className="font-semibold text-lg mt-4">Eligibility Guidelines</h3>
                             <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                                <li>For Renewal: Your current driving license must be valid or expired for less than 1 year.</li>
                                <li>For New Licence: You must be over 18 years of age.</li>
                                <li>You must be medically fit to drive. A medical certificate is required for applicants over 50 or for certain vehicle classes.</li>
                                <li>No pending traffic violations or court cases related to driving.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}

            {currentStep === 2 && (
                 <Card>
                  <CardHeader>
                      <CardTitle>Step 2: Online Application Form</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input id="fullName" name="fullName" placeholder="As per your NIC" required value={formValues.fullName} onChange={handleFormChange}/>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="nic">NIC Number</Label>
                              <Input id="nic" name="nic" placeholder="e.g., 199012345V" required value={formValues.nic} onChange={handleFormChange}/>
                          </div>
                           {serviceType === 'renewal' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="licenseNumber">Current License Number</Label>
                                    <Input id="licenseNumber" name="licenseNumber" placeholder="e.g., B1234567" required value={formValues.licenseNumber} onChange={handleFormChange}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expiryDate">Expiry Date</Label>
                                    <Input id="expiryDate" name="expiryDate" type="date" required value={formValues.expiryDate} onChange={handleFormChange}/>
                                </div>
                            </>
                           )}
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Textarea id="address" name="address" placeholder="Your permanent address" required value={formValues.address} onChange={handleFormChange}/>
                      </div>
                  </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Step 3: Upload Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {serviceType === 'renewal' ? (
                            <>
                                <FileUpload 
                                    id="old-license-upload"
                                    label="Copy of Old Driving License"
                                    onUploadComplete={(base64) => handleUploadComplete("oldLicense", base64)}
                                    onFileRemove={() => handleFileRemove("oldLicense")}
                                />
                                <FileUpload 
                                    id="medical-report-upload"
                                    label="Medical Fitness Report" 
                                    onUploadComplete={(base64) => handleUploadComplete("medicalReport", base64)}
                                    onFileRemove={() => handleFileRemove("medicalReport")}
                                />
                            </>
                        ) : (
                            <>
                                <FileUpload 
                                    id="new-nic-upload"
                                    label="Copy of NIC"
                                    onUploadComplete={(base64) => handleUploadComplete("nicCopy", base64)}
                                    onFileRemove={() => handleFileRemove("nicCopy")}
                                />
                                <FileUpload 
                                    id="new-medical-upload"
                                    label="Medical Fitness Report" 
                                    onUploadComplete={(base64) => handleUploadComplete("medicalReport", base64)}
                                    onFileRemove={() => handleFileRemove("medicalReport")}
                                />
                                <FileUpload 
                                    id="new-bc-upload"
                                    label="Copy of Birth Certificate" 
                                    onUploadComplete={(base64) => handleUploadComplete("birthCertificate", base64)}
                                    onFileRemove={() => handleFileRemove("birthCertificate")}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {currentStep === 4 && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 4: Schedule an Appointment</CardTitle>
                            <CardDescription>For new applicants, this will be for the written exam. For renewals, this is for biometrics.</CardDescription>
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment & Submission</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Please review all your details from the previous steps. The total fee is LKR {serviceType === 'renewal' ? '2,500.00' : '3,500.00'}. Click submit to save your application and proceed to payment.</p>
                        </CardContent>
                        <CardFooter>
                            <Button size="lg" type="submit">
                                Save and Proceed to Payment
                            </Button>
                        </CardFooter>
                    </Card>
                </>
            )}
            
            <div className="flex justify-between mt-8">
                <div>
                  {currentStep > 1 && <Button type="button" variant="secondary" onClick={handleBack}>Back</Button>}
                </div>
                 <div>
                    <Button type="button" variant="outline" onClick={handleSaveDraft} className="mr-2">Save Draft</Button>
                    {currentStep < STEPS.length && <Button type="button" onClick={handleNext}>Next</Button>}
                </div>
            </div>

          </div>
      </form>
       <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proceed to Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Your application has been saved. Would you like to proceed to the payment gateway now to complete your submission? The fee is LKR {serviceType === 'renewal' ? '2,500.00' : '3,500.00'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push('/my-applications')}>
              Pay Later
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(`/payment?service=${encodeURIComponent(service.title)}&amount=${serviceType === 'renewal' ? '2500.00' : '3500.00'}`)}>
              Pay Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
