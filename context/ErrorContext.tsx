"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export type ErrorSeverity = "info" | "warning" | "error" | "success";

interface ErrorMessage {
  message: string;
  severity: ErrorSeverity;
  id: number;
}

interface ErrorContextType {
  errors: ErrorMessage[];
  setError: (errorMessage: string, severity?: ErrorSeverity) => void;
  setSuccess: (message: string) => void;
  setWarning: (message: string) => void;
  setInfo: (message: string) => void;
  clearError: (id: number) => void;
  clearAllErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorMessage[]>([]);
  const nextIdRef = useRef(1);
  const timeoutMapRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const clearError = useCallback((id: number) => {
    const timeout = timeoutMapRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutMapRef.current.delete(id);
    }
    setErrors((prev) => prev.filter((error) => error.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    timeoutMapRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutMapRef.current.clear();
    setErrors([]);
  }, []);

  const addError = useCallback(
    (message: string, severity: ErrorSeverity = "error") => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;

      const newError = { message, severity, id };
      setErrors((prev) => [...prev, newError]);

      // Auto-clear error after 5 seconds
      const timeout = setTimeout(() => {
        clearError(id);
      }, 5000);
      timeoutMapRef.current.set(id, timeout);

      return id;
    },
    [clearError],
  );

  const setError = useCallback(
    (message: string, severity: ErrorSeverity = "error") => {
      return addError(message, severity);
    },
    [addError],
  );

  const setSuccess = useCallback(
    (message: string) => {
      return addError(message, "success");
    },
    [addError],
  );

  const setWarning = useCallback(
    (message: string) => {
      return addError(message, "warning");
    },
    [addError],
  );

  const setInfo = useCallback(
    (message: string) => {
      return addError(message, "info");
    },
    [addError],
  );

  useEffect(() => {
    return () => {
      timeoutMapRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutMapRef.current.clear();
    };
  }, []);

  return (
    <ErrorContext.Provider
      value={{
        errors,
        setError,
        setSuccess,
        setWarning,
        setInfo,
        clearError,
        clearAllErrors,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};
