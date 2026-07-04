import { describe, expect, it } from "vitest";
import {
  currenciesEqual,
  normalizeCurrency,
  normalizePercentage,
  normalizeTime,
  percentagesEqual,
  timesEqual,
} from "@/lib/normalize";

describe("normalizeCurrency", () => {
  it("parses dollar formats", () => {
    expect(normalizeCurrency("$5 million")).toBe(5000000);
    expect(normalizeCurrency("$5,000,000")).toBe(5000000);
    expect(normalizeCurrency("5.0m")).toBe(5000000);
  });

  it("returns null for invalid input", () => {
    expect(normalizeCurrency("not a number")).toBeNull();
  });
});

describe("normalizePercentage", () => {
  it("normalizes percent strings", () => {
    expect(normalizePercentage("38%")).toBe(38);
    expect(normalizePercentage("0.38")).toBe(38);
    expect(normalizePercentage("thirty-eight percent")).toBe(38);
  });
});

describe("normalizeTime", () => {
  it("treats midnight equivalents as equal", () => {
    expect(timesEqual("midnight", "12:00 a.m.")).toBe(true);
    expect(normalizeTime("2:00 a.m.")).toBe(120);
  });
});

describe("value equality", () => {
  it("compares currency values", () => {
    expect(currenciesEqual("$5 million", "$5,000,000")).toBe(true);
  });

  it("compares percentage values", () => {
    expect(percentagesEqual("38%", "0.38")).toBe(true);
  });
});
