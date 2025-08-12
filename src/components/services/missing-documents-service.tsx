
"use client";

import React from 'react';
import { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileUpload } from '../file-upload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

const documentsMap = {
  nic: { "PoliceReport": "Police Report", "BirthCertificate": "Birth Certificate", "CertifiedPhotograph": "Certified Photograph" },
  passport: { "PoliceReport": "Police Report", "NationalIDCopy": "National Identity Card Copy", "BirthCertificateCopy": "Birth Certificate Copy" },
  driving_license: { "PoliceReport": "Police Report", "NationalIDCopy": "National Identity Card Copy", "MedicalCertificate": "Medical Certificate (if applicable)" },
};

type UploadedFilesState = {
  [key: string]: string;
};

const STEPS = [
    { id: 1, name: 'Select Document' },
    { id: 2, name: 'Upload Proof' },
    { id: 3, name: 'Submit' },
];


export function MissingDocumentsService({ service }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesState>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const requiredDocs = selectedService ? documentsMap[selectedService] : {};
  
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
          return selectedService !== '';
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
            description: "Please select a document type or upload all required files.",
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
            status: "Pending",
            submitted: serverTimestamp(),
            documents: uploadedFiles,
            details: {
                lostDocumentType: selectedService
            }
        });

        toast({
            title: "Application Submitted",
            description: "Your request to replace a missing document has been submitted.",
        });
        
        router.push("/my-applications");

    } catch (error) {
        console.error("Error submitting application: ", error);
        toast({ title: "Submission Failed", description: "An error occurred. Please try again.", variant: "destructive"});
    }
  }

  return (
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
                        <CardTitle>Step 1: Report and Replace Missing Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Label>Select Document Type</Label>
                        <Select onValueChange={(value) => { setSelectedService(value); setUploadedFiles({})}} value={selectedService}>
                            <SelectTrigger>
                            <SelectValue placeholder="Select the document you lost" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="nic">National Identity Card (NIC)</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="driving_license">Driving License</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}

            {currentStep === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Upload Your Documents</CardTitle>
                        <CardDescription>
                            Please upload the following documents to proceed with your application for a new {selectedService.replace('_', ' ')}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <CardDescription>
                            Please review all your details from the previous steps. Click submit to complete your application.
                        </CardDescription>
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
  );
}
