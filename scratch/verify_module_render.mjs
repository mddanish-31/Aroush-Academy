/**
 * Verify StudyMaterialsModule HTML rendering in React Server
 */
import React from "react";
import ReactDOMServer from "react-dom/server";
import { StudyMaterialsModule } from "../src/components/dashboard/StudyMaterialsModule.tsx";

const html = ReactDOMServer.renderToString(
  React.createElement(StudyMaterialsModule, { role: "student" })
);

console.log("Rendered HTML length:", html.length);
console.log("Contains Download .txt ↓:", html.includes("Download .txt ↓"));
console.log("Contains Downloadable .txt:", html.includes("Downloadable .txt"));
console.log("Contains Catalog Preview:", html.includes("Catalog Preview"));
console.log("Contains Preview Info ℹ:", html.includes("Preview Info ℹ"));
console.log("Contains Coordinate Geometry:", html.includes("Coordinate Geometry"));

if (
  html.includes("Download .txt ↓") &&
  html.includes("Downloadable .txt") &&
  html.includes("Catalog Preview") &&
  html.includes("Preview Info ℹ")
) {
  console.log("\n✓ ALL COMPONENT RENDER CHECKS PASSED!");
} else {
  process.exit(1);
}
