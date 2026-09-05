import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../api/api";

// 1. Create the Context — the "channel" that will carry auth info app-wide
const AuthContext = createContext();

// 2. The Provider — wraps the app and supplies the auth state to everything inside
export const AuthProvider = ({ children }) => {
  // Holds the logged-in user (null when nobody's logged in)
  const [user, setUser] = useState(null);
  // Tracks whether we're still checking storage on first load
  const [loading, setLoading] = useState(true);

  // On first load, check if a user + token were already saved (stay logged in across refreshes)
  useEffect(() => {
    // Define a function that does the startup check
    const loadUser = () => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
        setUser(JSON.parse(savedUser)); // turn the stored string back into an object
        }
        setLoading(false); // done checking
    };

    loadUser();
    }, []); // empty array = run once, on mount

  // LOGIN: call the API, save the token + user, update state
  const login = async (email, password) => {
    const data = await apiRequest("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // data has { _id, name, email, token }
    localStorage.setItem("token", data.token); // save the wristband
    localStorage.setItem("user", JSON.stringify(data)); // save the user info
    setUser(data); // update app state → everyone knows we're logged in
    return data;
  };

  // LOGOUT: clear everything
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Everything we want available app-wide goes in "value"
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. A small helper hook so components can grab auth easily: const { user, login } = useAuth()
export const useAuth = () => useContext(AuthContext);