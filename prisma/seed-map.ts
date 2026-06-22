import { prisma } from "../src/lib/prisma";
import { getContent } from "../src/lib/content";
import { generateCode } from "../src/lib/code";
import { defaultAvatar } from "../src/lib/avatar-config";
import { CITIES } from "../src/lib/germany";

// Seeds realistic demo companies across Germany so the readiness map looks alive
// in demos. Idempotent: clears previously-seeded demo companies first.
// Run with: npm run db:seed:map

const HUBS = new Set(["Berlin", "Hamburg", "München", "Köln", "Frankfurt am Main", "Stuttgart"]);
const SUFFIXES = ["Systems", "Logistik", "Technik", "Handel", "Industrie", "Solutions", "Werke", "Digital"];
const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T>(arr: T[]): T => arr[rand(arr.length)];

async function main() {
  const content = getContent();
  const actionsByRole = new Map(content.roles.map((r) => [r.id, content.actions.filter((a) => a.roleId === r.id)]));

  const removed = await prisma.session.deleteMany({ where: { isDemo: true } });
  console.log(`Cleared ${removed.count} existing demo companies.`);

  let companies = 0;
  let players = 0;

  for (const city of CITIES) {
    const count = rand(5) + (HUBS.has(city.name) ? 3 : 0); // hubs clear the k=3 privacy threshold
    for (let i = 0; i < count; i++) {
      const code = generateCode();
      const session = await prisma.session.create({
        data: {
          code,
          name: `${city.name} ${pick(SUFFIXES)} GmbH`,
          involvedRoles: content.roles.map((r) => r.id),
          status: "active",
          startedAt: new Date(),
          isDemo: true,
          leaderboardPublic: true, // demo companies are public so the map/leaderboard stay populated
          regionCode: city.regionCode,
          city: city.name,
          lat: city.lat,
          lng: city.lng,
        },
      });
      companies++;

      const numPlayers = rand(6) + 2;
      for (let p = 0; p < numPlayers; p++) {
        const role = pick(content.roles);
        const roleActions = actionsByRole.get(role.id) ?? [];
        const player = await prisma.player.create({
          data: {
            sessionId: session.id,
            name: `Player ${p + 1}`,
            roleId: role.id,
            avatar: JSON.stringify(defaultAvatar()),
          },
        });
        players++;

        // Complete a random fraction of this player's actions (varies readiness).
        const doCount = rand(roleActions.length + 1);
        const completions = roleActions.slice(0, doCount).map((a) => ({
          sessionId: session.id,
          playerId: player.id,
          actionId: a.id,
          roleId: role.id,
          score: a.points,
        }));
        if (completions.length) await prisma.actionCompletion.createMany({ data: completions });
      }
    }
  }

  console.log(`Seeded ${companies} demo companies with ${players} players across Germany.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
