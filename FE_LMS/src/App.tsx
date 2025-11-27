import { AppRoutes } from "./routes";
import { ThemeProvider } from "./context/ThemeContextProvider";
import { AuthProvider } from "./context/AuthContext";
import { ThemeToggle } from "./components";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppRoutes />
        {/* <ThemeToggle /> */}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
