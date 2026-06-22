import { prisma } from "../src/lib/prisma";
import { getContent } from "../src/lib/content";

// Creates a fixed demo session with code "DEMO" so you can try the flow without
// hosting one first. Safe to run repeatedly.
async function main() {
  const content = getContent();
  const existing = await prisma.session.findUnique({ where: { code: "DEMO" } });
  if (existing) {
    console.log('Demo session already exists — join code "DEMO".');
    return;
  }
  await prisma.session.create({
    data: {
      code: "DEMO",
      name: "Demo Challenge",
      involvedRoles: content.roles.map((r) => r.id),
      status: "active",
      startedAt: new Date(),
    },
  });
  console.log('Created demo session — join code "DEMO".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
