"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button, Badge } from "@/components/ui/primitives";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import { linkParentStudent, listParentStudents, listStudents, unlinkParentStudent } from "@/lib/resources";
import { titleCase } from "@/lib/utils";
import type { ParentRecord } from "@/lib/types";

const RELATIONSHIP_OPTIONS = [
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Guardian", value: "guardian" },
  { label: "Grandparent", value: "grandparent" },
  { label: "Other", value: "other" },
];

export function ParentStudentsModal({
  open,
  parent,
  onClose,
}: {
  open: boolean;
  parent: ParentRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState("");
  const [relationship, setRelationship] = useState("guardian");
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["parent-students", parent?.id],
    queryFn: () => listParentStudents(parent!.id),
    enabled: open && !!parent?.id,
  });

  const { data: studentsPage } = useQuery({
    queryKey: ["students", "parent-picker"],
    queryFn: () => listStudents({ status: "active", per_page: 200, sort_by: "last_name", sort_dir: "asc" }),
    enabled: open,
  });

  const linkedStudentIds = new Set(links.map((l) => l.student?.id).filter(Boolean));
  const studentOptions = (studentsPage?.data ?? [])
    .filter((s) => !linkedStudentIds.has(s.id))
    .map((s) => ({
      label: `${s.first_name} ${s.last_name}${s.student_number ? ` · ${s.student_number}` : ""}${s.school?.name ? ` · ${s.school.name}` : ""}`,
      value: s.id,
    }));

  const linkMutation = useMutation({
    mutationFn: () =>
      linkParentStudent(parent!.id, {
        student_id: studentId,
        relationship,
        is_primary: isPrimary,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-students", parent?.id] });
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      queryClient.invalidateQueries({ queryKey: ["student-parents"] });
      toastSuccess("Student linked", "The parent can now see this student in their portal.");
      setStudentId("");
      setIsPrimary(false);
    },
    onError: (e) => toastError("Link failed", getApiErrorMessage(e, "Could not link student.")),
  });

  const unlinkMutation = useMutation({
    mutationFn: (linkId: string) => unlinkParentStudent(parent!.id, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-students", parent?.id] });
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      queryClient.invalidateQueries({ queryKey: ["student-parents"] });
      toastSuccess("Student unlinked");
    },
    onError: (e) => toastError("Remove failed", getApiErrorMessage(e, "Could not remove student link.")),
  });

  const parentName = parent?.user
    ? `${parent.user.first_name} ${parent.user.last_name}`
    : "Parent";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign students"
      description={`Link students to ${parentName}. They will only see assigned children in My children and live tracking.`}
      size="md"
      footer={
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      {parent && (
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Linked students</p>
            {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
            {!isLoading && links.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No students linked yet. Select a student below.
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
                        {link.student
                          ? `${link.student.first_name} ${link.student.last_name}`
                          : "Unknown student"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {link.student?.student_number ? `#${link.student.student_number}` : "—"}
                        {link.student?.school?.name ? ` · ${link.student.school.name}` : ""}
                        {link.student?.grade ? ` · Grade ${link.student.grade}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {link.relationship && (
                          <Badge className="bg-slate-100 text-slate-700">{titleCase(link.relationship)}</Badge>
                        )}
                        {link.is_primary && <Badge className="bg-brand-primary/10 text-brand-primary">Primary</Badge>}
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
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Link a student</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Student</label>
                <SearchableSelect
                  value={studentId}
                  onChange={setStudentId}
                  options={studentOptions}
                  placeholder={studentOptions.length ? "Select student…" : "No students available"}
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
                disabled={!studentId || linkMutation.isPending}
                className="w-full sm:w-auto"
              >
                {linkMutation.isPending ? "Linking…" : "Link student"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
