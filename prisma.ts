"use client";
// src/app/dashboard/page.tsx
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface ProgressData {
  statusCounts: Record<string, number>;
  resumeCount: number;
  coverLetterCount: number;
  avgInterviewScore: number | null;
  recentInterviews: { id: string; role: string; score: number | null; createdAt: string }[];
  applications: { id: string; jobTitle: string; company: string; status: string; createdAt: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  applied: "#a78bfa",
  screening: "#06b6d4",
  interviewing: "#10b981",
  offer: "#f59e0b",
  rejected: "#f87171",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((json) => {
        if (json && json.statusCounts) setData(json);
        else setData({ statusCounts: {}, resumeCount: 0, coverLetterCount: 0, avgInterviewScore: null, recentInterviews: [], applications: [] });
      })
      .catch(console.error);
  }, []);

  if (status === "loading" || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading…</p>
      </div>
    );
  }

  const totalApps = Object.values(data.statusCounts ?? {}).reduce((a, b) => a + b, 0);

  return (
    <>
      <Navbar />
      <main style={{ padding: "40px 32px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Greeting */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>
            Dashboard
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>
            Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Applications", value: totalApps, color: "#a78bfa" },
            { label: "Resumes", value: data.resumeCount, color: "#06b6d4" },
            { label: "Cover Letters", value: data.coverLetterCount, color: "#10b981" },
            { label: "Interview Score", value: data.avgInterviewScore !== null ? `${data.avgInterviewScore}%` : "—", color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: 20 }}>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>
                {s.label}
              </p>
              <p style={{ fontSize: 30, fontWeight: 600, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
          {/* AI tools */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>AI Tools</h2>
            {[
              { href: "/resume", icon: "📄", title: "Resume Builder", desc: "Generate ATS-optimised resumes tailored to any job.", gradient: "linear-gradient(135deg,#4f46e5,#7c3aed)" },
              { href: "/cover-letter", icon: "✉️", title: "Cover Letter Generator", desc: "Write compelling, personalised cover letters in seconds.", gradient: "linear-gradient(135deg,#0891b2,#06b6d4)" },
              { href: "/interview", icon: "🎤", title: "Mock Interview", desc: "Practice role-specific questions and get AI feedback.", gradient: "linear-gradient(135deg,#059669,#10b981)" },
            ].map((tool) => (
              <Link key={tool.href} href={tool.href} style={{ textDecoration: "none" }}>
                <div className="card" style={{ display: "flex", gap: 16, alignItems: "flex-start", cursor: "pointer", transition: "background 0.2s" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: tool.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {tool.icon}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, marginBottom: 4 }}>{tool.title}</p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6 }}>{tool.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pipeline + recent */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Job Pipeline</h2>
            <div className="card" style={{ padding: 20 }}>
              {["applied", "screening", "interviewing", "offer", "rejected"].map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[s] }} />
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textTransform: "capitalize" }}>{s}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 90, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${totalApps ? ((data.statusCounts[s] || 0) / totalApps) * 100 : 0}%`, height: "100%", background: STATUS_COLORS[s], borderRadius: 2 }} />
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, minWidth: 16, textAlign: "right" }}>{data.statusCounts[s] || 0}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Recent Applications</p>
              </div>
              {data.applications.slice(0, 4).length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>No applications yet.</p>
              ) : (
                data.applications.slice(0, 4).map((app) => (
                  <div key={app.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{app.jobTitle}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{app.company}</p>
                    </div>
                    <span style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 20,
                      background: `${STATUS_COLORS[app.status]}22`,
                      color: STATUS_COLORS[app.status],
                      textTransform: "capitalize",
                    }}>{app.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
