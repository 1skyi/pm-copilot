const { execSync } = require("child_process");
const path = require("path");

const nextPath = path.resolve(__dirname, "node_modules", "next", "dist", "bin", "next");
process.argv = ["node", nextPath, "build"];
require(nextPath);
