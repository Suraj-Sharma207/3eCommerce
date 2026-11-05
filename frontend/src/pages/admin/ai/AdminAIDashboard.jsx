import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { MessageSquare, Zap, Clock, BrainCircuit } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, subtitle }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
    <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h4 className="text-gray-500 text-sm font-medium">{title}</h4>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const AdminAIDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get("/chatbot/admin/analytics");
        setAnalytics(response.data);
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("Failed to fetch analytics:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Loading analytics...
      </div>
    );
  if (!analytics)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load analytics data.
      </div>
    );

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-2xl font-bold text-gray-900">
        AI Analytics Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Conversations"
          value={analytics.total_conversations}
          icon={MessageSquare}
        />
        <StatCard
          title="Avg Response Time"
          value={`${analytics.avg_response_time_ms}ms`}
          icon={Clock}
        />
        <StatCard
          title="Gemini Usage"
          value={`${analytics.gemini_usage_percentage}%`}
          subtitle={`${analytics.gemini_usage_count} calls`}
          icon={BrainCircuit}
        />
        <StatCard
          title="Cache Hit Rate"
          value={`${analytics.cache_hit_rate}%`}
          subtitle="Zero-token responses"
          icon={Zap}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Intent Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Intent Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.top_intents).map(([intent, count]) => (
              <div key={intent} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {intent}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500"
                      style={{
                        width: `${(count / analytics.total_messages) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unknown Questions */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Unrelated Queries
          </h3>
          {analytics.unknown_questions.length > 0 ? (
            <ul className="space-y-2">
              {analytics.unknown_questions.map((q, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-600 bg-gray-50 p-2 rounded line-clamp-1 border border-gray-100"
                >
                  "{q}"
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No unrelated queries logged recently.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAIDashboard;
