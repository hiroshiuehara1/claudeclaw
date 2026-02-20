import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../../utils/logger.js";

export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
}

const BUILTIN_TEMPLATES: PromptTemplate[] = [
  {
    name: "code-review",
    description: "Review code for issues and improvements",
    template: "Review the following code for bugs, security issues, and improvements:\n\n{{input}}",
  },
  {
    name: "explain",
    description: "Explain a concept or code clearly",
    template: "Explain the following clearly and concisely, as if to a senior developer:\n\n{{input}}",
  },
  {
    name: "refactor",
    description: "Suggest refactoring improvements",
    template: "Suggest refactoring improvements for the following code. Focus on readability, maintainability, and performance:\n\n{{input}}",
  },
  {
    name: "test",
    description: "Generate test cases",
    template: "Generate comprehensive test cases for the following code. Include edge cases and error scenarios:\n\n{{input}}",
  },
  {
    name: "summarize",
    description: "Summarize text or conversation",
    template: "Summarize the following concisely, highlighting key points:\n\n{{input}}",
  },
];

export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor(dataDir?: string) {
    // Load builtins
    for (const t of BUILTIN_TEMPLATES) {
      this.templates.set(t.name, t);
    }

    // Load custom templates from data dir
    if (dataDir) {
      this.loadCustomTemplates(dataDir);
    }
  }

  list(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  get(name: string): PromptTemplate | undefined {
    return this.templates.get(name);
  }

  apply(name: string, input: string): string | null {
    const template = this.templates.get(name);
    if (!template) return null;
    return template.template.replace(/\{\{input\}\}/g, input);
  }

  add(template: PromptTemplate): void {
    this.templates.set(template.name, template);
  }

  save(dataDir: string): void {
    const customTemplates = Array.from(this.templates.values()).filter(
      (t) => !BUILTIN_TEMPLATES.some((b) => b.name === t.name),
    );
    const dir = join(dataDir, "templates");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const filePath = join(dir, "custom.json");
    writeFileSync(filePath, JSON.stringify(customTemplates, null, 2), "utf-8");
  }

  private loadCustomTemplates(dataDir: string): void {
    const filePath = join(dataDir, "templates", "custom.json");
    if (!existsSync(filePath)) return;
    try {
      const data = JSON.parse(readFileSync(filePath, "utf-8"));
      if (Array.isArray(data)) {
        for (const t of data) {
          if (t.name && t.template) {
            this.templates.set(t.name, t);
          }
        }
      }
    } catch (err) {
      logger.warn(`Failed to load custom templates: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
