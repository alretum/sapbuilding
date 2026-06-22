import fs from "node:fs";
import path from "node:path";
import { contentSchema, payloadSchemas, type Content } from "./content-schema";

// Server-only content loader. Reads + validates the JSON in /content once and
// caches it in production. Keep this out of client components (it uses fs);
// client code should fetch from /api/content instead.

let cached: Content | null = null;

function readJson(file: string): unknown {
  const full = path.join(process.cwd(), "content", file);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

export function getContent(): Content {
  if (cached && process.env.NODE_ENV === "production") return cached;

  const roles = readJson("roles.json");
  const actions = readJson("actions.json");
  const content = contentSchema.parse({ roles, actions });

  // Validate each action's payload against its type-specific schema, and check
  // referential integrity so a bad import fails loudly at startup, not mid-game.
  const roleIds = new Set(content.roles.map((r) => r.id));
  for (const action of content.actions) {
    if (!roleIds.has(action.roleId)) {
      throw new Error(`Action "${action.id}" references unknown roleId "${action.roleId}"`);
    }
    const schema = payloadSchemas[action.type];
    const result = schema.safeParse(action.payload);
    if (!result.success) {
      throw new Error(`Action "${action.id}" has an invalid ${action.type} payload: ${result.error.message}`);
    }
  }

  cached = content;
  return content;
}

export function actionsForRole(content: Content, roleId: string) {
  return content.actions.filter((a) => a.roleId === roleId);
}

export function maxPointsForRole(content: Content, roleId: string): number {
  return actionsForRole(content, roleId).reduce((sum, a) => sum + a.points, 0);
}
