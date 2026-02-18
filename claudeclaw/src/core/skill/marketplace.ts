import { execSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { join } from "node:path";
import { logger } from "../../utils/logger.js";

const SKILL_PREFIX = "claudeclaw-skill-";

export interface SearchResult {
  name: string;
  version: string;
  description: string;
}

export async function searchSkills(query: string): Promise<SearchResult[]> {
  const searchTerm = `${SKILL_PREFIX}${query}`;
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(searchTerm)}&size=20`;
  const response = await fetch(url);
  const data = (await response.json()) as {
    objects?: Array<{
      package: { name: string; version: string; description?: string };
    }>;
  };
  return (data.objects || []).map((obj) => ({
    name: obj.package.name,
    version: obj.package.version,
    description: obj.package.description || "",
  }));
}

export function installSkill(name: string, dataDir: string): void {
  const fullName = name.startsWith(SKILL_PREFIX) ? name : `${SKILL_PREFIX}${name}`;
  const skillDir = join(dataDir, "skills");
  if (!existsSync(skillDir)) mkdirSync(skillDir, { recursive: true });

  execSync(`npm install ${fullName} --prefix "${skillDir}"`, {
    stdio: "inherit",
    timeout: 60_000,
  });

  updateConfigSkills(dataDir, (skills) => {
    if (!skills.some((s: Record<string, unknown>) => s.package === fullName)) {
      skills.push({ type: "npm", package: fullName, enabled: true });
    }
    return skills;
  });
  logger.info(`Installed skill: ${fullName}`);
}

export function removeSkill(name: string, dataDir: string): void {
  const fullName = name.startsWith(SKILL_PREFIX) ? name : `${SKILL_PREFIX}${name}`;
  const skillDir = join(dataDir, "skills");

  if (existsSync(skillDir)) {
    execSync(`npm uninstall ${fullName} --prefix "${skillDir}"`, {
      stdio: "inherit",
      timeout: 60_000,
    });
  }

  updateConfigSkills(dataDir, (skills) =>
    skills.filter((s: Record<string, unknown>) => s.package !== fullName),
  );
  logger.info(`Removed skill: ${fullName}`);
}

export function scaffoldSkill(name: string): void {
  const dir = name.startsWith(SKILL_PREFIX) ? name : `${SKILL_PREFIX}${name}`;
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: dir,
        version: "0.1.0",
        type: "module",
        main: "index.js",
        description: `ClaudeClaw skill: ${name}`,
        keywords: ["claudeclaw-skill"],
      },
      null,
      2,
    ),
  );

  writeFileSync(
    join(dir, "index.ts"),
    `import { defineSkill } from "claudeclaw";

export default defineSkill(
  {
    name: "${name}",
    version: "0.1.0",
    description: "TODO: describe your skill",
    permissions: [],
  },
  [
    // Add your tools here
  ],
);
`,
  );

  logger.info(`Scaffolded skill at ./${dir}/`);
}

function updateConfigSkills(
  dataDir: string,
  updater: (skills: Record<string, unknown>[]) => Record<string, unknown>[],
): void {
  const configPath = join(dataDir, "config.json");
  const config = existsSync(configPath)
    ? JSON.parse(readFileSync(configPath, "utf-8"))
    : {};
  config.skills = updater(config.skills || []);
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Export for testing
export { updateConfigSkills as _updateConfigSkills };
