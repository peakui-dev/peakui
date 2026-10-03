import {jsx} from "react/jsx-runtime";

const tone = {
  active: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  paused: "bg-amber-100 text-amber-800 ring-amber-600/20",
  archived: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export function StatusBadge({status}) {
  return jsx("span", {
    className: `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${tone[status]}`,
    "data-status": status,
    children: status,
  });
}
