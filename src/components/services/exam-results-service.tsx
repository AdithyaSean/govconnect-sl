
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState, FormEvent } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const sampleResults = {
    "GCE A/L": [
        { subject: "Combined Mathematics", grade: "A" },
        { subject: "Physics", grade: "B" },
        { subject: "Chemistry", grade: "A" },
        { subject: "General English", grade: "A" },
    ],
    "GCE O/L": [
        { subject: "Mathematics", grade: "A" },
        { subject: "Science", grade: "A" },
        { subject: "English", grade: "A" },
        { subject: "Sinhala", grade: "B" },
        { subject: "History", grade: "C" },
    ]
}

export function ExamResultsService({ service }) {
  const [examType, setExamType] = useState('');
  const [results, setResults] = useState([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  const handleViewResults = () => {
    if(examType) {
        setResults(sampleResults[examType] || []);
    }
  }

  const handleDownload = () => {
    toast({
        title: "Download Successful",
        description: "You have successfully downloaded the PDF.",
    });
  };

  const handleAppeal = async () => {
    if (!user) {
        toast({ title: "Please log in to submit.", variant: "destructive" });
        return;
    }
    
    try {
        await addDoc(collection(db, "applications"), {
            service: "Exam Re-correction Appeal",
            userId: user.id,
            user: user.name,
            status: "Pending",
            submitted: serverTimestamp(),
            details: {
                examType: examType,
            }
        });
        toast({
            title: "Appeal Submitted",
            description: "Your appeal request has been submitted.",
        });
        router.push('/my-applications');
    } catch(error) {
        console.error("Error submitting appeal: ", error);
        toast({ title: "Submission Failed", description: "An error occurred. Please try again.", variant: "destructive"});
    }
  };

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Check Examination Results</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                    <Label>Exam Type</Label>
                    <Select onValueChange={setExamType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Exam" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="GCE A/L">G.C.E. Advanced Level</SelectItem>
                            <SelectItem value="GCE O/L">G.C.E. Ordinary Level</SelectItem>
                            <SelectItem value="Grade 5 Scholarship">Grade 5 Scholarship</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="indexNumber">Index Number</Label>
                    <Input id="indexNumber" placeholder="e.g., 1234567" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" type="number" placeholder="e.g., 2023" />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleViewResults}>View Results</Button>
            </CardFooter>
        </Card>

        {results.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Your Results</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead className="text-right">Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map(res => (
                                <TableRow key={res.subject}>
                                    <TableCell className="font-medium">{res.subject}</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{res.grade}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleDownload}>Download PDF</Button>
                    <Button variant="secondary" onClick={handleAppeal}>Appeal for Re-correction</Button>
                </CardFooter>
            </Card>
        )}
    </div>
  );
}

    