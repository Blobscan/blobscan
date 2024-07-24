import fs from "fs";

function performFullPermissionOp(operation: () => void) {
  const oldUmask = process.umask(0);

  try {
    operation();
  } finally {
    process.umask(oldUmask);
  }
}
export function createFullPermissionDirectory(dirPath: string) {
  performFullPermissionOp(() => {
    fs.mkdirSync(dirPath, { recursive: true, mode: 0o777 });
  });
}

export function createFullPermissionFile(filePath: string, data: string) {
  performFullPermissionOp(() => {
    fs.writeFileSync(filePath, data, { encoding: "utf-8", mode: 0o777 });
  });
}
