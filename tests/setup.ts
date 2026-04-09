import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { unlinkSync, existsSync } from "fs";
import path from "path";

afterEach(() => {
  cleanup();
});

const TEST_DB_PATH = path.join(process.cwd(), ".data", "test-events.db");

afterEach(() => {
  try {
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
  } catch {
    // ignore
  }
});
