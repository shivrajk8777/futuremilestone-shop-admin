"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TeamManagementPage() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTeam = () => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTeam(data.team);
        }
      })
      .catch((err) => console.error("Failed to fetch team:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete team member "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTeam((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(data.error || "Failed to delete team member.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.05em] text-fjord-ink">
            Team Members
          </h1>
          <p className="text-fjord-muted text-[14px] mt-1">
            Manage the team members displayed on the About Us page of the storefront.
          </p>
        </div>
        <Link
          href="/team/new"
          className="rounded-full px-6 py-3 bg-fjord-accent text-fjord-bg font-semibold text-[14px] hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
        >
          Add Member
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg className="animate-spin h-7 w-7 text-fjord-ink" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-fjord-muted text-xs">Loading team members...</p>
        </div>
      ) : team.length === 0 ? (
        <div className="bg-fjord-panel/40 border border-dashed border-fjord-line rounded-[32px] p-20 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-fjord-panel-strong border border-fjord-soft-line flex items-center justify-center text-3xl">
            👥
          </div>
          <div>
            <h3 className="text-lg font-bold">No dynamic team members</h3>
            <p className="text-fjord-muted text-[14px] mt-1 max-w-sm">
              Add your first team member here. If no dynamic members are added, the storefront will display the default mock team.
            </p>
          </div>
          <Link
            href="/team/new"
            className="rounded-full px-5 py-2.5 bg-fjord-accent text-fjord-bg font-semibold text-[13px] hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer mt-2"
          >
            Create Member
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((member) => (
            <div
              key={member.id}
              className="p-5 bg-fjord-panel/72 border border-fjord-soft-line backdrop-blur-[14px] rounded-[28px] shadow-fjord-soft flex flex-col justify-between transition-all duration-[180ms]"
            >
              <div className="space-y-4">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-fjord-soft-line bg-fjord-panel-strong relative">
                  <img
                    src={member.image || "/images/HuqNTe7ZlAoHRwcSqCGZZ9PGYQQ_df2789.webp"}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-fjord-ink tracking-tight">{member.name}</h3>
                  <p className="text-fjord-muted text-[13px] font-semibold uppercase tracking-wider mt-0.5">{member.role}</p>
                </div>

                <div className="flex gap-2.5 pt-1 text-fjord-muted">
                  {member.socials?.twitter && member.socials.twitter !== "#" && (
                    <span className="px-2 py-0.5 bg-fjord-ink/5 border border-fjord-soft-line rounded text-[10px] font-medium">
                      Twitter
                    </span>
                  )}
                  {member.socials?.instagram && member.socials.instagram !== "#" && (
                    <span className="px-2 py-0.5 bg-fjord-ink/5 border border-fjord-soft-line rounded text-[10px] font-medium">
                      Instagram
                    </span>
                  )}
                  {member.socials?.behance && member.socials.behance !== "#" && (
                    <span className="px-2 py-0.5 bg-fjord-ink/5 border border-fjord-soft-line rounded text-[10px] font-medium">
                      Behance
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-fjord-soft-line pt-4 mt-5">
                <Link
                  href={`/team/${member.id}/edit`}
                  className="flex-1 py-2 px-4 rounded-xl border border-fjord-line hover:border-fjord-ink/20 hover:bg-fjord-panel text-[13px] font-semibold transition-all text-center"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(member.id, member.name)}
                  disabled={deletingId === member.id}
                  className="flex-1 py-2 px-4 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/5 text-[13px] font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
