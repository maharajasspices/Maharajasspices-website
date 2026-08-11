import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { CartProvider } from "./contexts/CartContext";
import { CartDrawerProvider } from "./contexts/CartDrawerContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Defer non-critical initialization to idle time
const initDeferredTasks = () => {
  const runWhenIdle = (cb: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(cb, { timeout: 3000 });
    } else {
      setTimeout(cb, 100);
    }
  };

  runWhenIdle(async () => {
    const { initInteractionTracking } = await import("./utils/passwordValidator");
    initInteractionTracking();
  });
};

// Start deferred tasks after initial render
setTimeout(initDeferredTasks, 100);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <CartDrawerProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </CartDrawerProvider>
  </ErrorBoundary>
);

