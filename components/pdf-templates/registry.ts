import type { TemplateComponent } from "./types";

const registry: Record<string, () => Promise<{ default: TemplateComponent }>> = {
  tech: () => import("./templates/template-a-tech"),
  professional: () => import("./templates/template-b-professional"),
  creative: () => import("./templates/template-c-creative"),
};

export async function resolveTemplate(id: string): Promise<TemplateComponent> {
  const loader = registry[id] ?? registry["tech"]!;
  const mod = await loader();
  return mod.default;
}

export function getTemplateIds(): string[] {
  return Object.keys(registry);
}
