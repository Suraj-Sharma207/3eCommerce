import React, { useState, useEffect, useRef } from "react";
import useConfirmStore from "../../store/confirmStore";
import toast from "react-hot-toast";
import {
  Upload,
  Trash2,
  CheckCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Button from "../../components/ui/Button";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import api from "../../services/api";

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80";

const AdminShopBanner = () => {
  const [activeBanner, setActiveBanner] = useState(null);
  const [previewImage, setPreviewImage] = useState(DEFAULT_BANNER);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const { confirm } = useConfirmStore();
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchActiveBanner();
  }, []);

  const fetchActiveBanner = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/shop-banner");
      if (response.data && response.data.success && response.data.data) {
        setActiveBanner(response.data.data);
        setPreviewImage(response.data.data.image);
      } else {
        setActiveBanner(null);
        setPreviewImage(DEFAULT_BANNER);
      }
    } catch (error) {
      console.error("Failed to fetch active shop banner:", error);
      showMessage("error", "Failed to load shop banner configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "Image size must be less than 5MB");
      e.target.value = "";
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showMessage("error", "Only JPG, PNG and WEBP formats are allowed");
      e.target.value = "";
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (img.width < 1000 || img.height < 400) {
        showMessage(
          "error",
          `Image resolution is too low. Required at least 1000x400. Uploaded: ${img.width}x${img.height}`,
        );
        fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      showMessage("success", "Image validated. Click Save Changes to publish.");
    };
    img.onerror = () => {
      showMessage("error", "Invalid image file");
      e.target.value = "";
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSave = async () => {
    if (!selectedFile) {
      showMessage("error", "Please select an image first");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", selectedFile);

      const endpoint = activeBanner
        ? `/admin/shop-banner/${activeBanner.id}`
        : "/admin/shop-banner";
      const method = activeBanner ? "put" : "post";

      const response = await api[method](endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setActiveBanner(response.data.data);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        showMessage("success", "Shop banner published successfully!");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      showMessage(
        "error",
        error.response?.data?.message || "Failed to upload banner",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeBanner) return;

    const isConfirmed = await confirm({
      title: "Remove Banner",
      description:
        "Are you sure you want to remove the custom banner? The default shop image will be restored.",
      variant: "warning",
      confirmText: "Remove",
    });
    if (!isConfirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete(`/admin/shop-banner/${activeBanner.id}`);
      setActiveBanner(null);
      setSelectedFile(null);
      setPreviewImage(DEFAULT_BANNER);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showMessage("success", "Custom banner removed. Restored to default.");
    } catch (error) {
      console.error("Delete failed:", error);
      showMessage("error", "Failed to delete banner");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    setPreviewImage(activeBanner ? activeBanner.image : DEFAULT_BANNER);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <SkeletonLoader className="h-6 w-48 mb-2" />
          <SkeletonLoader className="h-4 w-96 mb-6" />
        </div>
        <SkeletonLoader className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Shop Page Banner
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage the hero background image for the main Products listing page.
          </p>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : null}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-surface-background rounded-2xl p-6 border border-border">
        <h3 className="text-sm font-bold text-text-primary mb-4">
          Banner Image Settings
        </h3>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Upload Background Image
              </label>
              <div className="flex gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-white border border-border rounded-xl text-sm font-bold text-text-primary hover:bg-surface-background transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </button>
                {selectedFile && (
                  <button
                    onClick={cancelSelection}
                    disabled={isUploading}
                    className="px-4 py-2 bg-white border border-border rounded-xl text-sm text-text-secondary hover:text-error transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {activeBanner && !selectedFile && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || isUploading}
                    className="px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? "Removing..." : "Remove Banner"}
                  </button>
                )}
              </div>
              <p className="text-xs text-text-muted mt-2 font-medium">
                Recommended size: 1920x800px. Max 5MB. JPG, PNG, WEBP.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-end">
            <button
              onClick={handleSave}
              disabled={!selectedFile || isUploading}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${
                selectedFile && !isUploading
                  ? "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md"
                  : "bg-brand-100 text-brand-400 cursor-not-allowed"
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-200 border-t-white rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-text-secondary" />
          <h3 className="text-sm font-bold text-text-primary">Live Preview</h3>
        </div>

        <div className="border-[4px] border-surface-background rounded-[40px] overflow-hidden bg-white shadow-sm p-4 sm:p-6 lg:p-8">
          <div className="relative rounded-[32px] overflow-hidden border border-[#E3D8C8] shadow-sm w-full h-[140px] sm:h-[180px] md:h-[220px] lg:h-[260px]">
            <img
              src={previewImage}
              alt="Shop Banner Preview"
              className="w-full h-full object-cover object-center select-none pointer-events-none"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminShopBanner;
