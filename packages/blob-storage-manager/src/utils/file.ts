import fs from "fs";

export function performFullPermissionOp(operation: () => void) {
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

export function createFullPermissionBinFile(filePath: string, data: Buffer) {
  performFullPermissionOp(() => {
    fs.writeFileSync(filePath, data, { mode: 0o777 });
  });
}
