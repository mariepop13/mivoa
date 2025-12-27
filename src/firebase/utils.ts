interface ErrorWithCode extends Error {
  code?: string;
}

function hasErrorCode(error: unknown): error is ErrorWithCode {
  return error !== null && typeof error === 'object' && 'code' in error;
}

export function isAppOfflineError(error: unknown): boolean {
  if (!error) return false;
  
  const errorCode = hasErrorCode(error) ? error.code : undefined;
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return errorCode === 'installations/app-offline' || errorMessage.includes('app-offline');
}

