"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/admin/program-management",
    label: "Overview",
    description: "Quick summary and entry points",
  },
  {
    href: "/admin/program-management/cohorts",
    label: "Cohorts",
    description: "Program cycles and cohort records",
  },
  {
    href: "/admin/program-management/parent-coachings",
    label: "Coach sessions",
    description: "Coach and mentor sessions with planning, budgets, readiness, and task checklists",
  },
  {
    href: "/admin/program-management/tags",
    label: "Tags",
    description: "Review and edit the labels used across coach sessions",
  },
];

export function ProgramManagementNav() {
  const pathname = usePathname();

  return (
    <div className="program-nav">
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/admin/program-management" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`program-nav-item ${isActive ? "program-nav-item-active" : ""}`}
          >
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </Link>
        );
      })}
    </div>
  );
}
