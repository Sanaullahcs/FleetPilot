"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button, Badge } from "@/components/ui/primitives";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import { linkStudentParent, listStudentParents, listUsers, unlinkStudentParent } from "@/lib/resources";
import { titleCase } from "@/lib/utils";
import type { Student } from "@/lib/types";

const RELATIONSHIP_OPTIONS = [
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Guardian", value: "guardian" },
  { label: "Grandparent", value: "grandparent" },
  { label: "Other", value: "other" },
];

export function ParentLinksModal({
  open,
  student,
  onClose,
}: {
  open: boolean;
  student: Student | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [relationship, setRelationship] = useState("guardian");
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["student-parents", student?.id],
    queryFn: () => listStudentParents(student!.id),
    enabled: open && !!student?.id,
  });

  const { data: parentsPage } = useQuery({
    queryKey: ["users", "parents"],
    queryFn: () => listUsers({ role: "parent", is_active: true, per_page: 100, sort_by: "last_name", sort_dir: "asc" }),
    enabled: open,
  });

  const linkedUserIds = new Set(links.map((l) => l.user?.id).filter(Boolean));
  const parentOptions = (parentsPage?.data ?? [])
    .filter((u) => !linkedUserIds.has(u.id))
    .map((u) => ({
      label: `${u.first_name} ${u.last_name} · ${u.email}`,
      value: u.id,
    }));

  const linkMutation = useMutation({
    mutationFn: () =>
      linkStudentParent(student!.id, {
        user_id: userId,
        relationship,
        is_primary: isPrimary,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-parents", student?.id] });
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      queryClient.invalidateQueries({ queryKey: ["parent-students"] });
      toastSuccess("Parent linked", "The parent can now see this student in their portal.");
      setUserId("");
      setIsPrimary(false);
    },
    onError: (e) => toastError("Link failed", getApiErrorMessage(e, "Could not link parent.")),
  });

  const unlinkMutation = useMutation({
    mutationFn: (linkId: string) => unlinkStudentParent(student!.id, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-parents", student?.id] });
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      queryClient.invalidateQueries({ queryKey: ["parent-students"] });
      toastSuccess("Parent unlinked");
    },
    onError: (e) => toastError("Remove failed", getApiErrorMessage(e, "Could not remove parent link.")),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage parent access"
      description={
        student
          ? `Link parent accounts to ${student.first_name} ${student.last_name}. Parents only see students assigned to them.`
          : undefined
      }
      size="md"
      footer={
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      {student && (
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Linked parents</p>
            {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
            {!isLoading && links.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No parents linked yet. Add a parent user below.
              </p>
            )}
            {links.length > 0 && (
              <ul className="space-y-2">
                {links.map((link) => (
                  <li
                    key={link.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {link.user ? `${link.user.first_name} ${link.user.last_name}` : "Unknown parent"}
                      </p>
                      <p className="truncate text-xs text-slate-500">{link.user?.email ?? "—"}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {link.relationship && (
                          <Badge className="bg-slate-100 text-slate-700">{titleCase(link.relationship)}</Badge>
                        )}
                        {link.is_primary && <Badge className="bg-brand-primary/10 text-brand-primary">Primary</Badge>}
                        {link.user && !link.user.is_active && (
                          <Badge className="bg-amber-50 text-amber-800">Pending approval</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => unlinkMutation.mutate(link.id)}
                      disabled={unlinkMutation.isPending}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Link a parent user</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Parent account</label>
                <SearchableSelect
                  value={userId}
                  onChange={setUserId}
                  options={parentOptions}
                  placeholder={parentOptions.length ? "Select parent user…" : "No parent users available"}
                  showAllOption={false}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Relationship</label>
                <SearchableSelect
                  value={relationship}
                  onChange={setRelationship}
                  options={RELATIONSHIP_OPTIONS}
                  showAllOption={false}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Primary contact for this student
              </label>
              <Button
                onClick={() => linkMutation.mutate()}
                disabled={!userId || linkMutation.isPending}
                className="w-full sm:w-auto"
              >
                {linkMutation.isPending ? "Linking…" : "Link parent"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
