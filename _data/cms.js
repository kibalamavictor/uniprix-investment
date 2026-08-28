import fs from "fs";
import path from "path";

export default function () {
  const cmsDir = path.join(process.cwd(), "data", "cms");
  const cms = {};

  if (!fs.existsSync(cmsDir)) return cms;

  for (const file of fs.readdirSync(cmsDir)) {
    if (!file.endsWith(".json")) continue;
    const key = file.replace(/\.json$/, "");
    cms[key] = JSON.parse(fs.readFileSync(path.join(cmsDir, file), "utf8"));
  }

  return cms;
};
