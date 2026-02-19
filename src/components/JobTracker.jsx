import { useState, useMemo, useCallback, useRef } from "react";

const INITIAL_JOBS = [
  {
    id: 1,
    companyName: "Stripe",
    roleTitle: "Senior Frontend Engineer",
    companyOrigin: "USA",
    jobSource: "LinkedIn",
    packageOffered: "₹45 LPA",
    expectedCTC: "₹50 LPA",
    techStack: "React, TypeScript, GraphQL",
    status: "Applied",
  },
  {
    id: 2,
    companyName: "Zepto",
    roleTitle: "Lead React Developer",
    companyOrigin: "India",
    jobSource: "Naukri",
    packageOffered: "₹32 LPA",
    expectedCTC: "₹38 LPA",
    techStack: "React, Node.js, AWS",
    status: "Interview",
  },
  {
    id: 3,
    companyName: "Notion",
    roleTitle: "Full Stack Engineer",
    companyOrigin: "USA",
    jobSource: "Company Website",
    packageOffered: "₹55 LPA",
    expectedCTC: "₹60 LPA",
    techStack: "React, Go, PostgreSQL",
    status: "Offer",
  },
  {
    id: 4,
    companyName: "PhonePe",
    roleTitle: "Software Engineer II",
    companyOrigin: "India",
    jobSource: "Referral",
    packageOffered: "₹28 LPA",
    expectedCTC: "₹35 LPA",
    techStack: "Java, Spring Boot, Kafka",
    status: "Applied",
  },
  {
    id: 5,
    companyName: "Figma",
    roleTitle: "Product Engineer",
    companyOrigin: "USA",
    jobSource: "AngelList",
    packageOffered: "₹70 LPA",
    expectedCTC: "₹75 LPA",
    techStack: "React, WebAssembly, C++",
    status: "Rejected",
  },
];

const COLUMNS = [
  { key: "companyName", label: "Company" },
  { key: "roleTitle", label: "Role" },
  { key: "companyOrigin", label: "Origin" },
  { key: "jobSource", label: "Source" },
  { key: "packageOffered", label: "Package" },
  { key: "expectedCTC", label: "Expected CTC" },
  { key: "techStack", label: "Tech Stack" },
  { key: "status", label: "Status" },
];

const STATUS_STYLES = {
  Applied: { bg: "#1e3a5f", text: "#60a5fa", dot: "#3b82f6" },
  Interview: { bg: "#3b2a00", text: "#fbbf24", dot: "#f59e0b" },
  Offer: { bg: "#0d3321", text: "#34d399", dot: "#10b981" },
  Rejected: { bg: "#3b1a1a", text: "#f87171", dot: "#ef4444" },
};

const STATUS_OPTIONS = ["Applied", "Interview", "Offer", "Rejected"];

const generateId = () => Date.now() + Math.random();

const EMPTY_JOB = {
  companyName: "",
  roleTitle: "",
  companyOrigin: "",
  jobSource: "",
  packageOffered: "",
  expectedCTC: "",
  techStack: "",
  status: "Applied",
};

