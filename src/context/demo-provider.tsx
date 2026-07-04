"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
} from "react";
import {
  createInitialDemoState,
  demoReducer,
  type DemoAction,
  type DemoState,
} from "@/context/demo-store";

const DemoContext = createContext<{
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
} | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, undefined, createInitialDemoState);
  return (
    <DemoContext.Provider value={{ state, dispatch }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}

export function useSubmission(id: string) {
  const { state, dispatch } = useDemo();
  const submission = state.submissions.find((s) => s.id === id);
  return { submission, dispatch, auditLog: state.auditLog.filter((e) => e.submissionId === id || e.submissionId === "all") };
}
