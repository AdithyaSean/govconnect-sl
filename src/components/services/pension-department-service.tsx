
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '../file-upload';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type UploadedFilesState = {
  [key: string]: string;
};

const STEPS = [
    { id: 1, name: 'Application Form' },
    { id: 2, name: 'Upload Documents' },
    { id: 3, name: 'Bank Details' },
    { id: 4, name: 'Submit' },
];


export function PensionDepartmentService({ service }) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesState>({});
  const { user } = useAuth();
  const router = useRouter();
  const [formValues, setFormValues] = useState({
      pensionerName: '',
      pensionerNIC: '',
      lastWorkplace: '',
      retirementDate: '',
      bankName: '',
      branchName: '',
      accountNumber: ''
  });

  useEffect(() => {
    if(user){
        setFormValues(prev => ({
            ...prev,
            pensionerName: user.name,
            pensionerNIC: user.nic
        }));
    }
  }, [user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({...prev, [e.target.name]: e.target.value}));
  }

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
  
  const requiredDocs = {
      "ServiceCertificate": "Service Certificate", 
      "RetirementLetter": "Retirement Letter", 
      "CopyofNIC": "Copy of NIC", 
      "BankAccountDetailsConfirmation": "Bank Account Details Confirmation"
  };
  
  const validateStep = () => {
    if(currentStep === 1) {
        return formValues.pensionerName && formValues.pensionerNIC && formValues.lastWorkplace && formValues.retirementDate;
    }
    if(currentStep === 2) {
        return Object.keys(requiredDocs).every(docKey => uploadedFiles[docKey]);
    }
    if(currentStep === 3) {
        return formValues.bankName && formValues.branchName && formValues.accountNumber;
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


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "Please log in to submit.", variant: "destructive" });
        return;
    }
    if (!validateStep()) {
        toast({ title: "Please complete all steps.", variant: "destructive"});
        return;
    }

    try {
        await addDoc(collection(db, "applications"), {
            service: service.title,
            userId: user.id,
            user: user.name,
            status: "Pending",
            submitted: serverTimestamp(),
            documents: uploadedFiles,
            details: formValues
        });

        toast({
            title: "Application Submitted",
            description: "Your pension application has been successfully submitted for review.",
        });
        router.push("/my-applications");
    } catch(error) {
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
            <CardContent>
                <div className="flex items-center gap-4">
                    <Progress value={60} className="w-full" />
                    <span className="text-lg font-bold">60%</span>
                </div>
                 <p className="text-sm text-muted-foreground mt-2">Current stage: Departmental Approval</p>
            </CardContent>
            <CardFooter>
                <Button>Check Status</Button>
            </CardFooter>
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
                            <CardTitle>Step 1: Pension Application Form</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pensionerName">Name of Retiree</Label>
                                <Input id="pensionerName" name="pensionerName" required value={formValues.pensionerName} onChange={handleFormChange}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pensionerNIC">NIC Number</Label>
                                <Input id="pensionerNIC" name="pensionerNIC" required value={formValues.pensionerNIC} onChange={handleFormChange}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastWorkplace">Last Place of Work</Label>
                                <Input id="lastWorkplace" name="lastWorkplace" required value={formValues.lastWorkplace} onChange={handleFormChange}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="retirementDate">Date of Retirement</Label>
                                <Input id="retirementDate" name="retirementDate" type="date" required value={formValues.retirementDate} onChange={handleFormChange}/>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 2: Document Checklist & Upload</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(requiredDocs).map(([key, label]) => {
                               const id = `file-upload-pension-${key}`;
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
                            <CardTitle>Step 3: Bank Detail Form</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Bank Name</Label>
                                <Input id="bankName" name="bankName" value={formValues.bankName} onChange={handleFormChange}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="branchName">Branch Name</Label>
                                <Input id="branchName" name="branchName" value={formValues.branchName} onChange={handleFormChange}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <Input id="accountNumber" name="accountNumber" value={formValues.accountNumber} onChange={handleFormChange}/>
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

         <Card>
            <CardHeader>
                <CardTitle>Help & FAQs</CardTitle>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>How long does the pension process take?</AccordionTrigger>
                        <AccordionContent>
                        The process typically takes 3-6 months from the date of retirement if all documents are submitted correctly.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>How can I update my address?</AccordionTrigger>
                        <AccordionContent>
                        You can update your address by submitting a written request to the Pensions Department along with proof of your new address.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    </div>
  );
}
