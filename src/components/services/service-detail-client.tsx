
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import { MissingDocumentsService } from "@/components/services/missing-documents-service";
import { RenewDrivingLicenseService } from "@/components/services/renew-driving-license-service";
import { NationalIdService } from "@/components/services/national-id-service";
import { LandRegistryService } from "@/components/services/land-registry-service";
import { ExamResultsService } from "@/components/services/exam-results-service";
import { PensionDepartmentService } from "@/components/services/pension-department-service";
import { TaxPaymentsService } from "@/components/services/tax-payments-service";
import { HealthServicesService } from "@/components/services/health-services-service";
import { PassportRenewalService } from "@/components/services/passport-renewal-service";
import { FinePaymentService } from "@/components/services/fine-payment-service";
import { RegisteredVehiclesService } from "@/components/services/registered-vehicles-service";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Service } from "@/lib/types";

const serviceComponentMap = {
  "missing-documents": MissingDocumentsService,
  "driving-licence-services": RenewDrivingLicenseService,
  "passport-services": PassportRenewalService,
  "national-id-services": NationalIdService,
  "land-registry": LandRegistryService,
  "exam-results": ExamResultsService,
  "pension-department": PensionDepartmentService,
  "tax-payments-ird": TaxPaymentsService,
  "health-services": HealthServicesService,
  "fine-payment": FinePaymentService,
  "registered-vehicles": RegisteredVehiclesService,
};

function DefaultServicePage({ service }: { service: Service }) {
  return (
    <div className="grid gap-8">
      {service.content.sections.map((section, index) => (
          <Card key={index}>
              <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{section.content}</p>
                  {section.list && (
                      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                          {section.list.map((item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
                          ))}
                      </ul>
                  )}
              </CardContent>
          </Card>
      ))}
    </div>
  );
}

export function ServiceDetailClient({ service }: { service: Service }) {
  const Icon = LucideIcons[service.icon] as React.ElementType;
  const ServiceComponent = serviceComponentMap[service.slug] || DefaultServicePage;

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="flex-shrink-0">
                    <Link href="/dashboard"><ArrowLeft /></Link>
                </Button>
                <div className="p-4 rounded-lg bg-muted hidden md:flex">
                  {Icon && <Icon className="w-8 h-8 text-primary" />}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{service.title}</h1>
                  <p className="text-lg text-muted-foreground">{service.content.longDescription}</p>
                </div>
            </div>
             <Badge variant={service.status === 'Active' ? 'default' : service.status === 'Renewal Due' ? 'destructive' : 'secondary'} className="text-base px-4 py-2 capitalize whitespace-nowrap">{service.status}</Badge>
        </header>

        <ServiceComponent service={service} />
      </div>
    </DashboardLayout>
  );
}
