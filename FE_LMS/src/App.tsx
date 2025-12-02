import { AppRoutes } from "./routes";
import { ThemeProvider } from "./context/ThemeContextProvider";
import { AuthProvider } from "./context/AuthContext";
import { ThemeToggle } from "./components";
import { Toaster } from "react-hot-toast";
import { VideoCallProvider } from "./context/VideoCallProvider";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <VideoCallProvider>
          <AppRoutes />

          {/* <ThemeToggle /> */}
          <Toaster
            position="top-right"
            containerStyle={{
              top: "80px",
            }}
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '600',
              },
              success: {
                duration: 4000,
                style: {
                  background: '#dcfce7',
                  color: '#065f46',
                  border: '1px solid #86efac',
                },
                iconTheme: {
                  primary: '#059669',
                  secondary: '#ffffff',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fca5a5',
                },
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </VideoCallProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
