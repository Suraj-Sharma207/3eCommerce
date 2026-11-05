import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, Edit2, Search } from "lucide-react";
import useConfirmStore from "../../../store/confirmStore";

const AdminAIKnowledge = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { confirm } = useConfirmStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "faq",
  });

  const fetchKnowledge = async () => {
    try {
      const response = await axios.get("/api/chatbot/admin/knowledge");
      setEntries(response.data);
    } catch (error) {
      console.error("Failed to fetch knowledge:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleDelete = async (category, id) => {
    const isConfirmed = await confirm({
      title: "Delete Knowledge Entry",
      description:
        "Are you sure you want to delete this entry from the AI knowledge base? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (isConfirmed) {
      try {
        await axios.delete(`/api/chatbot/admin/knowledge/${category}/${id}`);
        fetchKnowledge();
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await axios.put(
          `/api/chatbot/admin/knowledge/${editingEntry.entry_id}`,
          formData,
        );
      } else {
        await axios.post("/api/chatbot/admin/knowledge", formData);
      }
      setIsModalOpen(false);
      fetchKnowledge();
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const openModal = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        title: entry.title,
        content: entry.content,
        category: entry.category,
      });
    } else {
      setEditingEntry(null);
      setFormData({ title: "", content: "", category: "faq" });
    }
    setIsModalOpen(true);
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.content?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none focus:outline-none text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">
            Loading entries...
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredEntries.map((entry, idx) => (
              <div
                key={idx}
                className="p-4 flex gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">
                      {entry.category}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {entry.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {entry.content}
                  </p>
                </div>
                <div className="flex items-start gap-2 flex-shrink-0">
                  <button
                    onClick={() => openModal(entry)}
                    className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.category, entry.entry_id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No knowledge entries found.
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">
                {editingEntry ? "Edit Entry" : "New Knowledge Entry"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-6 overflow-y-auto flex-1 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="faq">FAQ</option>
                  <option value="shipping">Shipping Policy</option>
                  <option value="warranty">Warranty Policy</option>
                  <option value="return_policy">Return Policy</option>
                  <option value="buying_guide">Buying Guide</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="e.g., Do you ship internationally?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (Markdown supported)
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm min-h-[200px]"
                  placeholder="Yes, we ship to over 50 countries..."
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
                >
                  {editingEntry ? "Save Changes" : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAIKnowledge;
