import prisma from "../lib/prisma.ts";

function parsePreserveList() {
  const arg = process.argv.find((value) => value.startsWith("--preserve="));
  const fromArg = arg ? arg.split("=")[1] : "";
  const fromEnv = process.env.PRESERVE_USERS || "";
  const raw = fromArg || fromEnv;
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function getPreservedUserIds(preserveList) {
  if (preserveList.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: preserveList } },
        { name: { in: preserveList } },
      ],
    },
    select: { id: true, email: true, name: true },
  });

  return users.map((user) => user.id);
}

async function resetData() {
  if (process.env.CONFIRM_RESET !== "true") {
    console.error("Refusing to run. Set CONFIRM_RESET=true to proceed.");
    process.exit(1);
  }

  const preserveList = parsePreserveList();
  const preservedUserIds = await getPreservedUserIds(preserveList);

  console.log("Preserving users:", preserveList.length ? preserveList.join(", ") : "(none)");

  await prisma.levelSheet.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.campaignInvite.deleteMany({});
  await prisma.campaignMember.deleteMany({});
  await prisma.character.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.system.deleteMany({});
  await prisma.friend.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.verificationToken.deleteMany({});

  if (preservedUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: { notIn: preservedUserIds },
      },
    });
  } else {
    await prisma.user.deleteMany({});
  }

  console.log("Reset complete.");
}

resetData()
  .catch((error) => {
    console.error("Reset failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
