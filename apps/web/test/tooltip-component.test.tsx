// @vitest-environment happy-dom
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../src/components/Tooltip";

const container = document.createElement("div");
document.body.appendChild(container);
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});

it("keeps the tooltip mounted during exit and cancels exit on focus", async () => {
  act(() => {
    root.render(
      <Tooltip>
        <TooltipTrigger>Blob gas used</TooltipTrigger>
        <TooltipContent heading="Blob gas used">
          Total gas in this block.
        </TooltipContent>
      </Tooltip>
    );
  });
  const trigger = container.querySelector("button")!;
  await act(async () => trigger.focus());
  const tooltip = document.querySelector('[role="tooltip"]')!;
  expect(tooltip.textContent).toContain("Total gas in this block.");
  expect(tooltip.querySelector("svg")).not.toBeNull();
  expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);

  await act(async () => trigger.blur());
  await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
  expect(tooltip.isConnected).toBe(true);
  expect(tooltip.getAttribute("aria-hidden")).toBe("true");

  await act(async () => trigger.focus());
  await act(async () => new Promise((resolve) => setTimeout(resolve, 160)));
  expect(tooltip.isConnected).toBe(true);
  expect(tooltip.getAttribute("aria-hidden")).toBeNull();

  await act(async () => {
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
  });
  expect(tooltip.getAttribute("aria-hidden")).toBe("true");
  await act(async () => new Promise((resolve) => setTimeout(resolve, 160)));
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
});
