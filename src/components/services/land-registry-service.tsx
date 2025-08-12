
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '../file-upload';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import Link from 'next/link';
import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
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


type UploadedFilesState = {
  [key: string]: string;
};

const STEPS = [
    { id: 1, name: 'Property Details' },
    { id: 2, name: 'Upload Documents' },
    { id: 3, name: 'Submit' },
];


export function LandRegistryService({ service }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesState>({});
  const [propertyAddress, setPropertyAddress] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const requiredDocs = { "DeedOrTitleDocument": "Deed / Title Document", "SurveyPlan": "Survey Plan" };
  
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

  const validateStep = () => {
    if(currentStep === 1) {
        return propertyAddress.trim() !== "";
    }
    if(currentStep === 2) {
        return Object.keys(requiredDocs).every(docKey => uploadedFiles[docKey]);
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
        toast({ title: "Please upload all required documents.", variant: "destructive" });
        return;
    }
    
    try {
        await addDoc(collection(db, "applications"), {
            service: service.title,
            userId: user.id,
            user: user.name,
            status: "Pending Payment",
            submitted: serverTimestamp(),
            documents: uploadedFiles,
            details: { propertyAddress }
        });
        setShowPaymentDialog(true);
    } catch (error) {
        console.error("Error submitting application: ", error);
        toast({ title: "Submission Failed", description: "An error occurred. Please try again.", variant: "destructive"});
    }
  }


  return (
    <>
    <div className="space-y-8">
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Records</TabsTrigger>
            <TabsTrigger value="register">New Registration</TabsTrigger>
          </TabsList>
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Search for Land Records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="deedNumber">Deed Number</Label>
                        <Input id="deedNumber" placeholder="e.g., 1234/56" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="ownerName">Owner's Name</Label>
                        <Input id="ownerName" placeholder="Full name of the owner" />
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Search Records</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="register">
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
                                        <div className="flex flex-col items-center text-center w-36">
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
                                <CardTitle>Step 1: Property Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="propertyAddress">Property Address</Label>
                                    <Textarea id="propertyAddress" placeholder="Full address of the land" value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 2 && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Step 2: Upload Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    {currentStep === 3 && (
                        <Card>
                             <CardHeader>
                                <CardTitle>Step 3: Review and Submit</CardTitle>
                                <CardDescription>Applicable Fees: Stamp Duty (4%) + Registration Fee (LKR 1,000). You will be directed to payment after submission.</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button size="lg" type="submit">Submit and Proceed to Payment</Button>
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
          </TabsContent>
        </Tabs>
         <Card>
            <CardHeader>
                <CardTitle>Contact Regional Offices</CardTitle>
            </CardHeader>
            <CardContent>
                <p><strong>Colombo Land Registry:</strong> 011-2694561</p>
                <p><strong>Kandy Land Registry:</strong> 081-2223456</p>
                <p><strong>Galle Land Registry:</strong> 091-2232456</p>
            </CardContent>
        </Card>
    </div>
    <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proceed to Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Your application has been saved. Would you like to proceed to the payment gateway now to complete your submission? The fee is LKR 1,000.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push('/my-applications')}>
              Pay Later
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(`/payment?service=${encodeURIComponent(service.title)}&amount=1000.00`)}>
              Pay Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
