/**
 * LuxeHome Regression Test Suite
 * Validates registration, login, logout, password recovery, verification,
 * email queues, and database logs without exposing raw errors.
 */
import prisma from "../lib/prisma.js";
import emailEvents from "./utils/emailEvents.js";
import emailService from "./services/emailService.js";

const API_BASE = "http://localhost:5000/api";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runRegression() {
  console.log("\n============================================================");
  console.log("🧪 RUNNING LUXEHOME SYSTEM REGRESSION & SECURITY AUDIT TESTS");
  console.log("============================================================\n");

  const suiteResults = [];
  const report = (name, passed, info = "") => {
    suiteResults.push({
      Test: name,
      Status: passed ? "✅ PASSED" : "❌ FAILED",
      Details: info,
    });
  };

  const testEmail = `tester-${Date.now()}@example.com`;
  const testPassword = "Password123!";
  const testName = "Alex Tester";
  const testPhone = "+15555555555";

  let jwtToken = null;
  let verificationToken = null;
  let resetPasswordToken = null;
  let createdUserId = null;

  try {
    // 1. Verify DB Connection first
    await prisma.$connect();
    report("0. Database Connectivity", true, "Connected to Neon Postgres.");
  } catch (err) {
    report("0. Database Connectivity", false, err.message);
    console.table(suiteResults);
    process.exit(1);
  }

  // 2. Test Sanitized Backend Error Handling (Prisma error masking)
  try {
    console.log(
      "[TEST] Triggering manual Prisma validation error via duplicate user check or constraint violation...",
    );
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email", // schema validation should catch this
        password: "123",
      }),
    });

    const result = await response.json();
    console.log("[TEST] Invalid Registration Response:", result);

    const parsedMessage = result.message || "";
    const exposesInternals =
      parsedMessage.toLowerCase().includes("prisma") ||
      parsedMessage.toLowerCase().includes("sql") ||
      parsedMessage.toLowerCase().includes("database");

    report(
      "1. Error Masking & Sanitization",
      !exposesInternals,
      "Database/Prisma internals are not leaked in the payload.",
    );
  } catch (err) {
    report("1. Error Masking & Sanitization", false, err.message);
  }

  // 3. Test Registration
  try {
    console.log("[TEST] Performing user registration...");
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        phone: testPhone,
      }),
    });

    const result = await response.json();
    if (result.success) {
      jwtToken = result.data.token;
      createdUserId = result.data.user.id;

      // Check database to verify tokens are stored correctly
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUserId },
      });
      verificationToken = dbUser.verificationToken;

      const hasTokens =
        dbUser.verificationToken !== null &&
        dbUser.verificationExpires !== null &&
        dbUser.isEmailVerified === false;
      report(
        "2. E2E Registration & Token Storage",
        hasTokens,
        `User registered. Verification Token: ${verificationToken ? "Stored" : "Missing"}`,
      );
    } else {
      report(
        "2. E2E Registration & Token Storage",
        false,
        result.message || "Registration failed",
      );
    }
  } catch (err) {
    report("2. E2E Registration & Token Storage", false, err.message);
  }

  // 4. Test Login
  try {
    console.log("[TEST] Performing user login...");
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const result = await response.json();
    const loginOk = result.success && result.data?.token !== undefined;
    report(
      "3. E2E Login",
      loginOk,
      loginOk ? "Login successfully retrieved JWT" : result.message,
    );
  } catch (err) {
    report("3. E2E Login", false, err.message);
  }

  // 5. Test Welcome and Verification Email Queuing
  try {
    console.log(
      "[TEST] Checking if Welcome & Verification emails are queued...",
    );
    await wait(8000); // Give the emitter time to dispatch and queue

    const logs = await prisma.emailLog.findMany({
      where: { userId: createdUserId },
    });

    const hasWelcome = logs.some((l) => l.template === "welcome");
    const hasVerify = logs.some((l) => l.template === "verify-email");

    report(
      "4. Email Queueing & Logs (Welcome/Verify)",
      hasWelcome && hasVerify,
      `Found ${logs.length} queued log(s) for user.`,
    );
  } catch (err) {
    report("4. Email Queueing & Logs (Welcome/Verify)", false, err.message);
  }

  // 6. Test Email Verification
  try {
    console.log("[TEST] Verifying user email...");
    const response = await fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: verificationToken,
      }),
    });

    const result = await response.json();
    const dbUser = await prisma.user.findUnique({
      where: { id: createdUserId },
    });

    const verifiedOk =
      result.success &&
      dbUser.isEmailVerified === true &&
      dbUser.verificationToken === null;
    report(
      "5. Email Verification Flow",
      verifiedOk,
      verifiedOk
        ? "Email successfully marked verified, tokens cleared"
        : result.message,
    );
  } catch (err) {
    report("5. Email Verification Flow", false, err.message);
  }

  // 7. Test Logout (Run before password reset so tokenVersion matches 0)
  try {
    console.log("[TEST] Performing user logout...");
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    const result = await response.json();
    report(
      "6. E2E Logout",
      result.success,
      result.success ? "Logged out successfully" : result.message,
    );
  } catch (err) {
    report("6. E2E Logout", false, err.message);
  }

  // 8. Test Forgot Password
  try {
    console.log("[TEST] Requesting forgot-password link...");
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    const result = await response.json();
    await wait(2000); // Allow event to queue reset email

    const dbUser = await prisma.user.findUnique({
      where: { id: createdUserId },
    });
    resetPasswordToken = dbUser.resetPasswordToken;

    const forgotOk =
      result.success &&
      resetPasswordToken !== null &&
      dbUser.resetPasswordExpires !== null;
    report(
      "7. Forgot Password Request",
      forgotOk,
      forgotOk ? "Reset token generated and stored" : result.message,
    );
  } catch (err) {
    report("7. Forgot Password Request", false, err.message);
  }

  // 9. Test Reset Password (Increments tokenVersion to 1)
  try {
    console.log("[TEST] Performing reset-password...");
    const newPassword = "NewPassword123!";
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: resetPasswordToken,
        password: newPassword,
      }),
    });

    const result = await response.json();
    const dbUser = await prisma.user.findUnique({
      where: { id: createdUserId },
    });

    const resetOk =
      result.success &&
      dbUser.resetPasswordToken === null &&
      dbUser.resetPasswordExpires === null &&
      dbUser.tokenVersion === 1;
    report(
      "8. Reset Password Flow",
      resetOk,
      resetOk
        ? "Password successfully reset & tokenVersion incremented"
        : result.message,
    );
  } catch (err) {
    report("8. Reset Password Flow", false, err.message);
  }

  // 10. Test Order Confirmation Email Dispatch
  try {
    console.log(
      "[TEST] Mocking order.created event to verify order confirmation dispatch...",
    );

    const mockOrder = {
      id: `order-test-${Date.now()}`,
      orderNumber: `LH-REG-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: createdUserId,
      totalAmount: 15338.82,
      subtotal: 12999.0,
      discountAmount: 0.0,
      taxAmount: 2339.82,
      shippingCharge: 0.0,
      paymentMethod: "UPI",
      createdAt: new Date(),
      user: {
        id: createdUserId,
        email: testEmail,
        name: testName,
      },
      items: [
        {
          price: 12999.0,
          quantity: 1,
          product: {
            name: "Arc Floor Lamp",
            sku: "FURN-DEC-1002",
            thumbnail: "",
          },
        },
      ],
      shippingAddress: {
        recipientName: testName,
        street: "456 Lane",
        city: "Delhi",
        state: "Delhi",
        zipCode: "110001",
        country: "India",
        phoneNumber: testPhone,
      },
    };

    // Emit event
    emailEvents.emit("order.created", mockOrder);
    await wait(8000); // Wait for async worker queue loop and SMTP verification

    // Retrieve order confirmation log
    const orderLog = await prisma.emailLog.findFirst({
      where: {
        userId: createdUserId,
        template: "order-confirmation",
      },
    });

    report(
      "9. Order Confirmation Queueing",
      orderLog !== null,
      orderLog
        ? `Log created. Status: ${orderLog.status}`
        : "No order confirmation log found",
    );
  } catch (err) {
    report("9. Order Confirmation Queueing", false, err.message);
  }

  // Clean up test data
  console.log("[CLEANUP] Cleaning database records...");
  try {
    if (createdUserId) {
      await prisma.emailLog.deleteMany({ where: { userId: createdUserId } });
      await prisma.user.delete({ where: { id: createdUserId } });
      console.log("Cleanup completed successfully.");
    }
  } catch (err) {
    console.error("Cleanup failed:", err.message);
  }

  console.log("\n============================================================");
  console.log("📊 REGRESSION TEST RUN SUMMARY");
  console.log("=====================================================\n");
  console.table(suiteResults);
  console.log(
    "=============================================================\n",
  );

  // Verify all tests passed
  const allPassed = suiteResults.every((r) => r.Status.includes("PASSED"));
  if (allPassed) {
    console.log(
      "🎉 ALL REGRESSION TESTS PASSED SUCCESSFULLY! NO REGRESSIONS INTRODUCED.",
    );
    process.exit(0);
  } else {
    console.error("❌ SOME REGRESSION TESTS FAILED.");
    process.exit(1);
  }
}

runRegression();
