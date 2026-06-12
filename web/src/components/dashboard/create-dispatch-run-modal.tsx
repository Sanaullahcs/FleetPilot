"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/primitives";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { FormLabel, StyledTimeInput } from "@/components/ui/form-controls";
import { toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import {
  createDispatchRun,
  listDrivers,
  listRoutes,
  listVehicles,
} from "@/lib/resources";
import { buildVehicleSelectOptions } from "@/lib/picker-options";
import type { RouteItem } from "@/lib/types";
import { titleCase } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  am: "Morning",
  pm: "Afternoon",
  midday: "Midday",
  activity: "Activity",
  sped: "Special ed",
  charter: "Charter",
};

const DIRECTION_OPTIONS = [
  { label: "To school", value: "to_school" },
  { label: "From school", value: "from_school" },
  { label: "Other / special", value: "other" },
];

function defaultsForRoute(route: RouteItem | undefined) {
  if (!route) {
    return {
      name: "",
      direction: "to_school" as const,
      start: "07:00",
      end: "08:00",
    };
  }

  const schoolLabel = route.school?.name ?? route.name;
  const typeLabel = TYPE_LABELS[route.type] ?? titleCase(route.type);

  if (route.type === "pm") {
    return {
      name: `${schoolLabel} — ${typeLabel} run`,
      direction: "from_school" as const,
      start: "15:15",
      end: "16:30",
    };
  }

  if (route.type === "charter" || route.type === "activity") {
    return {
      name: `${schoolLabel} — ${typeLabel} run`,
      direction: "other" as const,
      start: "09:00",
      end: "11:00",
    };
  }

  return {
    name: `${schoolLabel} — ${typeLabel} run`,
    direction: "to_school" as const,
    start: "07:00",
    end: "08:10",
  };
}

