"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Button } from "@/components/ui/primitives";
import { PageState } from "@/components/ui/page-state";
import { ContactCell } from "@/components/ui/contact-cell";
import { getMobileSupport } from "@/lib/resources";
import { brand } from "@/lib/brand";

export default function SupportPage() {
  const supportQuery = useQuery({
    queryKey: ["mobile-support"],
    queryFn: getMobileSupport,
  });

  const data = supportQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & support"
        description="Contact your transportation team, register complaints, and find answers to common questions."
      />

      <PageState
        isLoading={supportQuery.isLoading}
        isError={supportQuery.isError}
        onRetry={() => void supportQuery.refetch()}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {data?.channels.map((channel) => (
            <div key={channel.id} className="fp-card p-5">
              <h3 className="text-sm font-semibold text-slate-900">{channel.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{channel.description}</p>
              <p className="mt-2 text-xs text-slate-400">{channel.hours}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {channel.email ? <ContactCell email={channel.email} /> : null}
                {channel.phone ? <ContactCell phone={channel.phone} /> : null}
              </div>
            </div>
          ))}
        </div>

        <div className="fp-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Complaint center</h3>
              <p className="mt-1 max-w-xl text-sm text-slate-600">
                Register or track formal route, safety, and service issues reviewed by your transportation administrator.
              </p>
            </div>
            <Link href="/dashboard/complaints">
              <Button>Register Complaint</Button>
            </Link>
          </div>
        </div>

        <div className="fp-card divide-y divide-slate-100">
          <div className="px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Common questions</h3>
          </div>
          {data?.faqs.map((faq) => (
            <div key={faq.question} className="px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">{faq.question}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/dashboard/messages"
            className="fp-card block p-4 transition hover:border-brand-primary/30"
            style={{ borderColor: `${brand.primary}20` }}
          >
            <p className="text-sm font-semibold text-slate-900">Messages</p>
            <p className="mt-1 text-xs text-slate-500">Chat with dispatch, drivers, or schools.</p>
          </Link>
          <Link href="/dashboard/complaints" className="fp-card block p-4 transition hover:border-brand-primary/30">
            <p className="text-sm font-semibold text-slate-900">Complaints</p>
            <p className="mt-1 text-xs text-slate-500">Track open and resolved service issues.</p>
          </Link>
          <Link href="/dashboard/profile" className="fp-card block p-4 transition hover:border-brand-primary/30">
            <p className="text-sm font-semibold text-slate-900">My Profile</p>
            <p className="mt-1 text-xs text-slate-500">Update account details and preferences.</p>
          </Link>
        </div>
      </PageState>
    </div>
  );
}
