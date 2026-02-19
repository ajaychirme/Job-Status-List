import { useState, useMemo, useRef, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: "companyName",    label: "Company"      },
  { key: "roleTitle",      label: "Role"         },
  { key: "companyOrigin",  label: "Origin"       },
  { key: "jobSource",      label: "Source"       },
  { key: "packageOffered", label: "Package"      },
  { key: "expectedCTC",    label: "Expected CTC" },
  { key: "techStack",      label: "Tech Stack"   },
  { key: "status",         label: "Status"       },
];

const STATUS_OPTIONS = ["Applied", "Interview", "Offer", "Rejected"];

const STATUS_STYLES = {
  Applied:   { bg: "#1e3a5f", text: "#60a5fa", dot: "#3b82f6" },
  Interview: { bg: "#3b2a00", text: "#fbbf24", dot: "#f59e0b" },
  Offer:     { bg: "#0d3321", text: "#34d399", dot: "#10b981" },
  Rejected:  { bg: "#3b1a1a", text: "#f87171", dot: "#ef4444" },
};

const INITIAL_JOBS = [
  { id: 1, companyName: "Stripe",  roleTitle: "Senior Frontend Engineer", companyOrigin: "USA",   jobSource: "LinkedIn",        packageOffered: "₹45 LPA", expectedCTC: "₹50 LPA", techStack: "React, TypeScript, GraphQL", status: "Applied"   },
  { id: 2, companyName: "Zepto",   roleTitle: "Lead React Developer",     companyOrigin: "India", jobSource: "Naukri",          packageOffered: "₹32 LPA", expectedCTC: "₹38 LPA", techStack: "React, Node.js, AWS",        status: "Interview" },
  { id: 3, companyName: "Notion",  roleTitle: "Full Stack Engineer",      companyOrigin: "USA",   jobSource: "Company Website", packageOffered: "₹55 LPA", expectedCTC: "₹60 LPA", techStack: "React, Go, PostgreSQL",      status: "Offer"     },
  { id: 4, companyName: "PhonePe", roleTitle: "Software Engineer II",     companyOrigin: "India", jobSource: "Referral",        packageOffered: "₹28 LPA", expectedCTC: "₹35 LPA", techStack: "Java, Spring Boot, Kafka",   status: "Applied"   },
  { id: 5, companyName: "Figma",   roleTitle: "Product Engineer",         companyOrigin: "USA",   jobSource: "AngelList",       packageOffered: "₹70 LPA", expectedCTC: "₹75 LPA", techStack: "React, WebAssembly, C++",    status: "Rejected"  },
];

const EMPTY_JOB = {
  companyName: "", roleTitle: "", companyOrigin: "", jobSource: "",
  packageOffered: "", expectedCTC: "", techStack: "", status: "Applied",
};

const uid = () => Date.now() + Math.random();

// ─── StatusBadge — pure display, defined outside to keep reference stable ─────

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Applied;
  return (
    <span style={{ ...S.badge, background: s.bg, color: s.text }}>
      <span style={{ ...S.dot, background: s.dot }} />
      {status}
    </span>
  );
};

