// Utilitaire de logging simple avec timestamps et niveaux
// Les logs passent par stdout/stderr pour visibilité (build logs Vercel) et console navigateur

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function formatMessage(level: LogLevel, scope: string, message: string, data?: unknown): string {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]` + (scope ? ` [${scope}]` : '');
  try {
    const serialized = data === undefined ? '' : ` | data=${JSON.stringify(data)}`;
    return `${prefix} ${message}${serialized}`;
  } catch {
    return `${prefix} ${message}`;
  }
}

export const logger = {
  // Log de debug détaillé
  debug(scope: string, message: string, data?: unknown) {
    // Log pour debug côté client/serveur
    // eslint-disable-next-line no-console
    console.debug(formatMessage('debug', scope, message, data));
  },
  // Log d'information standard
  info(scope: string, message: string, data?: unknown) {
    // eslint-disable-next-line no-console
    console.info(formatMessage('info', scope, message, data));
  },
  // Log d'avertissement
  warn(scope: string, message: string, data?: unknown) {
    // eslint-disable-next-line no-console
    console.warn(formatMessage('warn', scope, message, data));
  },
  // Log d'erreur
  error(scope: string, message: string, data?: unknown) {
    // eslint-disable-next-line no-console
    console.error(formatMessage('error', scope, message, data));
  },
};