export default function JobTracker() {
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [showAddRow, setShowAddRow] = useState(false);
  const [newJob, setNewJob] = useState({ ...EMPTY_JOB });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const searchRef = useRef(null);

  // Fast fuzzy search
  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter((j) =>
      COLUMNS.some((col) =>
        String(j[col.key] || "").toLowerCase().includes(q)
      )
    );
  }, [jobs, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] || "").toLowerCase();
      const bv = String(b[sortKey] || "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const startEdit = (job) => {
    setEditingId(job.id);
    setEditData({ ...job });
    setShowAddRow(false);
  };

  const saveEdit = () => {
    setJobs((prev) => prev.map((j) => (j.id === editingId ? { ...editData } : j)));
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleDelete = (id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeleteConfirm(null);
    if (editingId === id) setEditingId(null);
  };

  const addJob = () => {
    if (!newJob.companyName.trim()) return;
    setJobs((prev) => [{ ...newJob, id: generateId() }, ...prev]);
    setNewJob({ ...EMPTY_JOB });
    setShowAddRow(false);
  };

  const EditCell = ({ field, value, onChange, type = "text" }) =>
    field === "status" ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.select}
      >
        {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
      </select>
    ) : (
      <input
        autoFocus={field === "companyName"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.cellInput}
        placeholder={field}
      />
    );

  const StatusBadge = ({ status }) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES["Applied"];
    return (
      <span style={{ ...styles.badge, background: s.bg, color: s.text }}>
        <span style={{ ...styles.dot, background: s.dot }} />
        {status}
      </span>
    );
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col.key) return <span style={styles.sortIcon}>⇅</span>;
    return <span style={{ ...styles.sortIcon, color: "#a78bfa" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div style={styles.page}>
      {/* Background texture */}
      <div style={styles.bgGlow} />

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>CAREER COMMAND</div>
          <h1 style={styles.title}>Job Applications</h1>
          <p style={styles.subtitle}>{jobs.length} applications tracked • {jobs.filter(j => j.status === "Offer").length} offers • {jobs.filter(j => j.status === "Interview").length} interviews</p>
        </div>
        <button style={styles.addBtn} onClick={() => { setShowAddRow(true); setEditingId(null); }}>
          + Add Application
        </button>
      </div>

      {/* Search Bar */}
      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>⌕</span>
        <input
          ref={searchRef}
          style={styles.searchInput}
          placeholder="Search companies, roles, tech stack, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button style={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
        )}
        <span style={styles.resultCount}>{sorted.length} result{sorted.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  style={styles.th}
                  onClick={() => handleSort(col.key)}
                >
                  <span style={styles.thInner}>
                    {col.label} <SortIcon col={col} />
                  </span>
                </th>
              ))}
              <th style={{ ...styles.th, minWidth: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Add new row */}
            {showAddRow && (
              <tr style={styles.addRow}>
                {COLUMNS.map((col) => (
                  <td key={col.key} style={styles.td}>
                    <EditCell
                      field={col.key}
                      value={newJob[col.key]}
                      onChange={(v) => setNewJob((p) => ({ ...p, [col.key]: v }))}
                    />
                  </td>
                ))}
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button style={styles.saveBtn} onClick={addJob} title="Save">✓</button>
                    <button style={styles.cancelBtn} onClick={() => setShowAddRow(false)} title="Cancel">✕</button>
                  </div>
                </td>
              </tr>
            )}

            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} style={styles.empty}>
                  <div style={styles.emptyInner}>
                    <div style={styles.emptyIcon}>◎</div>
                    <div>No applications found</div>
                    <div style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>Try a different search term</div>
                  </div>
                </td>
              </tr>
            )}

            {sorted.map((job, idx) => {
              const isEditing = editingId === job.id;
              const isDeleting = deleteConfirm === job.id;
              return (
                <tr
                  key={job.id}
                  style={{
                    ...styles.tr,
                    ...(isEditing ? styles.trEditing : {}),
                    ...(idx % 2 === 0 ? {} : styles.trAlt),
                  }}
                >
                  {COLUMNS.map((col) => (
                    <td key={col.key} style={styles.td}>
                      {isEditing ? (
                        <EditCell
                          field={col.key}
                          value={editData[col.key]}
                          onChange={(v) => setEditData((p) => ({ ...p, [col.key]: v }))}
                        />
                      ) : col.key === "status" ? (
                        <StatusBadge status={job[col.key]} />
                      ) : col.key === "techStack" ? (
                        <div style={styles.techWrap}>
                          {String(job[col.key] || "").split(",").map((t, i) => (
                            <span key={i} style={styles.techTag}>{t.trim()}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={col.key === "companyName" ? styles.companyCell : {}}>{job[col.key]}</span>
                      )}
                    </td>
                  ))}
                  <td style={styles.td}>
                    {isDeleting ? (
                      <div style={styles.deleteConfirmWrap}>
                        <span style={styles.deleteConfirmText}>Sure?</span>
                        <button style={styles.deleteConfirmBtn} onClick={() => handleDelete(job.id)}>Yes</button>
                        <button style={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>No</button>
                      </div>
                    ) : isEditing ? (
                      <div style={styles.actions}>
                        <button style={styles.saveBtn} onClick={saveEdit} title="Save">✓</button>
                        <button style={styles.cancelBtn} onClick={cancelEdit} title="Cancel">✕</button>
                      </div>
                    ) : (
                      <div style={styles.actions}>
                        <button style={styles.editBtn} onClick={() => startEdit(job)} title="Edit">✎</button>
                        <button style={styles.deleteBtn} onClick={() => setDeleteConfirm(job.id)} title="Delete">⌫</button>
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
      <div style={styles.footer}>
        {Object.entries(STATUS_STYLES).map(([s, style]) => (
          <div key={s} style={styles.statChip}>
            <span style={{ ...styles.dot, background: style.dot }} />
            <span style={{ color: style.text, fontWeight: 600 }}>{jobs.filter(j => j.status === s).length}</span>
            <span style={{ color: "#64748b", marginLeft: 4 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
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
    position: "fixed",
    top: -200,
    left: "50%",
    transform: "translateX(-50%)",
    width: 800,
    height: 400,
    background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 32,
    position: "relative",
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.25em",
    color: "#7c3aed",
    fontWeight: 700,
    marginBottom: 8,
  },
  title: {
    fontSize: "clamp(24px, 5vw, 40px)",
    fontWeight: 700,
    margin: 0,
    background: "linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.02em",
    fontFamily: "'DM Mono', monospace",
  },
  subtitle: {
    color: "#475569",
    fontSize: 13,
    margin: "8px 0 0",
    letterSpacing: "0.03em",
  },
  addBtn: {
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.04em",
    boxShadow: "0 0 20px rgba(124,58,237,0.35)",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  searchWrap: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: "4px 16px",
    marginBottom: 20,
    gap: 10,
    boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
    transition: "border-color 0.2s",
  },
  searchIcon: {
    fontSize: 22,
    color: "#475569",
    lineHeight: 1,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e2e8f0",
    fontSize: 15,
    fontFamily: "inherit",
    padding: "12px 0",
    letterSpacing: "0.01em",
  },
  clearBtn: {
    background: "#1e293b",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    borderRadius: 6,
    width: 24,
    height: 24,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultCount: {
    fontSize: 11,
    color: "#334155",
    whiteSpace: "nowrap",
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: 16,
    border: "1px solid #1e293b",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    position: "relative",
    zIndex: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    minWidth: 900,
  },
  th: {
    background: "#0c1628",
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.1em",
    color: "#475569",
    cursor: "pointer",
    userSelect: "none",
    borderBottom: "1px solid #1e293b",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
  },
  thInner: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  sortIcon: {
    fontSize: 12,
    color: "#334155",
    opacity: 0.7,
  },
  tr: {
    transition: "background 0.15s",
    cursor: "default",
  },
  trAlt: {
    background: "rgba(255,255,255,0.01)",
  },
  trEditing: {
    background: "rgba(124,58,237,0.08)",
    outline: "1px solid rgba(124,58,237,0.3)",
    outlineOffset: -1,
  },
  addRow: {
    background: "rgba(124,58,237,0.06)",
    borderBottom: "1px solid rgba(124,58,237,0.2)",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #0f172a",
    verticalAlign: "middle",
    color: "#cbd5e1",
    maxWidth: 200,
  },
  companyCell: {
    fontWeight: 600,
    color: "#f1f5f9",
    letterSpacing: "0.02em",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  techWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
  },
  techTag: {
    background: "#1e293b",
    color: "#94a3b8",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  editBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: 8,
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  deleteBtn: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#ef4444",
    borderRadius: 8,
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  saveBtn: {
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(16,185,129,0.3)",
    color: "#10b981",
    borderRadius: 8,
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#64748b",
    borderRadius: 8,
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteConfirmWrap: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  deleteConfirmText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: 600,
  },
  deleteConfirmBtn: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.4)",
    color: "#f87171",
    borderRadius: 8,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "inherit",
  },
  cellInput: {
    background: "#0f172a",
    border: "1px solid #334155",
    color: "#f1f5f9",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    fontFamily: "inherit",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    background: "#0f172a",
    border: "1px solid #334155",
    color: "#f1f5f9",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    fontFamily: "inherit",
    width: "100%",
    outline: "none",
    cursor: "pointer",
  },
  empty: {
    padding: "60px 24px",
    textAlign: "center",
    color: "#334155",
    fontSize: 15,
  },
  emptyInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
    opacity: 0.3,
    marginBottom: 8,
  },
  footer: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 20,
    position: "relative",
    zIndex: 1,
  },
  statChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12,
  },
};
