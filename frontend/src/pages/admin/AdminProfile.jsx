import React, { useState, useEffect, useRef } from "react";
import useConfirmStore from "../../store/confirmStore";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Globe,
  Smartphone,
  LogOut,
  CheckCircle,
  Calendar,
  Shield,
  X,
  Edit2,
  AlertCircle,
} from "lucide-react";
import useUserStore from "../../store/userStore";
import useAuthStore from "../../store/authStore";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PhoneInput from "../../components/ui/PhoneInput";
import AvatarUploader from "../../components/common/AvatarUploader";
import toast from "react-hot-toast";
import {
  validateName,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  isFormValid,
} from "../../utils/validators";

const AdminProfile = () => {
  const { fetchProfile, updateProfile, changePassword, isLoading } =
    useUserStore();
  const { user: profile } = useAuthStore();
  const { logout } = useAuthStore();
  const { confirm } = useConfirmStore();

  const [currentView, setCurrentView] = useState("overview"); //'overview' |'edit' |'security'
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({});
  const [initialData, setInitialData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passErrors, setPassErrors] = useState({});
  const [passError, setPassError] = useState("");

  useEffect(() => {
    fetchProfile(); // silent background refresh
  }, []);

  useEffect(() => {
    if (profile) {
      const data = {
        name: profile.name || "",
        phone: profile.phone || "",
        birthday: profile.birthday
          ? new Date(profile.birthday).toISOString().split("T")[0]
          : "",
        gender: profile.gender || "",
        language: profile.language || "en",
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [profile]);

  const isProfileDirty =
    JSON.stringify(formData) !== JSON.stringify(initialData);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProfileDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isProfileDirty]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));

    let errorMsg = "";
    if (name === "name") errorMsg = validateName(parsedValue, "Name");
    if (name === "phone" && parsedValue) errorMsg = validatePhone(parsedValue);
    setFormErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPassError("");

    let errorMsg = "";
    if (name === "currentPassword" && !value) errorMsg = "Required";
    if (name === "newPassword") errorMsg = validatePassword(value);

    setPassErrors((prev) => {
      const next = { ...prev, [name]: errorMsg };
      if (name === "newPassword" || name === "confirmPassword") {
        const confirmVal =
          name === "confirmPassword" ? value : passwordData.confirmPassword;
        const newPassVal =
          name === "newPassword" ? value : passwordData.newPassword;
        if (confirmVal) {
          next.confirmPassword = validateConfirmPassword(
            newPassVal,
            confirmVal,
          );
        }
      }
      return next;
    });
  };

  const validateProfile = () => {
    const errs = {};
    if (
      !formData.name ||
      formData.name.trim().length < 2 ||
      formData.name.trim().length > 80 ||
      !/^[a-zA-Z\s]+$/.test(formData.name)
    ) {
      errs.name = "Please enter a valid full name.";
    }
    if (formData.phone) {
      const phoneErr = validatePhone(formData.phone);
      if (phoneErr) errs.phone = phoneErr;
    }
    if (formData.birthday) {
      const bday = new Date(formData.birthday);
      const today = new Date();
      const minAgeDate = new Date();
      minAgeDate.setFullYear(today.getFullYear() - 13);
      if (bday > today || bday > minAgeDate) {
        errs.birthday = "Please enter a valid birth date.";
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    if (!isProfileDirty) return;

    setIsSaving(true);
    // Trim strings
    const trimmedData = {
      ...formData,
      name: formData.name.trim(),
    };

    const success = await updateProfile(trimmedData);
    if (success) {
      setInitialData(trimmedData);
      setCurrentView("overview");
      toast.success("Profile updated successfully.");
      await fetchProfile();
    }
    setIsSaving(false);
  };

  const cancelProfileEdit = () => {
    setFormData(initialData);
    setFormErrors({});
    setCurrentView("overview");
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPassError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    const pass = passwordData.newPassword;
    if (pass.length < 8) {
      setPassError("Password must be at least 8 characters.");
      return;
    }

    setIsSaving(true);
    const success = await changePassword(
      passwordData.currentPassword,
      passwordData.newPassword,
    );
    if (success) {
      toast.success("Password changed successfully.");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setCurrentView("overview");
    }
    setIsSaving(false);
  };

  const getMemberSince = () => {
    if (!profile?.createdAt) return "Unknown";
    return new Date(profile.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLastLogin = () => {
    // using updatedAt as a fallback for last login
    if (!profile?.updatedAt) return "Unknown";
    return new Date(profile.updatedAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl text-text-brand-600 flex items-center gap-2 font-bold">
          <Shield className="w-6 h-6" />
          Admin Profile
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT SIDEBAR */}
        <div className="w-full lg:w-1/3 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col items-center">
            <AvatarUploader
              currentAvatarUrl={profile?.avatarUrl}
              name={profile?.name}
              size="lg"
              onUpload={async (file) => {
                const store = useUserStore.getState();
                await store.uploadAvatar(file, true);
                await store.fetchProfile();
              }}
            />

            <h2 className="text-xl font-bold text-text-primary mt-6 text-center">
              {profile.name}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-full">
                Administrator
              </span>
              <span className="text-[10px] uppercase tracking-wider text-success-700 bg-success-50 border border-success-200 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>

            <div className="w-full mt-8 space-y-4 text-sm text-text-secondary border-t border-border pt-6">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-muted font-medium" />{" "}
                  Member Since
                </span>
                <span className="text-text-primary">{getMemberSince()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-text-muted font-medium" /> Last
                  Login
                </span>
                <span className="text-text-primary">{getLastLogin()}</span>
              </div>
            </div>

            <div className="w-full mt-8 space-y-3">
              <Button
                variant={currentView === "edit" ? "primary" : "outline"}
                className="w-full justify-center"
                onClick={async () => {
                  if (currentView === "edit") return;
                  if (isProfileDirty) {
                    const isConfirmed = await confirm({
                      title: "Discard Changes",
                      description:
                        "You have unsaved changes. Are you sure you want to discard them?",
                      variant: "warning",
                      confirmText: "Discard",
                    });
                    if (!isConfirmed) return;
                    cancelProfileEdit();
                  }
                  setCurrentView("edit");
                }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant={currentView === "security" ? "primary" : "outline"}
                className="w-full justify-center"
                onClick={async () => {
                  if (currentView === "security") return;
                  if (isProfileDirty) {
                    const isConfirmed = await confirm({
                      title: "Discard Changes",
                      description:
                        "You have unsaved changes. Are you sure you want to discard them?",
                      variant: "warning",
                      confirmText: "Discard",
                    });
                    if (!isConfirmed) return;
                    cancelProfileEdit();
                  }
                  setCurrentView("security");
                }}
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="w-full lg:w-2/3">
          {/* OVERVIEW MODE */}
          {currentView === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border-light flex justify-between items-center bg-surface-background">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Personal Information
                    </h3>
                    <p className="text-sm text-text-muted mt-1 font-medium">
                      Review your personal details and preferences.
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <dl className="divide-y divide-border-light">
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 flex flex-col gap-1">
                      <dt className="text-sm text-text-secondary">Full Name</dt>
                      <dd className="text-sm text-text-primary sm:col-span-2">
                        {profile.name}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 flex flex-col gap-1">
                      <dt className="text-sm text-text-secondary">
                        Email Address
                      </dt>
                      <dd className="text-sm text-text-primary sm:col-span-2">
                        {profile.email}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 flex flex-col gap-1">
                      <dt className="text-sm text-text-secondary">
                        Phone Number
                      </dt>
                      <dd className="text-sm text-text-primary sm:col-span-2">
                        {profile.phone || "Not provided"}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 flex flex-col gap-1">
                      <dt className="text-sm text-text-secondary">Birthday</dt>
                      <dd className="text-sm text-text-primary sm:col-span-2">
                        {profile.birthday
                          ? new Date(profile.birthday).toLocaleDateString()
                          : "Not provided"}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 flex flex-col gap-1">
                      <dt className="text-sm text-text-secondary">Gender</dt>
                      <dd className="text-sm text-text-primary sm:col-span-2">
                        {profile.gender || "Not provided"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border-light bg-surface-background">
                  <h3 className="text-lg font-bold text-text-primary">
                    System Preferences
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-text-primary">
                        Interface Language
                      </div>
                      <div className="text-sm text-text-muted mt-1 font-medium">
                        {profile.language === "en"
                          ? "English (US)"
                          : profile.language}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EDIT MODE */}
          {currentView === "edit" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border-light flex justify-between items-center bg-surface-background">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Edit Personal Information
                    </h3>
                    <p className="text-sm text-text-muted mt-1 font-medium">
                      Update your profile details below.
                    </p>
                  </div>
                  <button
                    onClick={cancelProfileEdit}
                    className="p-2 text-text-muted hover:bg-border-light rounded-full transition-colors font-medium"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <form onSubmit={submitProfile} className="space-y-6">
                    {isProfileDirty && (
                      <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-xl text-sm border border-amber-200">
                        <AlertCircle className="w-5 h-5" />
                        You have unsaved changes.
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Full Name"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleProfileChange}
                        error={formErrors.name}
                        required
                      />
                      <Input
                        label="Email Address"
                        value={profile.email}
                        disabled
                        readOnly
                        className="bg-surface-background opacity-70 cursor-not-allowed"
                        error="Email cannot be changed."
                      />
                      <div className="sm:col-span-2">
                        <PhoneInput
                          label="Phone Number"
                          name="phone"
                          value={formData.phone || ""}
                          onChange={handleProfileChange}
                          error={formErrors.phone}
                        />
                      </div>
                      <Input
                        label="Birthday"
                        type="date"
                        name="birthday"
                        value={formData.birthday || ""}
                        onChange={handleProfileChange}
                        max={new Date().toISOString().split("T")[0]}
                        error={formErrors.birthday}
                      />

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-sm text-text-primary">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender || ""}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all shadow-sm"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">
                            Prefer not to say
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2 pt-4 border-t border-border-light">
                        <label className="block text-sm text-text-primary">
                          Interface Language
                        </label>
                        <select
                          name="language"
                          value={formData.language || "en"}
                          onChange={handleProfileChange}
                          className="w-full md:w-1/2 px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all shadow-sm"
                        >
                          <option value="en">English (US)</option>
                          <option value="fr">Français</option>
                          <option value="es">Español</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-4">
                      {!isProfileDirty && (
                        <span className="text-sm text-text-muted mr-auto font-medium">
                          No changes to save.
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelProfileEdit}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          !isProfileDirty ||
                          !isFormValid(formErrors, { name: formData.name })
                        }
                        aria-disabled={
                          !isProfileDirty ||
                          !isFormValid(formErrors, { name: formData.name })
                        }
                        isLoading={isSaving}
                        className="w-full sm:w-auto min-w-[140px]"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & PASSWORD MODE */}
          {currentView === "security" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border-light flex justify-between items-center bg-surface-background">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Change Password
                    </h3>
                    <p className="text-sm text-text-muted mt-1 font-medium">
                      Ensure your account is using a secure password.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentView("overview");
                      setPassError("");
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                    className="p-2 text-text-muted hover:bg-border-light rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <form
                    onSubmit={submitPassword}
                    className="space-y-6 max-w-lg"
                  >
                    {passError && (
                      <div className="flex items-start gap-2 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{passError}</span>
                      </div>
                    )}

                    <Input
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      required
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      error={passErrors.currentPassword}
                      aria-invalid={!!passErrors.currentPassword}
                    />

                    <Input
                      label="New Password"
                      name="newPassword"
                      type="password"
                      required
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      error={passErrors.newPassword}
                      aria-invalid={!!passErrors.newPassword}
                    />

                    <Input
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      error={passErrors.confirmPassword}
                      aria-invalid={!!passErrors.confirmPassword}
                    />

                    <div className="pt-6 border-t border-border flex items-center justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCurrentView("overview");
                          setPassError("");
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        isLoading={isSaving}
                        disabled={
                          !isFormValid(passErrors, {
                            currentPassword: passwordData.currentPassword,
                            newPassword: passwordData.newPassword,
                            confirmPassword: passwordData.confirmPassword,
                          })
                        }
                        aria-disabled={
                          !isFormValid(passErrors, {
                            currentPassword: passwordData.currentPassword,
                            newPassword: passwordData.newPassword,
                            confirmPassword: passwordData.confirmPassword,
                          })
                        }
                        className="min-w-[140px]"
                      >
                        Update Password
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
