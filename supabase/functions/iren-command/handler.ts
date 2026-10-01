type User = {
  id?: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type Dependencies = {
  authenticate: (token: string) => Promise<User | null>;
  readSnapshot: () => Promise<Record<string, unknown>>;
  writeCommand: (command: string, requestedBy: string) => Promise<Record<string, unknown>>;
  now?: () => number;
};

const fresh = (stamp: unknown, now: number) => {
  if (typeof stamp !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(stamp)) return false;
  const age = now - Date.parse(stamp);
  return Number.isFinite(age) && age >= 0 && age <= 180000;
};

function rows(value: unknown) {
  return Array.isArray(value) ? value as Record<string, unknown>[] : [];
}

function summary(work: Record<string, unknown>) {
  const objectives = rows(work.objectives);
  const jobs = rows(work.jobs);
  const activeJobs = jobs.filter((row) =>
    ["QUEUED", "RUNNING", "WAITING", "BLOCKED", "NEEDS_APPROVAL"].includes(String(row.status || ""))
  );
  const blockedObjectives = objectives.filter((row) => row.status === "BLOCKED");
  const decisions = jobs.filter((row) => row.status === "NEEDS_APPROVAL" || row.requires_human === true);
  const complete = objectives.filter((row) => row.status === "COMPLETE").length;
  return {
    objective_count: objectives.length,
    objectives_complete: complete,
    active_jobs: activeJobs.length,
    blocked_objectives: blockedObjectives.length,
    requires_human: decisions.length,
  };
}

export function project(snapshot: Record<string, unknown>, now: number) {
  const control =
    snapshot.control && typeof snapshot.control === "object"
      ? snapshot.control as Record<string, unknown>
      : {};
  const work =
    snapshot.work && typeof snapshot.work === "object"
      ? snapshot.work as Record<string, unknown>
      : {};
  const rawState =
    control.state && typeof control.state === "object"
      ? control.state as Record<string, unknown>
      : {};
  const state = structuredClone(rawState);
  const stale = !fresh(state.observed_at, now);
  const topology =
    state.topology && typeof state.topology === "object"
      ? state.topology as Record<string, unknown>
      : null;

  if (stale) {
    state.state = "STALE";
    const services = topology && Array.isArray(topology.services) ? topology.services : [];
    for (const item of services) {
      if (item && typeof item === "object" && (item as Record<string, unknown>).independent_runtime) {
        Object.assign(item as Record<string, unknown>, { status: "STALE", readiness: false, liveness: null });
      }
    }
    const dependencies =
      topology && topology.dependencies && typeof topology.dependencies === "object"
        ? Object.values(topology.dependencies as Record<string, unknown>)
        : [];
    for (const dependency of dependencies) {
      if (dependency && typeof dependency === "object") {
        (dependency as Record<string, unknown>).status = "STALE";
      }
    }
  }

  const incidentMap =
    state.incidents && typeof state.incidents === "object"
      ? state.incidents as Record<string, unknown>
      : {};
  const incidents = Object.entries(incidentMap)
    .filter(([, value]) => value && typeof value === "object" && (value as Record<string, unknown>).status === "OPEN")
    .map(([key, value]) => {
      const row = value as Record<string, unknown>;
      return { key, severity: row.severity, reason: row.reason, opened_at: row.opened_at };
    });

  const objectives = rows(work.objectives);
  const jobs = rows(work.jobs);
  const commands = rows(work.commands);

  return {
    schema_version: "iren_command.v2",
    work_schema_version: "iren_work.v1",
    revision: control.revision ?? null,
    observed_at: state.observed_at ?? null,
    stale,
    state: state.state || "UNKNOWN",
    topology,
    incidents,
    scheduler: state.scheduler || null,
    action_required: stale || state.state !== "HEALTHY" || incidents.length > 0,
    configuration_identity:
      state.configuration_baseline && typeof state.configuration_baseline === "object"
        ? (state.configuration_baseline as Record<string, unknown>).fingerprint || null
        : null,
    work: {
      ...summary({ objectives, jobs }),
      objectives,
      jobs,
      commands,
    },
  };
}

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function isAdmin(user: User | null) {
  if (!user) return false;
  const meta = user.app_metadata || {};
  return meta.command_admin === true ||
    ["owner", "founder", "admin", "command_admin"].includes(String(meta.role || "").trim().toLowerCase());
}

export function createHandler(deps: Dependencies) {
  return async (req: Request) => {
    if (!["GET", "POST"].includes(req.method)) return response(405, { error: "method_not_allowed" });
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ") || !auth.slice(7).trim()) return response(401, { error: "unauthorized" });

    try {
      const user = await deps.authenticate(auth.slice(7).trim());
      if (!user) return response(401, { error: "unauthorized" });
      if (!isAdmin(user)) return response(403, { error: "forbidden" });

      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const command = String((body as Record<string, unknown>).command || "").trim().slice(0, 4000);
        if (!command) return response(400, { error: "command_required" });
        const requestedBy = String(user.email || user.id || "command-admin").slice(0, 160);
        const created = await deps.writeCommand(command, requestedBy);
        return response(202, {
          schema_version: "iren_command.v2",
          accepted: true,
          command: created,
        });
      }

      const snapshot = await deps.readSnapshot();
      return response(200, project(snapshot, (deps.now || Date.now)()));
    } catch (error) {
      console.error("iren-command failure", error instanceof Error ? error.message : String(error));
      return response(503, { error: "operational_state_unavailable", stale: true, action_required: true });
    }
  };
}