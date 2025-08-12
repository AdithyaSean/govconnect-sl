import { services } from "@/lib/data";
import { notFound } from "next/navigation";
import { ServiceDetailClient } from "@/components/services/service-detail-client";
import { use } from 'react';

// This is now a Server Component
export default function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const service = services.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  // It passes the fetched data as props to the client component
  return <ServiceDetailClient service={service} />;
}

// generateStaticParams can now be used because this is a Server Component
export async function generateStaticParams() {
  return services.map((service) => ({
    slug: service.slug,
  }));
}
