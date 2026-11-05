export const getFrontendUrl = () => {
  if (process.env.PUBLIC_APP_URL) {
    return process.env.PUBLIC_APP_URL;
  }

  if (process.env.FRONTEND_URL) {
    // If it's a comma separated list (e.g., for CORS), pick the LAN URL or the last one
    const urls = process.env.FRONTEND_URL.split(",").map((u) => u.trim());
    return urls[urls.length - 1]; // Return the LAN URL (usually the last one added)
  }

  return "http://localhost:5173";
};
