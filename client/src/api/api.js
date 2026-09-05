// The base address of your backend. Defined once here so if it ever changes
// (like when you deploy), you update it in ONE place.
const BASE_URL = "http://localhost:5000/api";

// One reusable function for every API call in the app.
// endpoint = the path after /api (e.g. "/users/login")
// options  = optional settings (method, body, etc.)
export const apiRequest = async (endpoint, options = {}) => {
  // Pull the saved token (the "wristband") from browser storage, if we have one
  const token = localStorage.getItem("token");

  // Build the headers every request needs
  const headers = {
    "Content-Type": "application/json", // tells the server we're sending JSON
    ...options.headers,                 // fold in any extra headers passed in
  };

  // If we have a token, attach it as the Authorization header (the bouncer reads this)
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make the actual request. Spread in any options (method, body), plus our headers.
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Parse the JSON body (step 2 of fetch)
  const data = await response.json();

  // If the server responded with an error status (4xx/5xx), throw so callers can catch it
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};