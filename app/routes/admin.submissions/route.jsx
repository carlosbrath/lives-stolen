import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import prisma from "../../db.server";

export const loader = async () => {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse photoUrls JSON
    const parsedSubmissions = submissions.map((sub) => ({
      ...sub,
      photoUrls: sub.photoUrls ? JSON.parse(sub.photoUrls) : [],
    }));

    return json({ submissions: parsedSubmissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return json({ submissions: [], error: error.message });
  }
};

export default function AdminSubmissionsPage() {
  const { submissions, error } = useLoaderData();

  if (error) {
    return (
      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "20px", color: "#dc2626" }}>
          Error Loading Submissions
        </h1>
        <p>{error}</p>
      </div>
    );
  }

  const statusCounts = {
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    published: submissions.filter((s) => s.status === "published").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
            Story Submissions
          </h1>
          <Link
            to="/stories"
            style={{
              padding: "10px 20px",
              background: "#000",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "600",
            }}
          >
            View Stories Page
          </Link>
        </div>
        <p style={{ color: "#666", margin: 0 }}>
          All story submissions from your database
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <StatCard label="Total" count={submissions.length} color="#3b82f6" />
        <StatCard label="Pending" count={statusCounts.pending} color="#f59e0b" />
        <StatCard label="Approved" count={statusCounts.approved} color="#10b981" />
        <StatCard label="Published" count={statusCounts.published} color="#8b5cf6" />
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "#f9f9f9",
            borderRadius: "12px",
            border: "2px dashed #ddd",
          }}
        >
          <p style={{ fontSize: "1.1rem", color: "#666", margin: 0 }}>
            No submissions yet. Submit a story to see it here!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, count, color }) {
  return (
    <div
      style={{
        padding: "24px",
        background: "#fff",
        border: "2px solid #e5e5e5",
        borderRadius: "12px",
      }}
    >
      <p style={{ fontSize: "0.9rem", color: "#666", margin: "0 0 8px 0" }}>{label}</p>
      <p style={{ fontSize: "2rem", fontWeight: "bold", color, margin: 0 }}>{count}</p>
    </div>
  );
}

function SubmissionCard({ submission }) {
  const statusColors = {
    pending: "#f59e0b",
    approved: "#10b981",
    published: "#8b5cf6",
    rejected: "#ef4444",
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "2px solid #e5e5e5",
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", margin: "0 0 8px 0" }}>
            {submission.shortTitle}
          </h3>
          <div style={{ display: "flex", gap: "12px", fontSize: "0.9rem", color: "#666", flexWrap: "wrap" }}>
            <span>📍 {submission.state}</span>
            <span>📅 {submission.incidentDate}</span>
            <span>🚴 {submission.roadUserType}</span>
            <span>⚠️ {submission.injuryType}</span>
          </div>
        </div>
        <div
          style={{
            padding: "6px 12px",
            background: statusColors[submission.status] || "#999",
            color: "#fff",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: "600",
            textTransform: "capitalize",
          }}
        >
          {submission.status}
        </div>
      </div>

      {/* Story */}
      <div style={{ marginBottom: "16px" }}>
        <p style={{ color: "#333", lineHeight: "1.6", margin: 0 }}>
          {submission.victimStory}
        </p>
      </div>

      {/* Submitter Info */}
      <div
        style={{
          padding: "16px",
          background: "#f9f9f9",
          borderRadius: "8px",
          fontSize: "0.9rem",
          marginBottom: "12px",
        }}
      >
        <p style={{ margin: "4px 0" }}>
          <strong>Submitted by:</strong> {submission.submitterName} ({submission.submitterEmail})
        </p>
        {submission.victimName && (
          <p style={{ margin: "4px 0" }}>
            <strong>Victim:</strong> {submission.victimName}
            {submission.relation && ` (${submission.relation})`}
          </p>
        )}
        {submission.age && (
          <p style={{ margin: "4px 0" }}>
            <strong>Age:</strong> {submission.age}
            {submission.gender && ` • ${submission.gender}`}
          </p>
        )}
        <p style={{ margin: "4px 0", color: "#666", fontSize: "0.85rem" }}>
          <strong>Submitted:</strong> {new Date(submission.createdAt).toLocaleString()}
        </p>
        {submission.metaobjectId && (
          <p style={{ margin: "4px 0", color: "#10b981", fontSize: "0.85rem" }}>
            ✅ Synced to Shopify Metaobject
          </p>
        )}
      </div>

      {/* Database Info */}
      <div style={{ fontSize: "0.85rem", color: "#999" }}>
        <strong>Database ID:</strong> {submission.id}
      </div>
    </div>
  );
}
