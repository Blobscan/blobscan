
import * as wasm from "./majin_blob_wasm_bg.wasm";
import { __wbg_set_wasm } from "./majin_blob_wasm_bg.js";
__wbg_set_wasm(wasm);
export * from "./majin_blob_wasm_bg.js";
