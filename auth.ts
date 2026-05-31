"use client";
// src/app/cover-letter/page.tsx
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Letter {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function CoverLetterPage() {
  const { status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({ userBackground: "", jobTitle: "", company: "", jobDescription: "" });
  const [loading, setLoading] = useState(false);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [selected, setSelected] = useState<Letter | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/generate-cover-letter").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setLetters(d);
    });
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/generate-cover-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to generate.");
      return;
    }

    const letter = await res.json();
    setLetters((prev) => [letter, ...prev]);
    setSelected(letter);
    setForm({ userBackground: "", jobTitle: "", company: "", jobDescription: "" });
  }

  return (
    <>
      <Navbar />
      <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>✉️ Cover Letter Generator</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 24 }}>Write compelling, personalised cover letters in seconds.</p>

          <form onSubmit={handleGenerate} className="card" style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            <div>
              <label className="label">Your background *</label>
              <textarea className="input" placeholder="Your experience, skills, achievements…"
                value={form.userBackground} onChange={(e) => setForm({ ...form, userBackground: e.target.value })} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label">Job title *</label>
                <input className="input" type="text" placeholder="Product Manager"
                  value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} required />
              </div>
              <div>
                <label className="label">Company</label>
                <input className="input" type="text" placeholder="Linear"
                  value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Job description (optional)</label>
              <textarea className="input" placeholder="Paste the job posting…" style={{ minHeight: 80 }}
                value={form.jobDescription} onChange={(e) => setForm({ ...form, jobDescription: e.target.value })} />
            </div>

            {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Writing with Claude…" : "Generate Cover Letter"}
            </button>
          </form>

          {letters.length > 0 && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: "rgba(255,255,255,0.6)" }}>Saved letters</h2>
              {letters.map((l) => (
                <div key={l.id} onClick={() => setSelected(l)} className="card"
                  style={{ marginBottom: 10, cursor: "pointer", padding: "14px 18px", background: selected?.id === l.id ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.06)", borderColor: selected?.id === l.id ? "rgba(6,182,212,0.4)" : undefined }}>
                  <p style={{ fontWeight: 500, fontSize: 14 }}>{l.title}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{new Date(l.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: "rgba(255,255,255,0.6)" }}>Preview</h2>
          {selected ? (
            <div className="card" style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.8, color: "rgba(255,255,255,0.85)", overflowY: "auto", maxHeight: "calc(100vh - 220px)" }}>
              {selected.content}
            </div>
          ) : (
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
              Generate a cover letter to see the preview
            </div>
          )}
        </div>
      </main>
    </>
  );
}
