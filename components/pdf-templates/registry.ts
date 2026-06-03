import type { TemplateComponent } from "./types";

const registry: Record<string, () => Promise<{ default: TemplateComponent }>> = {
  swiss: () => import("./templates/template-swiss"),
  darkgold: () => import("./templates/template-darkgold"),
  brutalist: () => import("./templates/template-brutalist"),
  twocol: () => import("./templates/template-3-twocol"),
};

export async function resolveTemplate(id: string): Promise<TemplateComponent> {
  const loader = registry[id] ?? registry["swiss"]!;
  const mod = await loader();
  return mod.default;
}

export function getTemplateIds(): string[] {
  return Object.keys(registry);
}
