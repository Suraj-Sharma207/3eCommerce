import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, User, Mail, Lock } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PhoneInput from "../../components/ui/PhoneInput";
import useAuthStore from "../../store/authStore";
import { useBrandingStore } from "../../store/brandingStore";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  isFormValid as checkFormValid,
} from "../../utils/validators";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [socialMessage, setSocialMessage] = useState("");

  const {
    register,
    isLoading,
    error: backendError,
    clearError,
  } = useAuthStore();
  const { branding } = useBrandingStore();

  useEffect(() => {
    clearError();
  }, [clearError]);
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let errorMsg = "";

    switch (name) {
      case "name":
        errorMsg = validateName(value, "Full Name");
        break;
      case "email":
        errorMsg = validateEmail(value);
        break;
      case "phone":
        if (value) {
          errorMsg = validatePhone(value);
        }
        break;
      case "password":
        errorMsg = validatePassword(value);
        break;
      case "confirmPassword":
        errorMsg = validateConfirmPassword(formData.password, value);
        break;
      default:
        break;
    }

    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // We no longer sanitize phone numbers because PhoneInput provides an E.164 string (+123...)
    const parsedValue = name === "email" ? value.toLowerCase() : value;

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));

    // Clear error while typing
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "password") {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));

    if (name === "password" && formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(
          value,
          formData.confirmPassword,
        ),
      }));
    }
  };

  const isPasswordValid =
    formData.password.length > 0 && validatePassword(formData.password) === "";
  const passwordTouched =
    formData.password.length > 0 && errors.password !== undefined; // Use errors object to track if we should show styling

  const confirmTouched =
    formData.confirmPassword.length > 0 && errors.confirmPassword !== undefined;
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    validateConfirmPassword(formData.password, formData.confirmPassword) === "";

  const isFormValid = () => {
    const newErrors = {};

    ["name", "email", "phone", "password", "confirmPassword"].forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (!termsAccepted) {
      newErrors.terms = "Please accept the terms and conditions.";
    }

    setErrors(newErrors);

    return (
      checkFormValid(newErrors, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      }) && termsAccepted
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setSocialMessage("");
    const success = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.phone,
    );
    if (success) {
      navigate("/");
    }
  };

  const handleSocialClick = (e, provider) => {
    e.preventDefault();
    e.stopPropagation();
    setSocialMessage(`${provider} Sign-In coming soon.`);
    setTimeout(() => setSocialMessage(""), 3000);
  };

  // Determine password validation status for compact helper
  const hasMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);

  let passwordBorderClass = "";
  if (errors.password) {
    passwordBorderClass = "!border-danger-500 focus:!ring-danger-200";
  } else if (passwordTouched && isPasswordValid) {
    // Optional: could turn green if valid, but requirement says"Do not turn border red". Default to neutral unless we specifically want green.
  }

  // Determine confirm password styling
  let confirmBorderClass = "";
  let ConfirmHelper = () => <div className="min-h-[6px] mt-[4px]" />; // Spacer

  if (errors.confirmPassword) {
    confirmBorderClass = "!border-danger-500 focus:!ring-danger-200";
    ConfirmHelper = () => (
      <div className="text-xs text-danger-600 mt-[4px] min-h-[16px] flex items-center gap-1.5 transition-colors duration-300">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="">Passwords do not match.</span>
      </div>
    );
  } else if (confirmTouched && passwordsMatch) {
    // Optional: green check
    ConfirmHelper = () => (
      <div className="text-xs text-success-600 mt-[4px] min-h-[16px] flex items-center gap-1.5 transition-colors duration-300">
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="">Passwords match.</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-center">
      <div className="mb-4 stagger-1 text-center shrink-0">
        <h2 className="text-[28px] md:text-[32px] leading-tight font-bold text-text-primary tracking-tight">
          Create Account
        </h2>
        <p className="mt-1 text-[14px] text-text-primary-hover font-medium stagger-2">
          Join {branding?.platformName || "PRIYAL"} | Home Appliances Pvt Ltd.
          to experience premium shopping.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {backendError && (
          <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-[12px] flex items-start gap-2 border border-danger-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{backendError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-3">
          <div className="space-y-1">
            <Input
              label={
                <span className="text-[13px] text-text-primary">Full Name</span>
              }
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your full name"
              error={errors.name}
              leftIcon={<User className="w-4 h-4" />}
              inputClassName="!h-[46px] !rounded-[12px] pl-10 !border-brand-500 focus:!ring-brand-500/20"
              className={
                errors.name
                  ? "border-danger-500 focus:border-danger-500 focus:ring-danger-200"
                  : ""
              }
            />
          </div>

          <div className="space-y-1">
            <PhoneInput
              label={
                <span className="text-[13px] text-text-primary">
                  Phone{" "}
                  <span className="text-text-muted text-[11px]">
                    (Optional)
                  </span>
                </span>
              }
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.phone}
              inputClassName="!h-[46px] !rounded-[12px] !border-brand-500 focus-within:!ring-brand-500/20"
            />
          </div>
        </div>

        <div className="space-y-1 stagger-3">
          <Input
            label={
              <span className="text-[13px] text-text-primary">
                Email Address
              </span>
            }
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="you@example.com"
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            inputClassName="!h-[46px] !rounded-[12px] pl-10 !border-brand-500 focus:!ring-brand-500/20"
            className={
              errors.email
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-200"
                : ""
            }
          />
        </div>

        <div className="relative stagger-3">
          <Input
            label={
              <span className="text-[13px] text-text-primary">Password</span>
            }
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Create a strong password"
            className={passwordBorderClass}
            leftIcon={<Lock className="w-4 h-4" />}
            inputClassName="!h-[46px] !rounded-[12px] pl-10 !border-brand-500 focus:!ring-brand-500/20"
            aria-invalid={!!errors.password}
            error={errors.password}
          />

          {!errors.password && (
            <div className="text-[11px] text-text-secondary mt-1.5 leading-snug">
              <span>
                Password must be at least 8 characters and include an uppercase
                letter, a lowercase letter, a number, and a special character.
              </span>
            </div>
          )}
        </div>

        <div className="relative stagger-3">
          <Input
            label={
              <span className="text-[13px] text-text-primary">
                Confirm Password
              </span>
            }
            type="password"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Confirm your password"
            className={confirmBorderClass}
            leftIcon={<Lock className="w-4 h-4" />}
            inputClassName="!h-[46px] !rounded-[12px] pl-10 !border-brand-500 focus:!ring-brand-500/20"
            aria-invalid={!!errors.confirmPassword}
          />
          <ConfirmHelper />
        </div>

        <div className="flex items-start pt-1 stagger-4">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (e.target.checked)
                  setErrors((prev) => ({ ...prev, terms: "" }));
              }}
              className="h-4 w-4 text-brand-600 focus:ring-brand-600 border-border rounded transition-colors cursor-pointer"
            />
          </div>
          <div className="ml-2 text-[12px] mt-[2px]">
            <label
              htmlFor="terms"
              className={`cursor-pointer ${errors.terms ? "text-danger-600" : "text-text-secondary"}`}
            >
              I agree to the{" "}
              <a
                href="#"
                className="text-brand-600 hover:text-brand-700 transition-colors font-semibold"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-brand-600 hover:text-brand-700 transition-colors font-semibold"
              >
                Privacy Policy.
              </a>
            </label>
            {errors.terms && (
              <p className="mt-0.5 text-danger-600">{errors.terms}</p>
            )}
          </div>
        </div>

        <div className="pt-2 stagger-4">
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={
              !checkFormValid(errors, {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
              }) || !termsAccepted
            }
            aria-disabled={
              !checkFormValid(errors, {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
              }) || !termsAccepted
            }
            className="rounded-[12px] h-[48px] text-[15px] shadow-md bg-[#0F2343] hover:bg-[#1a345c] transition-all"
          >
            Create Account
          </Button>
        </div>
      </form>

      <div className="mt-3.5 text-center stagger-6">
        <p className="text-[14px] text-text-secondary">
          Already have an account?{""}
          <Link
            to="/login"
            className="text-brand-600 hover:text-brand-700 transition-colors font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Non-blocking Toast */}
      {socialMessage && (
        <div className="fixed bottom-6 right-6 bg-secondary-900 text-white px-5 py-3 rounded-xl shadow-2xl text-[14px] z-[100] animate-in fade-in slide-in-from-bottom-8 duration-300">
          {socialMessage}
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
