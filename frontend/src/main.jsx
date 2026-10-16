import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
const API = "/api";
const COLUMNS = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE", label: "Done" },
];
function App() {
  const [tasks, setTasks] = useState([]),
    [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0 }),
    [showForm, setShowForm] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = async () => {
    try {
      setError("");
      const [a, b] = await Promise.all([
        fetch(`${API}/tasks`),
        fetch(`${API}/tasks/stats`),
      ]);
      if (!a.ok || !b.ok) throw Error("Backend unavailable");
      setTasks(await a.json());
      setStats(await b.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const update = async (t) => {
    const next =
      t.status === "TODO"
        ? "IN_PROGRESS"
        : t.status === "IN_PROGRESS"
          ? "DONE"
          : "TODO";
    await fetch(`${API}/tasks/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, status: next }),
    });
    load();
  };
  const create = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    await fetch(`${API}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: f.get("title"),
        description: f.get("description"),
        priority: f.get("priority"),
        assignee: f.get("assignee"),
        status: "TODO",
      }),
    });
    form.reset();
    setShowForm(false);
    load();
  };
  const grouped = COLUMNS.reduce((acc, c) => {
    acc[c.key] = tasks.filter((t) => t.status === c.key);
    return acc;
  }, {});
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">T</span>
          <b>TaskBoard</b>
        </div>
        <nav className="toplinks">
          <a className="active">Board</a>
          <a>My Tasks</a>
          <a>Projects</a>
          <a>Reports</a>
        </nav>
        <div className="topbar-right">
          <button className="primary" onClick={() => setShowForm(true)}>
            + New task
          </button>
          <div className="avatar">US</div>
        </div>
      </header>
      <main className="main">
        <section className="hero">
          <p className="eyebrow">WORKSPACE / OVERVIEW</p>
          <h1>Good morning, Ujjwal</h1>
          <p className="muted">
            Here’s what’s happening with your team today.
          </p>
        </section>
        {error && (
          <div className="alert">
            ⚠ {error}. Start the backend and PostgreSQL, then refresh.
          </div>
        )}
        <section className="stats-row">
          <Stat label="Total tasks" value={stats.total} icon="◆" />
          <Stat label="To do" value={stats.todo} icon="○" />
          <Stat label="In progress" value={stats.inProgress} icon="◔" />
          <Stat label="Completed" value={stats.done} icon="✓" />
        </section>
        <section className="workspace">
          <div className="board">
            {COLUMNS.map((c) => (
              <div className="column" key={c.key}>
                <div className="column-head">
                  <span className={`col-dot ${c.key.toLowerCase()}`}></span>
                  <h3>{c.label}</h3>
                  <span className="count">{grouped[c.key]?.length || 0}</span>
                </div>
                <div className="column-body">
                  {loading ? (
                    <div className="empty">Loading…</div>
                  ) : (
                    <>
                      {(grouped[c.key] || []).map((t) => (
                        <TaskCard key={t.id} t={t} onAdvance={update} />
                      ))}
                      {!(grouped[c.key] || []).length && (
                        <div className="empty">No tasks here.</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <aside className="panel activity">
            <div className="panel-head">
              <div>
                <h2>Recent activity</h2>
                <p className="muted">Latest workspace events.</p>
              </div>
            </div>
            <Activity
              icon="✓"
              text="Monitoring dashboard completed"
              time="12 min ago"
            />
            <Activity
              icon="◔"
              text="Release task moved to in progress"
              time="38 min ago"
            />
            <Activity
              icon="＋"
              text="New onboarding task created"
              time="1 hr ago"
            />
            <Activity
              icon="↗"
              text="Deployment pipeline passed"
              time="2 hrs ago"
            />
            <div className="pipeline">
              <span>CI</span>
              <i></i>
              <span>Build</span>
              <i></i>
              <span>Scan</span>
              <i></i>
              <span>Deploy</span>
            </div>
          </aside>
        </section>
        {showForm && (
          <div className="modal-backdrop">
            <form className="modal" onSubmit={create}>
              <div className="modal-head">
                <div>
                  <p className="eyebrow">CREATE TASK</p>
                  <h2>Add a new task</h2>
                </div>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>
              </div>
              <label>
                Task title
                <input
                  name="title"
                  required
                  placeholder="e.g. Configure production ingress"
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  placeholder="What needs to be done?"
                />
              </label>
              <div className="form-row">
                <label>
                  Priority
                  <select name="priority">
                    <option>LOW</option>
                    <option>MEDIUM</option>
                    <option>HIGH</option>
                  </select>
                </label>
                <label>
                  Assignee
                  <input name="assignee" defaultValue="Ujjwal" />
                </label>
              </div>
              <button className="primary full">Create task</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
function Stat({ label, value, icon }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <span>Updated just now</span>
      </div>
    </div>
  );
}
function TaskCard({ t, onAdvance }) {
  const initials = (t.assignee || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="task-card">
      <div className="task-card-top">
        <span className={`dot ${t.status.toLowerCase()}`}></span>
        <span className={`priority ${t.priority.toLowerCase()}`}>
          {t.priority}
        </span>
      </div>
      <b className="task-card-title">{t.title}</b>
      {t.description && <p className="task-card-desc">{t.description}</p>}
      <div className="task-card-foot">
        <div className="task-assignee">
          <span className="mini-avatar">{initials}</span>
          <small>{t.assignee}</small>
        </div>
        <button
          className="icon-btn"
          onClick={() => onAdvance(t)}
          title="Advance status"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
function Activity({ icon, text, time }) {
  return (
    <div className="activity-row">
      <span className="activity-icon">{icon}</span>
      <div>
        <b>{text}</b>
        <small>{time}</small>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
