import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { Save, RefreshCw, Database } from "lucide-react";
import useConfirmStore from "../../../store/confirmStore";
import toast from "react-hot-toast";
const AdminAISettings = () => {
  const [collections, setCollections] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirmStore();

  const fetchCollections = async () => {
    try {
      const response = await api.get("/chatbot/admin/collections");
      setCollections(response.data);
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleBulkSync = async () => {
    const isConfirmed = await confirm({
      title: "Bulk Sync Products",
      description:
        "This will sync all PostgreSQL products to the Qdrant vector database. This may take several minutes depending on catalog size.",
      confirmText: "Start Sync",
      cancelText: "Cancel",
    });

    if (isConfirmed) {
      setSyncing(true);
      try {
        const response = await api.post("/chatbot/sync/bulk");
        toast.success(
          `Sync Complete: ${response.data.total_synced} products synced. ${response.data.total_failed} failed.`,
        );
        fetchCollections();
      } catch (error) {
        toast.error(
          `Sync Failed: ${error.response?.data?.message || "An error occurred during bulk sync."}`,
        );
      } finally {
        setSyncing(false);
      }
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* System Status */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Vector Database Status (Qdrant)
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full text-center text-gray-400 animate-pulse py-4">
                Loading stats...
              </div>
            ) : collections.length > 0 ? (
              collections.map((coll) => (
                <div
                  key={coll.name}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-700 capitalize">
                      {coll.name}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${coll.status === "green" ? "bg-green-500" : "bg-amber-500"}`}
                    />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {coll.points_count}
                    </span>
                    <span className="text-xs text-gray-500">points</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-red-500 py-4">
                Failed to load Qdrant stats. Ensure Qdrant is running.
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">
                Product Catalog Sync
              </h4>
              <p className="text-xs text-gray-500">
                Products are auto-synced on change. Use this to force a full
                re-sync.
              </p>
            </div>
            <button
              onClick={handleBulkSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              {syncing ? "Syncing..." : "Force Bulk Sync"}
            </button>
          </div>
        </div>
      </section>

      {/* Configuration Settings (Static display for now) */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          AI Configuration
        </h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gemini Model
              </label>
              <input
                type="text"
                disabled
                value="gemini-2.0-flash"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Embedding Model
              </label>
              <input
                type="text"
                disabled
                value="models/text-embedding-004"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vector DB
              </label>
              <input
                type="text"
                disabled
                value="Qdrant (Local)"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Memory Cache
              </label>
              <input
                type="text"
                disabled
                value="Redis (TTL: 30m)"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 text-right">
            <button
              disabled
              className="px-4 py-2 bg-gray-200 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
            >
              Configuration is set via Environment Variables
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminAISettings;
