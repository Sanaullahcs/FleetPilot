"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/primitives";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { FormLabel, StyledDateInput } from "@/components/ui/form-controls";
import { createComplaint, getComplaintFormOptions } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";
import { toastError } from "@/lib/alerts";

interface ComplaintFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (complaintId: string) => void;
}

export function ComplaintFormModal({ open, onClose, onCreated }: ComplaintFormModalProps) {
  const optionsQuery = useQuery({
    queryKey: ["complaint-form-options"],
    queryFn: getComplaintFormOptions,
    enabled: open,
  });

  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [preferredContact, setPreferredContact] = useState("app");
  const [contactPhone, setContactPhone] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [studentId, setStudentId] = useState("");
  const [routeId, setRouteId] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategory("");
    setSubject("");
    setDescription("");
    setPriority("normal");
    setPreferredContact("app");
    setContactPhone("");
    setIncidentDate("");
    setLocationNote("");
    setStudentId("");
    setRouteId("");
  }, [open]);

  const createMutation = useMutation({
    mutationFn: () =>
      createComplaint({
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        preferred_contact: preferredContact,
        contact_phone: contactPhone.trim() || undefined,
        incident_date: incidentDate || undefined,
        location_note: locationNote.trim() || undefined,
        student_id: studentId || undefined,
        route_id: routeId || undefined,
        school_id: optionsQuery.data?.school?.id,
      }),
    onSuccess: (data) => onCreated(data.id),
    onError: (e) => toastError("Could not register", getApiErrorMessage(e, "Please check the form and try again.")),
  });

  const options = optionsQuery.data;
  const canSubmit =
    category &&
    subject.trim().length >= 5 &&
    description.trim().length >= 20 &&
    !createMutation.isPending;

  return (
    <Modal open={open} onClose={onClose} title="Register a complaint" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Registered complaints are reviewed by transportation administrators. For urgent safety issues, also call{" "}
          <a href={`tel:${(options?.organization.phone ?? "").replace(/\D/g, "")}`} className="font-semibold text-brand-primary">
            {options?.organization.phone ?? "dispatch"}
          </a>
          .
        </p>

        {optionsQuery.isLoading ? (
          <p className="text-sm text-slate-400">Loading form…</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FormLabel>Category</FormLabel>
                <SearchableSelect
                  value={category}
                  onChange={setCategory}
                  options={options?.categories ?? []}
                  placeholder="Select category"
                  showAllOption={false}
                  searchable
                />
              </div>
              <div>
                <FormLabel>Priority</FormLabel>
                <SearchableSelect
                  value={priority}
                  onChange={setPriority}
                  options={options?.priorities ?? []}
                  showAllOption={false}
                  searchable={false}
                />
              </div>
            </div>

            <div>
              <FormLabel htmlFor="complaint-subject">Subject</FormLabel>
              <input
                id="complaint-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="fp-input w-full"
                placeholder="Brief summary of the issue"
                maxLength={200}
              />
            </div>

            <div>
              <FormLabel htmlFor="complaint-description">Description</FormLabel>
              <textarea
                id="complaint-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="fp-input min-h-[120px] w-full resize-y"
                placeholder="What happened? Include dates, route numbers, and anyone involved."
              />
              <p className="mt-1 text-xs text-slate-400">{description.trim().length}/10000 · minimum 20 characters</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FormLabel>Preferred contact</FormLabel>
                <SearchableSelect
                  value={preferredContact}
                  onChange={setPreferredContact}
                  options={options?.contact_methods ?? []}
                  showAllOption={false}
                  searchable={false}
                />
              </div>
              <div>
                <FormLabel htmlFor="complaint-phone">Phone (optional)</FormLabel>
                <input
                  id="complaint-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="fp-input w-full"
                  placeholder="For callback requests"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FormLabel htmlFor="complaint-date">Incident date</FormLabel>
                <StyledDateInput id="complaint-date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
              </div>
              <div>
                <FormLabel htmlFor="complaint-location">Location / stop</FormLabel>
                <input
                  id="complaint-location"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  className="fp-input w-full"
                  placeholder="Stop name, address, or route point"
                />
              </div>
            </div>

            {(options?.students.length ?? 0) > 0 ? (
              <div>
                <FormLabel>Related student (optional)</FormLabel>
                <SearchableSelect
                  value={studentId}
                  onChange={setStudentId}
                  options={options!.students.map((s) => ({
                    value: s.id,
                    label: s.grade ? `${s.name} · Grade ${s.grade}` : s.name,
                  }))}
                  placeholder="Not specific to one student"
                  allLabel="Not specific to one student"
                />
              </div>
            ) : null}

            {(options?.routes.length ?? 0) > 0 ? (
              <div>
                <FormLabel>Related route (optional)</FormLabel>
                <SearchableSelect
                  value={routeId}
                  onChange={setRouteId}
                  options={options!.routes.map((r) => ({
                    value: r.id,
                    label: r.code ? `${r.name} (${r.code})` : r.name,
                  }))}
                  placeholder="Select route"
                  allLabel="No route selected"
                />
              </div>
            ) : null}

            {options?.school ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Registering on behalf of <strong>{options.school.name}</strong>
              </p>
            ) : null}
          </>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={() => createMutation.mutate()}>
            Register complaint
          </Button>
        </div>
      </div>
    </Modal>
  );
}
