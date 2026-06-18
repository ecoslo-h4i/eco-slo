"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createUserLevelClient } from "@/lib/supabase/client";
import { useCurrentMember } from "@/hooks/useCurrentProvider";
import { AdminPageShell } from "@/components/admin-page-shell";
import Badge from "@/components/badge";
import { ArrowRight, Calendar, ClipboardList, ListChecks, TreeDeciduous, UsersRound } from "lucide-react";

interface DashboardStats {
  tasks: { open: number; surveyRequired: number; surveyAvailable: number; completedRecently: number };
  trees: { total: number; recentlyAdded: number };
  members: { total: number; admins: number; treeKeepers: number };
}

async function fetchDashboardStats(isAdmin: boolean): Promise<DashboardStats> {
  const supabase = createUserLevelClient();

  const [tasksResult, treesResult, membersResult] = await Promise.all([
    supabase.from("tasks").select("is_complete, survey_mode, surveys_needed, created_at, completion_date"),
    supabase.from("trees").select("created_at"),
    isAdmin ? supabase.from("members").select("role") : Promise.resolve({ data: null, error: null }),
  ]);

  const tasks = tasksResult.data ?? [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const trees = treesResult.data ?? [];
  const members = membersResult.data ?? [];

  return {
    tasks: {
      open: tasks.filter((t) => !t.is_complete).length,
      surveyRequired: tasks.filter((t) => !t.is_complete && t.survey_mode === "required" && (t.surveys_needed ?? 0) > 0)
        .length,
      surveyAvailable: tasks.filter((t) => t.survey_mode === "optional").length,
      completedRecently: tasks.filter((t) => t.is_complete && t.completion_date && t.completion_date >= thirtyDaysAgo)
        .length,
    },
    trees: {
      total: trees.length,
      recentlyAdded: trees.filter((t) => t.created_at >= thirtyDaysAgo).length,
    },
    members: {
      total: members.length,
      admins: members.filter((m) => m.role === "Admin").length,
      treeKeepers: members.filter((m) => m.role === "Tree Keeper").length,
    },
  };
}

export default function Dashboard() {
  const { member, isAdmin } = useCurrentMember();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchDashboardStats(isAdmin);
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadStats();
  }, [loadStats]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <AdminPageShell title={`Welcome Back, ${member?.firstname ?? ""}`}>
      {loading ? (
        <div className="flex min-h-[400px] w-full items-center justify-center text-text-muted font-mulish">
          Loading dashboard…
        </div>
      ) : !stats ? (
        <div className="flex min-h-[400px] w-full items-center justify-center text-danger font-mulish">
          Failed to load dashboard data.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top row: highlight stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Open Tasks" value={stats.tasks.open} icon={ListChecks} href="/tasks" />
            <StatTile label="Total Trees" value={stats.trees.total} icon={TreeDeciduous} href="/trees" />
            {isAdmin ? (
              <>
                <StatTile label="Team Members" value={stats.members.total} icon={UsersRound} href="/members" />
                <StatTile
                  label="Survey Required"
                  value={stats.tasks.surveyRequired}
                  icon={ClipboardList}
                  href="/tasks"
                  accent={stats.tasks.surveyRequired > 0}
                />
              </>
            ) : (
              <>
                <StatTile
                  label="Survey Required"
                  value={stats.tasks.surveyRequired}
                  icon={ClipboardList}
                  href="/tasks"
                  accent={stats.tasks.surveyRequired > 0}
                />
                <StatTile label="Completed (30d)" value={stats.tasks.completedRecently} icon={Calendar} href="/tasks" />
              </>
            )}
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DetailCard
              title="Tasks"
              icon={ListChecks}
              href="/tasks"
              rows={[
                { label: "Open", value: stats.tasks.open },
                {
                  label: "Survey Required",
                  value: stats.tasks.surveyRequired,
                  badge: stats.tasks.surveyRequired > 0 ? "default" : undefined,
                },
                {
                  label: "Survey Available",
                  value: stats.tasks.surveyAvailable,
                  badge: stats.tasks.surveyAvailable > 0 ? "info" : undefined,
                },
                {
                  label: "Completed (30d)",
                  value: stats.tasks.completedRecently,
                  badge: stats.tasks.completedRecently > 0 ? "success" : undefined,
                },
              ]}
            />

            <DetailCard
              title="Trees"
              icon={TreeDeciduous}
              href="/trees"
              rows={[
                { label: "Total", value: stats.trees.total },
                { label: "Added (30d)", value: stats.trees.recentlyAdded },
              ]}
            />

            {isAdmin ? (
              <DetailCard
                title="Members"
                icon={UsersRound}
                href="/members"
                rows={[
                  { label: "Total", value: stats.members.total },
                  { label: "Admins", value: stats.members.admins, badge: "info" },
                  { label: "Tree Keepers", value: stats.members.treeKeepers, badge: "success" },
                ]}
              />
            ) : null}

            <QuickActionsCard isAdmin={isAdmin} />
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

/* ── Stat Tile (top row) ─────────────────────────────────────── */

function StatTile({
  label,
  value,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof ListChecks;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-off-white p-5 shadow-sm transition-colors hover:border-primary-border hover:bg-off-white-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft">
          <Icon className="h-[18px] w-[18px] text-primary-active" strokeWidth={2.25} />
        </div>
        <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex flex-col gap-0.5">
        <p
          className={`text-3xl font-serif font-bold leading-none ${accent ? "text-primary-active" : "text-text-dark"}`}
        >
          {value}
        </p>
        <p className="text-sm font-mulish font-medium text-text-muted">{label}</p>
      </div>
    </Link>
  );
}

/* ── Detail Card ─────────────────────────────────────────────── */

interface DetailRow {
  label: string;
  value: number;
  badge?: "default" | "success" | "danger" | "info" | "muted" | "warning";
}

function DetailCard({
  title,
  icon: Icon,
  href,
  rows,
}: {
  title: string;
  icon: typeof ListChecks;
  href: string;
  rows: DetailRow[];
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-off-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
            <Icon className="h-5 w-5 text-primary-active" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-serif font-bold text-text-dark">{title}</h2>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mulish font-medium text-text-muted transition-colors hover:bg-off-white-2 hover:text-text-dark"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Rows */}
      <div className="flex flex-col">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-6 py-3.5 ${i === 0 ? "border-t" : ""} border-b border-border`}
          >
            <span className="text-sm font-mulish font-medium text-text-muted">{row.label}</span>
            <div className="flex items-center gap-2.5">
              {row.badge ? (
                <Badge variant={row.badge} size="sm">
                  {row.value}
                </Badge>
              ) : (
                <span className="text-lg font-serif font-bold text-text-dark">{row.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Quick Actions ───────────────────────────────────────────── */

function QuickActionsCard({ isAdmin }: { isAdmin: boolean }) {
  const links = [
    { label: "Tasks", description: "View and manage tasks", href: "/tasks", icon: ListChecks },
    { label: "Trees", description: "Browse the tree inventory", href: "/trees", icon: TreeDeciduous },
    ...(isAdmin
      ? [
          { label: "Members", description: "Manage team members", href: "/members", icon: UsersRound },
          { label: "Reminders", description: "View scheduled reminders", href: "/reminders", icon: ClipboardList },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col rounded-xl border border-border bg-off-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-5 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
          <ArrowRight className="h-5 w-5 text-primary-active" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-serif font-bold text-text-dark">Quick Actions</h2>
      </div>

      <div className="flex flex-col gap-2 p-4 pt-0">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-3.5 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary-border hover:bg-primary-soft/40"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-off-white-2 transition-colors group-hover:bg-primary-soft">
              <link.icon
                className="h-4 w-4 text-text-muted transition-colors group-hover:text-primary-active"
                strokeWidth={2}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-mulish font-semibold text-text-dark">{link.label}</span>
              <span className="text-xs font-mulish text-text-muted truncate">{link.description}</span>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-border-strong opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  );
}