const SortIcon = ({ colKey, sortKey, sortDir }) =>
  sortKey !== colKey
    ? <span style={S.sortIcon}>⇅</span>
    : <span style={{ ...S.sortIcon, color: "#a78bfa" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;

// ─── EditRow ──────────────────────────────────────────────────────────────────
// KEY FIX: Uses `defaultValue` (uncontrolled) + DOM refs instead of React state.
// This means typing NEVER triggers a parent re-render, so focus is never lost.
// Values are only read from refs at save time.

const EditRow = ({ initialData, onSave, onCancel, isAddRow }) => {
  const refs = useRef({});

  // Auto-focus the first field when the row appears
  useEffect(() => {
    refs.current["companyName"]?.focus();
  }, []);

  const collectAndSave = () => {
    const data = {};
    COLUMNS.forEach(({ key }) => {
      const el = refs.current[key];
      data[key] = el ? el.value : (initialData[key] || "");
    });
    onSave(data);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter")  collectAndSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <tr style={isAddRow ? S.addRow : S.trEditing}>
      {COLUMNS.map(({ key }) =>
        key === "status" ? (
          <td key={key} style={S.td}>
            <select
              defaultValue={initialData[key] || "Applied"}
              ref={(el) => { refs.current[key] = el; }}
              style={S.select}
            >
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </td>
        ) : (
          <td key={key} style={S.td}>
            <input
              defaultValue={initialData[key] || ""}
              ref={(el) => { refs.current[key] = el; }}
              style={S.cellInput}
              placeholder={key.replace(/([A-Z])/g, " $1").toLowerCase()}
              onKeyDown={handleKeyDown}
            />
          </td>
        )
      )}
      <td style={S.td}>
        <div style={S.actions}>
          <button style={S.saveBtn}   onClick={collectAndSave} title="Save (Enter)">✓</button>
          <button style={S.cancelBtn} onClick={onCancel}       title="Cancel (Esc)">✕</button>
        </div>
      </td>
    </tr>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function JobTracker() {
  const [jobs,          setJobs]          = useState(INITIAL_JOBS);
  const [search,        setSearch]        = useState("");
  const [editingId,     setEditingId]     = useState(null);
  const [showAddRow,    setShowAddRow]    = useState(false);
  const [sortKey,       setSortKey]       = useState(null);
  const [sortDir,       setSortDir]       = useState("asc");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fast substring search across all columns
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      COLUMNS.some(({ key }) => String(j[key] || "").toLowerCase().includes(q))
    );
  }, [jobs, search]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] || "").toLowerCase();
      const bv = String(b[sortKey] || "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = useCallback((key) => {
    setSortKey((prev) => {
      if (prev === key) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); return key; }
      setSortDir("asc"); return key;
    });
  }, []);

  const handleSaveEdit = useCallback((id, data) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...data } : j)));
    setEditingId(null);
  }, []);

  const handleSaveAdd = useCallback((data) => {
    if (!data.companyName?.trim()) return;
    setJobs((prev) => [{ ...data, id: uid() }, ...prev]);
    setShowAddRow(false);
  }, []);

  const handleDelete = useCallback((id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeleteConfirm(null);
    setEditingId((prev) => (prev === id ? null : prev));
  }, []);

  const startEdit = useCallback((job) => {
    setEditingId(job.id);
    setShowAddRow(false);
    setDeleteConfirm(null);
  }, []);

  const openAddRow = useCallback(() => {
    setShowAddRow(true);
    setEditingId(null);
    setDeleteConfirm(null);
  }, []);

  const stats = useMemo(
    () => STATUS_OPTIONS.reduce((acc, s) => ({ ...acc, [s]: jobs.filter((j) => j.status === s).length }), {}),
    [jobs]
  );

  return (
    <div style={S.page}>
      <div style={S.bgGlow} />

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.eyebrow}>CAREER COMMAND</div>
          <h1 style={S.title}>Job Applications</h1>
          <p style={S.subtitle}>
            {jobs.length} tracked &nbsp;•&nbsp;
            {stats.Offer} offer{stats.Offer !== 1 ? "s" : ""} &nbsp;•&nbsp;
            {stats.Interview} interview{stats.Interview !== 1 ? "s" : ""}
          </p>
        </div>
        <button style={S.addBtn} onClick={openAddRow}>+ Add Application</button>
      </div>

      {/* Search */}
      <div style={S.searchWrap}>
        <span style={S.searchIcon}>⌕</span>
        <input
          style={S.searchInput}
          placeholder="Search companies, roles, tech stack, status…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button style={S.clearBtn} onClick={() => setSearch("")}>✕</button>
        )}
        <span style={S.resultCount}>
          {sorted.length} result{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} style={S.th} onClick={() => handleSort(col.key)}>
                  <span style={S.thInner}>
                    {col.label}
                    <SortIcon colKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
              ))}
              <th style={{ ...S.th, minWidth: 110, cursor: "default" }}>Actions</th>
            </tr>
          </thead>
          <tbody>

            {/* Add-new row (uncontrolled EditRow) */}
            {showAddRow && (
              <EditRow
                key="__add__"
                initialData={EMPTY_JOB}
                onSave={handleSaveAdd}
                onCancel={() => setShowAddRow(false)}
                isAddRow
              />
            )}

            {/* Empty state */}
            {sorted.length === 0 && !showAddRow && (
              <tr>
                <td colSpan={COLUMNS.length + 1} style={S.emptyTd}>
                  <div style={S.emptyInner}>
                    <div style={S.emptyIcon}>◎</div>
                    <div>No applications found</div>
                    <div style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>
                      Try a different search term
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {sorted.map((job, idx) => {
              const isEditing  = editingId     === job.id;
              const isDeleting = deleteConfirm === job.id;

              // Show EditRow in place of this row (still uncontrolled)
              if (isEditing) {
                return (
                  <EditRow
                    key={`edit-${job.id}`}
                    initialData={job}
                    onSave={(data) => handleSaveEdit(job.id, data)}
                    onCancel={() => setEditingId(null)}
                    isAddRow={false}
                  />
                );
              }

              return (
                <tr
                  key={job.id}
                  style={{ ...S.tr, ...(idx % 2 !== 0 ? S.trAlt : {}) }}
                >
                  {COLUMNS.map((col) => (
                    <td key={col.key} style={S.td}>
                      {col.key === "status" ? (
                        <StatusBadge status={job[col.key]} />
                      ) : col.key === "techStack" ? (
                        <div style={S.techWrap}>
                          {String(job[col.key] || "")
                            .split(",")
                            .map((t, i) => (
                              <span key={i} style={S.techTag}>{t.trim()}</span>
                            ))}
                        </div>
                      ) : (
                        <span style={col.key === "companyName" ? S.companyCell : undefined}>
                          {job[col.key]}
                        </span>
                      )}
                    </td>
                  ))}

                  <td style={S.td}>
                    {isDeleting ? (
                      <div style={S.actions}>
                        <span style={S.deleteConfirmText}>Sure?</span>
                        <button style={S.deleteConfirmBtn} onClick={() => handleDelete(job.id)}>Yes</button>
                        <button style={S.cancelBtn}        onClick={() => setDeleteConfirm(null)}>No</button>
                      </div>
                    ) : (
                      <div style={S.actions}>
                        <button style={S.editBtn}   onClick={() => startEdit(job)}           title="Edit">✎</button>
                        <button style={S.deleteBtn} onClick={() => setDeleteConfirm(job.id)} title="Delete">⌫</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      <div style={S.footer}>
        {STATUS_OPTIONS.map((st) => {
          const style = STATUS_STYLES[st];
          return (
            <div key={st} style={S.statChip}>
              <span style={{ ...S.dot, background: style.dot }} />
              <span style={{ color: style.text, fontWeight: 600 }}>{stats[st]}</span>
              <span style={{ color: "#64748b", marginLeft: 4 }}>{st}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    background: "#090e1a",
    fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
    color: "#e2e8f0",
    padding: "32px 24px",
    position: "relative",
    overflow: "hidden",
  },
  bgGlow: {
    position: "fixed", top: -200, left: "50%",
    transform: "translateX(-50%)", width: 800, height: 400,
    background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    flexWrap: "wrap", gap: 16, marginBottom: 32, position: "relative", zIndex: 1,
  },
  eyebrow: { fontSize: 11, letterSpacing: "0.25em", color: "#7c3aed", fontWeight: 700, marginBottom: 8 },
  title: {
    fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 700, margin: 0,
    background: "linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    letterSpacing: "-0.02em",
  },
  subtitle: { color: "#475569", fontSize: 13, margin: "8px 0 0", letterSpacing: "0.03em" },
  addBtn: {
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff",
    border: "none", borderRadius: 10, padding: "12px 20px",
    fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
    letterSpacing: "0.04em", boxShadow: "0 0 20px rgba(124,58,237,0.35)", whiteSpace: "nowrap",
  },
  searchWrap: {
    position: "relative", zIndex: 1, display: "flex", alignItems: "center",
    background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14,
    padding: "4px 16px", marginBottom: 20, gap: 10,
    boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  searchIcon: { fontSize: 22, color: "#475569", lineHeight: 1, flexShrink: 0 },
  searchInput: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#e2e8f0", fontSize: 15, fontFamily: "inherit", padding: "12px 0",
  },
  clearBtn: {
    background: "#1e293b", border: "none", color: "#64748b", cursor: "pointer",
    borderRadius: 6, width: 24, height: 24, fontSize: 12,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  resultCount: { fontSize: 11, color: "#334155", whiteSpace: "nowrap", letterSpacing: "0.05em", flexShrink: 0 },
  tableWrap: {
    overflowX: "auto", borderRadius: 16, border: "1px solid #1e293b",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)", position: "relative", zIndex: 1,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 },
  th: {
    background: "#0c1628", padding: "14px 16px", textAlign: "left",
    fontWeight: 600, fontSize: 11, letterSpacing: "0.1em", color: "#475569",
    cursor: "pointer", userSelect: "none", borderBottom: "1px solid #1e293b",
    whiteSpace: "nowrap", textTransform: "uppercase",
  },
  thInner: { display: "flex", alignItems: "center", gap: 6 },
  sortIcon: { fontSize: 12, color: "#334155", opacity: 0.7 },
  tr:        { transition: "background 0.15s" },
  trAlt:     { background: "rgba(255,255,255,0.015)" },
  trEditing: { background: "rgba(124,58,237,0.08)", outline: "1px solid rgba(124,58,237,0.25)", outlineOffset: -1 },
  addRow:    { background: "rgba(124,58,237,0.06)", borderBottom: "1px solid rgba(124,58,237,0.2)" },
  td: { padding: "12px 16px", borderBottom: "1px solid #0f172a", verticalAlign: "middle", color: "#cbd5e1" },
  companyCell: { fontWeight: 600, color: "#f1f5f9", letterSpacing: "0.02em" },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
    borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", whiteSpace: "nowrap",
  },
  dot: { width: 6, height: 6, borderRadius: "50%", display: "inline-block", flexShrink: 0 },
  techWrap: { display: "flex", flexWrap: "wrap", gap: 4 },
  techTag: {
    background: "#1e293b", color: "#94a3b8", borderRadius: 6,
    padding: "2px 8px", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
  },
  actions: { display: "flex", gap: 6, alignItems: "center" },
  editBtn: {
    background: "#1e293b", border: "1px solid #334155", color: "#94a3b8",
    borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 15,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  deleteBtn: {
    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
    color: "#ef4444", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  saveBtn: {
    background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
    color: "#10b981", borderRadius: 8, width: 32, height: 32,
    cursor: "pointer", fontSize: 16, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  cancelBtn: {
    background: "#1e293b", border: "1px solid #334155", color: "#64748b",
    borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  deleteConfirmText: { fontSize: 11, color: "#ef4444", fontWeight: 600 },
  deleteConfirmBtn: {
    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
    color: "#f87171", borderRadius: 8, padding: "4px 10px",
    cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
  },
  cellInput: {
    background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9",
    borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "inherit",
    width: "100%", outline: "none", boxSizing: "border-box",
  },
  select: {
    background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9",
    borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "inherit",
    width: "100%", outline: "none", cursor: "pointer",
  },
  emptyTd:    { padding: "60px 24px", textAlign: "center", color: "#334155", fontSize: 15 },
  emptyInner: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  emptyIcon:  { fontSize: 36, opacity: 0.3, marginBottom: 8 },
  footer:     { display: "flex", gap: 16, flexWrap: "wrap", marginTop: 20, position: "relative", zIndex: 1 },
  statChip: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#0f172a", border: "1px solid #1e293b",
    borderRadius: 20, padding: "6px 14px", fontSize: 12,
  },
};
