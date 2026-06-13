"use client";

import { useQuery } from "@tanstack/react-query";
import { Modal, ModalCloseFooter } from "@/components/ui/modal";
import {
  DetailError,
  DetailGrid,
  DetailItem,
  DetailLoading,
  DetailSection,
  DetailStat,
  DetailStats,
  formatAddress,
  formatBellTimes,
} from "@/components/ui/detail-panel";
import { getSchool } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";

export function SchoolDetailModal({
  schoolId,
  fallbackName,
  onClose,
}: {
  schoolId: string | null;
  fallbackName?: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["school", schoolId],
    queryFn: () => getSchool(schoolId!),
    enabled: Boolean(schoolId),
  });

  const school = data;

  return (
    <Modal
      open={Boolean(schoolId)}
      onClose={onClose}
      size="lg"
      title={school?.name ?? fallbackName ?? "School details"}
      description={
        school
          ? [school.district, school.grade_levels].filter(Boolean).join(" · ") || "Campus profile and operations"
          : "Loading campus profile…"
      }
      footer={<ModalCloseFooter onClose={onClose} />}
    >
      {isLoading && <DetailLoading />}
      {isError && (
        <DetailError message={getApiErrorMessage(error, "Could not load school details.")} onRetry={() => refetch()} />
      )}
      {school && (
        <div className="space-y-6">
          <DetailStats>
            <DetailStat label="Students" value={school.students_count ?? 0} accent />
            <DetailStat label="Active Students" value={school.active_students_count ?? 0} />
            <DetailStat label="Routes" value={school.routes_count ?? 0} />
            <DetailStat label="Active Routes" value={school.active_routes_count ?? 0} />
          </DetailStats>

          <DetailSection title="Campus Profile">
            <DetailGrid>
              <DetailItem label="School Code" value={school.code} mono />
              <DetailItem label="Grade Levels" value={school.grade_levels} />
              <DetailItem label="District" value={school.district} className="sm:col-span-2" />
              <DetailItem label="Principal" value={school.principal_name} />
              <DetailItem label="Timezone" value={school.timezone} />
            </DetailGrid>
          </DetailSection>

          <DetailSection title="Location & contact">
            <DetailGrid>
              <DetailItem
                label="Address"
                value={formatAddress([school.address, school.city, school.state, school.zip])}
                className="sm:col-span-2"
              />
              <DetailItem label="Main Phone" value={school.phone} />
              <DetailItem label="Website" value={school.website} href={school.website ?? undefined} />
              {school.latitude != null && school.longitude != null && (
                <DetailItem
                  label="Map Coordinates"
                  value={`${school.latitude.toFixed(4)}, ${school.longitude.toFixed(4)}`}
                  href={`https://www.google.com/maps?q=${school.latitude},${school.longitude}`}
                  className="sm:col-span-2"
                  mono
                />
              )}
            </DetailGrid>
          </DetailSection>

          <DetailSection title="Transportation Liaison">
            <DetailGrid>
              <DetailItem label="Contact Name" value={school.contact_name} />
              <DetailItem label="Contact Phone" value={school.contact_phone} />
              <DetailItem label="Contact Email" value={school.contact_email} className="sm:col-span-2" />
            </DetailGrid>
          </DetailSection>

          <DetailSection title="Bell Schedule">
            <DetailGrid>
              <DetailItem label="Daily Schedule" value={formatBellTimes(school.bell_times)} className="sm:col-span-2" />
            </DetailGrid>
          </DetailSection>
        </div>
      )}
    </Modal>
  );
}
