"use client";

import { useQuery } from "@tanstack/react-query";
import { Modal, ModalCloseFooter } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/primitives";
import {
  DetailError,
  DetailGrid,
  DetailItem,
  DetailLoading,
  DetailSection,
  DetailStat,
  DetailStats,
} from "@/components/ui/detail-panel";
import { getVehicle } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";
import { titleCase } from "@/lib/utils";
import { ContactCell } from "@/components/ui/contact-cell";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d.slice(0, 10)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function VehicleDetailModal({
  vehicleId,
  fallbackName,
  onClose,
}: {
  vehicleId: string | null;
  fallbackName?: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: () => getVehicle(vehicleId!),
    enabled: Boolean(vehicleId),
  });

  const v = data;

  return (
    <Modal
      open={Boolean(vehicleId)}
      onClose={onClose}
      size="lg"
      title={v ? `Vehicle ${v.vehicle_number}` : fallbackName ?? "Vehicle details"}
      description={v ? `${v.make ?? ""} ${v.model ?? ""} · ${titleCase(v.type)}`.trim() : "Fleet asset profile"}
      footer={<ModalCloseFooter onClose={onClose} />}
    >
      {isLoading && <DetailLoading />}
      {isError && (
        <DetailError message={getApiErrorMessage(error, "Could not load vehicle details.")} onRetry={() => refetch()} />
      )}
      {v && (
        <div className="space-y-6">
          <DetailStats>
            <DetailStat label="Capacity" value={v.capacity ?? "—"} accent />
            <DetailStat label="WC seats" value={v.wheelchair_capacity} />
            <DetailStat label="Year" value={v.year ?? "—"} />
            <DetailStat label="Odometer" value={v.current_odometer != null ? `${v.current_odometer.toLocaleString()} mi` : "—"} />
          </DetailStats>

          <DetailSection title="Identification">
            <DetailGrid>
              <DetailItem label="Vehicle number" value={v.vehicle_number} mono />
              <DetailItem label="License plate" value={v.license_plate} mono />
              <DetailItem label="VIN" value={v.vin} className="sm:col-span-2" mono />
              <DetailItem label="Type" value={titleCase(v.type.replace(/_/g, " "))} />
              <DetailItem label="Status" value={<StatusBadge status={v.status} />} />
            </DetailGrid>
          </DetailSection>

          <DetailSection title="Compliance & expiry">
            <DetailGrid>
              <DetailItem label="Registration expires" value={formatDate(v.registration_expiry)} />
              <DetailItem label="Insurance expires" value={formatDate(v.insurance_expiry)} />
              <DetailItem label="Inspection expires" value={formatDate(v.inspection_expiry)} />
              <DetailItem label="Fuel type" value={v.fuel_type ? titleCase(v.fuel_type) : "—"} />
            </DetailGrid>
          </DetailSection>

          <DetailSection title="Operations">
            <DetailGrid>
              <DetailItem label="Garage location" value={v.garage_location} className="sm:col-span-2" />
              <DetailItem label="Cost per mile" value={v.cost_per_mile != null ? `$${v.cost_per_mile.toFixed(2)}` : "—"} />
            </DetailGrid>
          </DetailSection>

          <DetailSection title="Assigned driver">
            <DetailGrid>
              {v.assigned_driver ? (
                <>
                  <DetailItem
                    label="Driver"
                    value={`${v.assigned_driver.first_name} ${v.assigned_driver.last_name}`}
                  />
                  <DetailItem label="Employee ID" value={v.assigned_driver.employee_id} mono />
                  <DetailItem
                    label="Contact"
                    value={<ContactCell phone={v.assigned_driver.phone} email={v.assigned_driver.email} />}
                    className="sm:col-span-2"
                  />
                  <DetailItem label="Status" value={<StatusBadge status={v.assigned_driver.status ?? "active"} />} />
                </>
              ) : (
                <DetailItem label="Driver" value="No driver assigned" className="sm:col-span-2" />
              )}
            </DetailGrid>
          </DetailSection>
        </div>
      )}
    </Modal>
  );
}
