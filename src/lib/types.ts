
import type { LucideIcon } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
}

export type ServiceStatus = "Active" | "Renewal Due" | "Not Applied" | "Pending";

export type ServiceStatusVariant =
  | "success"
  | "warning"
  | "destructive"
  | "default";

export interface ServiceAction {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
}

export interface Service {
  title: string;
  slug: string;
  description: string;
  status: ServiceStatus;
  statusVariant: ServiceStatusVariant;
  icon: keyof typeof import("lucide-react") | "default";
  actions: ServiceAction[];
  content: {
    longDescription: string;
    sections: {
      title: string;
      content: string;
      list?: string[];
    }[];
  };
}

export interface Fine {
    id: string;
    type: string;
    issuedDate: string;
    amount: string;
    dueDate: string;
    status: 'Pending' | 'Paid';
    nic: string;
}

export interface Vehicle {
    id: string;
    type: string;
    licensePlate: string;
    registrationDate: string;
    chassisNumber: string;
    status: 'Active' | 'Inactive';
    insuranceExpiry: string;
    emissionTestExpiry: string;
    nic: string;
}

export interface Application {
    id: string;
    user: string;
    userId?: string; // Add userId to link back to the user
    service: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed' | 'In Review' | 'Pending Payment';
    submitted: Timestamp | string;
    documents?: { [key: string]: string };
    details?: { [key: string]: any };
    workerComment?: string;
    appointmentRating?: number;
    appointmentFeedback?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    nic: string;
    role: string;
    joined: Timestamp | string;
    status: 'Active' | 'Suspended';
    photoURL?: string;
}

export interface Payment {
    id: string;
    service: string;
    date: Timestamp | string;
    amount: string;
    status: 'Success' | 'Failed';
    userId: string;
    applicationRef?: string;
}

export interface SupportTicket {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'Open' | 'In Progress' | 'Closed';
    submittedAt: Timestamp | string;
    userNic: string;
    userId?: string; // Add userId
    reply: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    description: string;
    href: string;
    icon: keyof typeof import("lucide-react");
    read: boolean;
    createdAt: Timestamp;
}
