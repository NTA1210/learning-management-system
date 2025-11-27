import { AppRoutes } from "./routes";
import { ThemeProvider } from "./context/ThemeContextProvider";
import { AuthProvider } from "./context/AuthContext";
import { ThemeToggle } from "./components";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppRoutes />

        <ThemeToggle />
        <Toaster
          position="top-right"
          containerStyle={{
            top: "80px", // Add padding from top to avoid navbar
          }}
          toastOptions={{
            duration: 5000,
            style: {
              background: "#363636",
              color: "#fff",
              marginTop: "16px", // Additional top margin
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#4ade80",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
