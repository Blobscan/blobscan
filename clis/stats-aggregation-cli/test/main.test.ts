import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import * as commands from "../src/commands";
import { main, mainUsage } from "../src/main";
import { runHelpArgTests } from "./helpers";

const commandNames = Object.keys(commands).filter(
  (key): key is string =>
    typeof commands[key as keyof typeof commands] === "function"
);

describe("Main", () => {
  beforeAll(() => {
    process.argv = ["node", "cli"];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  runMainTests(["-h"], () => {
    runHelpArgTests(main, mainUsage);
  });

  commandNames.forEach((commandName) => {
    runMainCommandTest(commandName);
  });

  runMainTests(["invalid-command"], () => {
    it("should fail when trying to run an invalid command", async () => {
      expect(main).rejects.toMatchInlineSnapshot(
        "[Error: Invalid command: invalid-command]"
      );
    });
  });

  it("should fail when no command is given", async () => {
    expect(main).rejects.toMatchInlineSnapshot("[Error: No command specified]");
  });
});

function runMainTests(argv: string[], tests: () => void) {
  describe("", () => {
    beforeAll(() => {
      process.argv.push(...argv);
    });

    tests();

    afterAll(() => {
      process.argv.pop();
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runMainCommandTest(commandName: any) {
  describe("", () => {
    beforeAll(() => {
      process.argv.push(commandName);
    });

    it(`should run the "${commandName}" command correctly`, async () => {
      const commandSpy = vi
        .spyOn(commands, commandName)
        .mockImplementation(async () => void {});

      await main();

      expect(commandSpy).toHaveBeenCalledOnce();
    });

    afterAll(() => {
      process.argv.pop();
    });
  });
}
