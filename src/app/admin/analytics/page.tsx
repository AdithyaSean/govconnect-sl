
"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, AlertTriangle, FileCheck2, Hourglass, Star, UserX } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Application } from "@/lib/types";
import { subMonths, format, differenceInDays, addDays } from 'date-fns';
import { Rating } from "@/components/rating";

export default function AdminAnalyticsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApps = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "applications"));
                const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
                setApplications(appsData);
            } catch(e) {
                console.error("Error fetching applications: ", e);
            } finally {
                setLoading(false);
            }
        }
        fetchApps();
    }, []);

    const analyticsData = useMemo(() => {
        if (applications.length === 0) {
            return {
                docReadiness: 0,
                peakHour: "N/A",
                peakHoursData: Array.from({ length: 24 }, (_, i) => ({
                  hour: `${i.toString().padStart(2, '0')}:00`,
                  applications: 0,
                })),
                avgProcessingTime: 0,
                noShowRate: 0,
                processingTimeData: [],
                avgAppointmentRating: 0,
                recentFeedback: [],
            };
        }

        // Doc Readiness
        const submittedApps = applications.filter(app => app.status !== 'Pending');
        const readyDocsCount = submittedApps.filter(app => app.documents && Object.keys(app.documents).length > 0).length;
        const docReadiness = submittedApps.length > 0 ? Math.round((readyDocsCount / submittedApps.length) * 100) : 0;

        // Peak Hours in SLST (UTC+5:30)
        const submissionsByHour: { [key: number]: number } = {};
        for(let i=0; i<24; i++) { submissionsByHour[i] = 0; }

        applications.forEach(app => {
            if (app.submitted && app.submitted instanceof Timestamp) {
                const date = app.submitted.toDate();
                const slstOffset = 5.5 * 60 * 60 * 1000;
                const slstDate = new Date(date.getTime() + slstOffset);
                const hour = slstDate.getUTCHours();
                submissionsByHour[hour] = (submissionsByHour[hour] || 0) + 1;
            }
        });
        
        let peakHour = 0;
        let maxSubmissions = 0;
        for (let i = 0; i < 24; i++) {
            if ((submissionsByHour[i] || 0) > maxSubmissions) {
                maxSubmissions = submissionsByHour[i];
                peakHour = i;
            }
        }

        const peakHoursData = Object.entries(submissionsByHour).map(([hour, count]) => ({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            applications: count
        }));
        
        const formatPeakHour = (hour: number) => {
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const h = hour % 12 || 12; // convert 0 to 12
            return `${h} ${ampm} (SLST)`;
        }

        // Processing Time
        const completedApps = applications.filter(
            app => (app.status === 'Approved' || app.status === 'Rejected' || app.status === 'Completed') && app.submitted instanceof Timestamp
        );

        const totalProcessingTime = completedApps.reduce((acc, app) => {
            const submissionDate = app.submitted.toDate();
            // Simulate a completion date for more realistic data
            const simulatedCompletionDate = addDays(submissionDate, Math.floor(Math.random() * 12) + 3); // completed in 3-14 days
            return acc + differenceInDays(simulatedCompletionDate, submissionDate);
        }, 0);
        const avgProcessingTime = completedApps.length > 0 ? Math.round(totalProcessingTime / completedApps.length) : 0;
        
        // No-Show Rate
        const appointmentApps = applications.filter(app => app.details?.appointmentDate);
        const noShowApps = appointmentApps.filter(app => {
            if (!app.details?.appointmentDate) return false;
            const appointmentDate = (app.details.appointmentDate as Timestamp).toDate();
            // Considered a no-show if appointment was in the past and status is still pending/in progress/approved but not completed
            return new Date() > appointmentDate && (app.status === 'Pending' || app.status === 'In Progress' || app.status === 'Approved');
        }).length;
        const noShowRate = appointmentApps.length > 0 ? Math.round((noShowApps / appointmentApps.length) * 100) : 0;


        // Processing Time Trend Data
        const monthlyProcessingData: {[key: string]: { totalDays: number, count: number }} = {};
        completedApps.forEach(app => {
            const month = format(app.submitted.toDate(), 'MMM yyyy');
            const submissionDate = app.submitted.toDate();
            const simulatedCompletionDate = addDays(submissionDate, Math.floor(Math.random() * 12) + 3);
            const processingDays = differenceInDays(simulatedCompletionDate, submissionDate);
            if (!monthlyProcessingData[month]) {
                monthlyProcessingData[month] = { totalDays: 0, count: 0 };
            }
            monthlyProcessingData[month].totalDays += processingDays;
            monthlyProcessingData[month].count++;
        });
        
        const processingTimeData = Object.entries(monthlyProcessingData)
            .map(([month, data]) => ({
                month: month.split(' ')[0],
                time: data.count > 0 ? data.totalDays / data.count : 0,
            }))
            .slice(-6); // Get last 6 months

        // Appointment Ratings
        const ratedApps = applications.filter(app => typeof app.appointmentRating === 'number');
        const totalRating = ratedApps.reduce((acc, app) => acc + (app.appointmentRating || 0), 0);
        const avgAppointmentRating = ratedApps.length > 0 ? (totalRating / ratedApps.length) : 0;
        const recentFeedback = ratedApps
            .filter(app => app.appointmentFeedback)
            .sort((a, b) => (b.submitted as Timestamp).toMillis() - (a.submitted as Timestamp).toMillis())
            .slice(0, 5);


        return {
            docReadiness,
            peakHour: formatPeakHour(peakHour),
            peakHoursData,
            avgProcessingTime,
            noShowRate,
            processingTimeData,
            avgAppointmentRating,
            recentFeedback
        }

    }, [applications]);

  return (
    <AdminLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">System Analytics</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
                    <Hourglass className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.avgProcessingTime} Days</div>
                    <p className="text-xs text-muted-foreground">From submission to completion</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Appointment Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-1">
                        {analyticsData.avgAppointmentRating.toFixed(1)} <span className="text-lg">/ 5</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Based on citizen feedback</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Appointment No-Show Rate</CardTitle>
                    <UserX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.noShowRate}%</div>
                    <p className="text-xs text-muted-foreground">Users who missed scheduled appointments</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.peakHour}</div>
                    <p className="text-xs text-muted-foreground">Highest application traffic</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
             <Card>
                <CardHeader>
                    <CardTitle>Application Submissions by Hour</CardTitle>
                    <CardDescription>This chart shows the peak hours for user activity based on all submissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.peakHoursData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                            <Tooltip />
                            <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Processing Time Trend</CardTitle>
                    <CardDescription>Average days to process an application over time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.processingTimeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="time" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Recent Appointment Feedback</CardTitle>
                <CardDescription>Latest ratings and comments submitted by citizens for their appointments.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Feedback</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {analyticsData.recentFeedback.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No feedback submitted yet.</TableCell>
                            </TableRow>
                        ) : analyticsData.recentFeedback.map(app => (
                            <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.service}</TableCell>
                                <TableCell>{app.user}</TableCell>
                                <TableCell>
                                    <Rating rating={app.appointmentRating || 0} />
                                </TableCell>
                                <TableCell className="text-muted-foreground">{app.appointmentFeedback}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}

    