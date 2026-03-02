import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from '@/lib/logger';

// Log for debugging deployment issue: startup and global error handlers
logger.info('main', 'App bootstrapping');

// Gestion erreurs globales client
window.addEventListener('error', (event) => {
  logger.error('main', 'Global window error', { message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno, error: String(event.error) });
});
window.addEventListener('unhandledrejection', (event) => {
  logger.error('main', 'Unhandled promise rejection', { reason: String(event.reason) });
});

const rootEl = document.getElementById("root");
if (!rootEl) {
  logger.error('main', 'Root element not found in index.html');
  throw new Error('Root element not found');
}
logger.info('main', 'Rendering App');
createRoot(rootEl).render(<App />);
