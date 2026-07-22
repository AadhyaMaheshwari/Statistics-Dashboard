import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../pages/Dashboard.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getInitials(name) {
  return name
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGreeting() {
  const h = new Date().getHours();

  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AnalyticsDashboard() {
  const [gmailConnected, setGmailConnected] = useState(false);
  const navigate = useNavigate();

  const [name, setName] = useState("");

  const [stats, setStats] = useState({
    unread: 0,
    spam: 0,
    promotions: 0,
    sent: 0,
    social: 0,
    updates: 0,
  });

  const [emails, setEmails] = useState([]);

  const chartData = stats ? [
    { name: "Promotions", value: stats.promotions },
    { name: "Social", value: stats.social },
    { name: "Spam", value: stats.spam },
    { name: "Updates", value: stats.updates },
    { name: "Others", value: (stats.inbox || 0) - stats.promotions - stats.social - stats.spam - (stats.updates || 0) - (stats.forums || 0) },
  ] : [];

  const COLORS = [
    "#437fdf",
    "#9f45ee",
    "#63bd7b",
    "#d41b68",
    "#f5a623",
  ];

  async function connectGmail() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/api/auth/google/connect`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/gmail/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success && data.stats) {
        setStats(data.stats);
        setGmailConnected(true);
      } else {
        setGmailConnected(false);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchRecentEmails() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/api/gmail/recent`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setEmails(data.emails);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("userName");

    if (!token || !stored) {
      navigate("/signin");
    } else {
      setName(stored);
      fetchStats();
      fetchRecentEmails();
    }
  }, [navigate]);

  function handleSignOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/signin");
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="greeting">
            {getGreeting()}, {name ? name.split(" ")[0] : ""}
          </h1>

          <p className="greeting-sub">
            Your mail statistics look like this:
          </p>
        </div>

        <div className="topbar-right">
          <button
            className="topbar-signout"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </header>

      {stats && (
        <section className="stats-grid">
          {Object.entries(stats).map(([label, value]) => (
            <div className="stat-card" key={label}>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label.toUpperCase()}</div>
            </div>
          ))}
        </section>
      )}
      <section className="card">
        <h2 className="card-title">
          Email Distribution
        </h2>

        <PieChart width={450} height={300}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            label
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </section>

      <div className="lower-grid">
        <section className="card">
          <h2 className="card-title">
            Recent Emails
          </h2>

          <ul className="activity-list">
            {emails.map((email, index) => (
              <li
                className="activity-item"
                key={index}
              >
                <div>{email.subject}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="card-title">
            Quick Actions
          </h2>

          <div className="actions-list">
            {gmailConnected ? (
              <button className="action-btn">
                ✓ Gmail Connected
              </button>
            ) : (
              <button
                className="action-btn"
                onClick={connectGmail}
              >
                Connect Gmail
              </button>
            )}

            <button
              className="action-btn"
              onClick={fetchStats}
            >
              Refresh Statistics
            </button>
          </div>
        </section>
      </div>
    </>
  );
}