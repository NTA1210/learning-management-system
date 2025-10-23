import { AppRoutes } from "./routes";
import { ThemeProvider } from "./context/ThemeContextProvider";
import { ThemeToggle } from "./components";

function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
      <ThemeToggle />
    </ThemeProvider>
  );
}

export default App;