export function CreateDispatchRunModal({
  open,
  serviceDate,
  onClose,
  onCreated,
}: {
  open: boolean;
  serviceDate: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [routeId, setRouteId] = useState("");
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<"to_school" | "from_school" | "other">("to_school");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:10");
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [notes, setNotes] = useState("");
  const [assignNow, setAssignNow] = useState(true);

  const { data: routesPage, isLoading: routesLoading } = useQuery({
    queryKey: ["routes", "dispatch-create"],
    queryFn: () => listRoutes({ per_page: 100, sort_by: "name", sort_dir: "asc" }),
    enabled: open,
  });

  const { data: driversPage, isLoading: driversLoading } = useQuery({
    queryKey: ["drivers", "dispatch-eligible"],
    queryFn: () => listDrivers({ dispatch_eligible: true, per_page: 100, sort_by: "last_name", sort_dir: "asc" }),
    enabled: open && assignNow,
  });

  const { data: vehiclesPage, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles", "dispatch-active"],
    queryFn: () => listVehicles({ status: "active", per_page: 100, sort_by: "vehicle_number", sort_dir: "asc" }),
    enabled: open && assignNow,
  });

  const drivers = driversPage?.data ?? [];
  const vehicles = vehiclesPage?.data ?? [];

  const activeRoutes = useMemo(
    () => (routesPage?.data ?? []).filter((route) => route.status === "active"),
    [routesPage?.data],
  );

  const selectedRoute = activeRoutes.find((route) => route.id === routeId);

  const routeOptions = useMemo(
    () =>
      activeRoutes.map((route) => ({
        label: `${route.name}${route.school?.name ? ` · ${route.school.name}` : ""}`,
        value: route.id,
      })),
    [activeRoutes],
  );

  const driverOptions = useMemo(
    () =>
      drivers.map((d) => ({
        label: `${d.first_name} ${d.last_name}${d.employee_id ? ` · ${d.employee_id}` : ""}`,
        value: d.id,
        sublabel: d.default_vehicle?.vehicle_number ? `Default: ${d.default_vehicle.vehicle_number}` : undefined,
      })),
    [drivers],
  );

  const vehicleOptions = useMemo(
    () => buildVehicleSelectOptions(vehicles, drivers),
    [vehicles, drivers],
  );

  useEffect(() => {
    if (!open) return;
    setRouteId("");
    setName("");
    setDirection("to_school");
    setStartTime("07:00");
    setEndTime("08:10");
    setDriverId("");
    setVehicleId("");
    setNotes("");
    setAssignNow(true);
  }, [open]);

  useEffect(() => {
    if (!selectedRoute) return;
    const defaults = defaultsForRoute(selectedRoute);
    setName(defaults.name);
    setDirection(defaults.direction);
    setStartTime(defaults.start);
    setEndTime(defaults.end);
  }, [selectedRoute?.id]);

  const createMutation = useMutation({
    mutationFn: () =>
      createDispatchRun({
        route_id: routeId,
        name: name.trim(),
        scheduled_start_time: startTime,
        scheduled_end_time: endTime || undefined,
        direction,
        service_date: serviceDate,
        ...(assignNow && driverId && vehicleId
          ? { driver_id: driverId, vehicle_id: vehicleId, notes: notes.trim() || undefined }
          : {}),
      }),
    onSuccess: () => {
      toastSuccess(
        assignNow && driverId && vehicleId ? "Run dispatched" : "Run created",
        assignNow && driverId && vehicleId
          ? "The new run is on the board with driver and vehicle assigned."
          : "The run is on the board — assign a driver when ready.",
      );
      onCreated();
      onClose();
    },
    onError: (e) => toastError("Could not create run", getApiErrorMessage(e, "Failed to create dispatch run.")),
  });

  const handleDriverChange = (id: string) => {
    setDriverId(id);
    const driver = drivers.find((d) => d.id === id);
    if (driver?.default_vehicle?.id) {
      setVehicleId(driver.default_vehicle.id);
    }
  };

  const canSubmit =
    routeId &&
    name.trim() &&
    startTime &&
    (!assignNow || (driverId && vehicleId));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create dispatch run"
      description="Schedule a new run on an active route. Optionally assign driver and vehicle for the selected service date."
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
          >
            {createMutation.isPending
              ? "Creating…"
              : assignNow && driverId && vehicleId
                ? "Create & dispatch"
                : "Create run"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
          Service date: <span className="font-semibold text-slate-900">{serviceDate}</span>
          {selectedRoute ? (
            <>
              {" "}
              · {TYPE_LABELS[selectedRoute.type] ?? selectedRoute.type}
              {selectedRoute.school?.name ? ` · ${selectedRoute.school.name}` : ""}
            </>
          ) : null}
        </div>

        <div>
          <FormLabel>Route</FormLabel>
          <SearchableSelect
            value={routeId}
            onChange={setRouteId}
            options={routeOptions}
            placeholder={routesLoading ? "Loading routes…" : "Select active route"}
            showAllOption={false}
          />
          {!routesLoading && activeRoutes.length === 0 && (
            <p className="mt-1.5 text-xs text-amber-700">No active routes. Create or activate a route first.</p>
          )}
        </div>

        <div>
          <FormLabel>Run name</FormLabel>
          <input
            className="fp-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lincoln AM Run 2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <FormLabel>Direction</FormLabel>
            <SearchableSelect
              value={direction}
              onChange={(v) => setDirection(v as typeof direction)}
              options={DIRECTION_OPTIONS}
              placeholder="Select direction"
              showAllOption={false}
              searchable={false}
            />
          </div>
          <div>
            <FormLabel htmlFor="dispatch-start-time">Start time</FormLabel>
            <StyledTimeInput
              id="dispatch-start-time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <FormLabel htmlFor="dispatch-end-time">End time</FormLabel>
            <StyledTimeInput
              id="dispatch-end-time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-primary/20">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20"
            checked={assignNow}
            onChange={(e) => setAssignNow(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-semibold text-slate-900">Assign driver & vehicle now</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Dispatch immediately for {serviceDate}. Uncheck to add the run unassigned.
            </span>
          </span>
        </label>

        {assignNow && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FormLabel hint="(approved & active only)">Driver</FormLabel>
              <SearchableSelect
                value={driverId}
                onChange={handleDriverChange}
                options={driverOptions}
                placeholder={driversLoading ? "Loading drivers…" : "Select driver"}
                showAllOption={false}
              />
            </div>
            <div>
              <FormLabel>Vehicle</FormLabel>
              <SearchableSelect
                value={vehicleId}
                onChange={setVehicleId}
                options={vehicleOptions}
                placeholder={vehiclesLoading ? "Loading vehicles…" : "Select vehicle"}
                unresolvedLabel="Select vehicle"
                showAllOption={false}
              />
            </div>
            <div className="sm:col-span-2">
              <FormLabel>Notes</FormLabel>
              <textarea
                className="fp-input min-h-[4rem] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional dispatch notes…"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
