import * as fs from "fs";
import * as path from "path";
import { splitSymbols } from "./src/parser/symbolSplitter";

const filePath = path.join(__dirname, "../kicad-symbols/Device.kicad_symdir/R.kicad_sym");
const content = fs.readFileSync(filePath, "utf-8");

console.log("File content:", content);
console.log("Split results:", splitSymbols(content));
