
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '../file-upload';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const taxPayments = [
    { year: 2023, type: "Income Tax (Q4)", amount: "15,000.00", status: "Paid", dueDate: "2024-01-15" },
    { year: 2024, type: "Income Tax (Q1)", amount: "18,000.00", status: "Due", dueDate: "2024-04-15" },
];

type UploadedFilesState = {
  [key: string]: string;
};

export function TaxPaymentsService({ service }) {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesState>({});
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

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

    const handleFileUploadSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Please log in to submit.", variant: "destructive" });
            return;
        }
        if(Object.keys(uploadedFiles).length === 0) {
            toast({ title: "Please upload at least one document.", variant: "destructive" });
            return;
        }
        
        try {
            await addDoc(collection(db, "applications"), {
                service: "Tax Document Submission", // More specific service name
                userId: user.id,
                user: user.name,
                status: "In Review",
                submitted: serverTimestamp(),
                documents: uploadedFiles,
            });
            toast({
                title: "Documents Submitted",
                description: "Your tax documents have been submitted for review by the IRD.",
            });
            router.push("/my-applications");
        } catch (error) {
            console.error("Error submitting documents: ", error);
            toast({ title: "Submission Failed", description: "An error occurred. Please try again.", variant: "destructive"});
        }
    }

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>My Tax Payments</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Year</TableHead>
                            <TableHead>Tax Type</TableHead>
                            <TableHead>Amount (LKR)</TableHead>
                             <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {taxPayments.map((tax, index) => (
                            <TableRow key={index}>
                                <TableCell>{tax.year}</TableCell>
                                <TableCell>{tax.type}</TableCell>
                                <TableCell>{tax.amount}</TableCell>
                                <TableCell>{tax.dueDate}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 text-xs rounded-full ${tax.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {tax.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {tax.status === 'Due' && <Button size="sm" asChild>
                                        <Link href={`/payment?service=Tax+Payment&amount=${tax.amount}&ref=TAX-${tax.year}-Q1`}>Pay Now</Link>
                                    </Button>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <form onSubmit={handleFileUploadSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Upload Income Documents</CardTitle>
                    <p className="text-sm text-muted-foreground">Upload your salary slips, business income statements, or other relevant documents for the current tax year.</p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUpload 
                        id="salary-slips-upload"
                        label="Salary Slips"
                        onUploadComplete={(base64) => handleUploadComplete("salarySlips", base64)}
                        onFileRemove={() => handleFileRemove("salarySlips")}
                    />
                    <FileUpload
                        id="other-income-upload"
                        label="Other Income Proof"
                        onUploadComplete={(base64) => handleUploadComplete("otherIncomeProof", base64)}
                        onFileRemove={() => handleFileRemove("otherIncomeProof")}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit">Upload Files for Review</Button>
                </CardFooter>
            </Card>
        </form>
        
        <Card>
            <CardHeader>
                <CardTitle>Download Certificates</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
                <Button variant="secondary">Download Tax Clearance Certificate 2023</Button>
                <Button variant="secondary">Download Income Statement 2023</Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>FAQs & Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>What is the deadline for filing income tax returns?</AccordionTrigger>
                        <AccordionContent>
                        The deadline for filing your annual income tax return is typically November 30th of the following year.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>How do I get a TIN (Taxpayer Identification Number)?</AccordionTrigger>
                        <AccordionContent>
                        You can register for a TIN online through the IRD e-Services portal or by visiting the nearest IRD office.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    </div>
  );
}
