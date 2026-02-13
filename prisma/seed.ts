import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashWithSalt(value: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(value + usedSalt).digest('hex');
  return { hash, salt: usedSalt };
}

async function main() {
  console.log('Seeding database...');

  // --- Users ---
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@magic-farm.test' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@magic-farm.test',
      name: 'Admin Mago',
      firstName: 'Admin',
      lastName: 'Mago',
      alias: 'admin_mago',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'player@magic-farm.test' },
    update: {},
    create: {
      email: 'player@magic-farm.test',
      name: 'Giocatore Uno',
      firstName: 'Giocatore',
      lastName: 'Uno',
      alias: 'giocatore_uno',
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  // Consents for both users (privacy + terms accepted, platform consent required)
  for (const user of [adminUser, normalUser]) {
    const existingConsent = await prisma.consent.findFirst({
      where: { userId: user.id, privacyAcceptedAt: { not: null } },
    });
    if (!existingConsent) {
      await prisma.consent.create({
        data: {
          userId: user.id,
          privacyAcceptedAt: new Date(),
          privacyVersion: '2.0',
          termsAcceptedAt: new Date(),
          termsVersion: '2.0',
          consentPlatform: true,                // required to play
          consentControllerMarketing: false,     // optional, default off
          consentShareWithHost: false,           // optional, default off
          consentHostMarketing: false,           // optional, default off
        },
      });
    }
  }

  console.log(`Created users: ${adminUser.email} (ADMIN), ${normalUser.email} (USER)`);

  // --- Organization ---
  const org = await prisma.organization.upsert({
    where: { slug: 'vecchia-fattoria' },
    update: {},
    create: {
      name: 'Vecchia Fattoria',
      slug: 'vecchia-fattoria',
    },
  });
  console.log(`Organization: ${org.name} (slug: ${org.slug})`);

  // --- EventNight ---
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  let event = await prisma.eventNight.findFirst({
    where: { joinCode: 'MAGIC1' },
  });

  if (!event) {
    event = await prisma.eventNight.create({
      data: {
        name: 'La Notte dei Misteri',
        description: 'Una serata avvolta nel mistero. Risolvi gli enigmi per svelare il segreto della Magic Farm.',
        startsAt: now,
        endsAt: twoHoursFromNow,
        status: 'LIVE',
        joinCode: 'MAGIC1',
        theme: 'Mistero e Illusione',
        hostName: 'Lorenzo Mameli',
        venueName: 'Vecchia Fattoria',
        organizationId: org.id,
        openingNarrative: 'Benvenuti alla Notte dei Misteri. Stasera, ogni tavolo dovrà dimostrare il proprio valore...',
      },
    });
  }

  console.log(`Created event: ${event.name} (joinCode: MAGIC1)`);

  // --- Tables (3 tables with known join codes) ---
  const tableConfigs = [
    { name: 'Tavolo degli Illusionisti', code: 'TBL001' },
    { name: 'Tavolo dei Mentalisti', code: 'TBL002' },
    { name: 'Tavolo degli Escapisti', code: 'TBL003' },
  ];

  const tables = [];
  for (const tc of tableConfigs) {
    const existing = await prisma.table.findFirst({
      where: { eventNightId: event.id, name: tc.name },
    });
    if (existing) {
      tables.push(existing);
      continue;
    }
    const { hash, salt } = hashWithSalt(tc.code);
    const table = await prisma.table.create({
      data: {
        eventNightId: event.id,
        name: tc.name,
        joinCodeHash: hash,
        joinCodeSalt: salt,
      },
    });
    tables.push(table);
  }

  console.log(`Created ${tables.length} tables`);

  // --- Rounds (2 rounds) ---
  let round1 = await prisma.round.findFirst({
    where: { eventNightId: event.id, title: 'Round 1 — Enigmi Classici' },
  });
  if (!round1) {
    round1 = await prisma.round.create({
      data: {
        eventNightId: event.id,
        title: 'Round 1 — Enigmi Classici',
        description: 'Riscaldamento con enigmi classici di logica e osservazione.',
        type: 'SINGLE_TABLE',
        status: 'ACTIVE',
      },
    });
  }

  let round2 = await prisma.round.findFirst({
    where: { eventNightId: event.id, title: 'Round 2 — Sfida Avanzata' },
  });
  if (!round2) {
    round2 = await prisma.round.create({
      data: {
        eventNightId: event.id,
        title: 'Round 2 — Sfida Avanzata',
        description: 'Enigmi più complessi che richiedono collaborazione.',
        type: 'SINGLE_TABLE',
        status: 'PENDING',
      },
    });
  }

  // Set current round to round1
  await prisma.eventNight.update({
    where: { id: event.id },
    data: { currentRoundId: round1.id },
  });

  console.log(`Created rounds: ${round1.title}, ${round2.title}`);

  // --- Puzzles (4 total: 2 per round, multiple PuzzleTypes) ---
  const puzzleDefs = [
    {
      roundId: round1.id,
      title: 'Il Numero Magico',
      prompt: 'Sono un numero. Se mi capovolgi, divento 6 in più. Cosa sono?',
      answer: '9',
      order: 0,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Pensa a un numero a una cifra.', penalty: 5, order: 0 },
        { text: 'Capovolto, divento un altro numero.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round1.id,
      title: 'La Stanza Chiusa',
      prompt: 'Un uomo entra in una stanza con un fiammifero. C\'è una candela, una lampada a olio e un camino. Cosa accende per prima?',
      answer: 'il fiammifero',
      order: 1,
      puzzleType: 'OBSERVATION' as const,
      hints: [
        { text: 'Non è nessuno dei tre oggetti elencati.', penalty: 5, order: 0 },
        { text: 'Cosa deve usare per accendere tutto il resto?', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round2.id,
      title: 'Il Codice del Mago',
      prompt: 'Se ABRACADABRA = 1, MAGIC = 2, allora FARM = ?',
      answer: '3',
      order: 0,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Conta qualcosa di specifico in ogni parola.', penalty: 5, order: 0 },
        { text: 'Quante vocali "A" ci sono in ogni parola?', penalty: 15, order: 1 },
      ],
    },
    {
      roundId: round2.id,
      title: 'Lo Specchio',
      prompt: 'Guardo avanti e vedo il futuro. Guardo indietro e vedo il passato. Cosa sono?',
      answer: 'uno specchio',
      order: 1,
      puzzleType: 'HYBRID' as const,
      hints: [
        { text: 'Non è un oggetto tecnologico.', penalty: 5, order: 0 },
        { text: 'Riflette la realtà, non il tempo.', penalty: 10, order: 1 },
      ],
    },
  ];

  const createdPuzzles = [];
  for (const pd of puzzleDefs) {
    const existing = await prisma.puzzle.findFirst({
      where: { roundId: pd.roundId, title: pd.title },
    });
    if (existing) {
      createdPuzzles.push(existing);
      continue;
    }

    const { hash: ansHash, salt: ansSalt } = hashWithSalt(pd.answer.toLowerCase().trim());
    const puzzle = await prisma.puzzle.create({
      data: {
        roundId: pd.roundId,
        title: pd.title,
        prompt: pd.prompt,
        answerHash: ansHash,
        answerSalt: ansSalt,
        order: pd.order,
        puzzleType: pd.puzzleType,
        scoringJson: { basePoints: 100, timeBonusEnabled: true, hintPenalty: 10 },
      },
    });
    createdPuzzles.push(puzzle);

    for (const h of pd.hints) {
      await prisma.hint.create({
        data: {
          puzzleId: puzzle.id,
          text: h.text,
          penaltyPoints: h.penalty,
          order: h.order,
        },
      });
    }
  }

  console.log(`Created ${puzzleDefs.length} puzzles with hints`);

  // --- Pre-filled submission + leaderboard entry for testing ---
  // Admin joins table 1 and solves the first puzzle
  const adminMembership = await prisma.tableMembership.findFirst({
    where: { userId: adminUser.id, tableId: tables[0].id, leftAt: null },
  });
  if (!adminMembership) {
    await prisma.tableMembership.create({
      data: { tableId: tables[0].id, userId: adminUser.id },
    });
  }

  const firstPuzzle = createdPuzzles[0];
  const existingSub = await prisma.submission.findFirst({
    where: { userId: adminUser.id, puzzleId: firstPuzzle.id, isCorrect: true },
  });
  if (!existingSub) {
    await prisma.submission.create({
      data: {
        puzzleId: firstPuzzle.id,
        userId: adminUser.id,
        tableId: tables[0].id,
        isCorrect: true,
        attemptsCount: 1,
        hintsUsed: 0,
        pointsAwarded: 120,
        timeToSolveMs: BigInt(45000),
      },
    });
    // Leaderboard entry
    await prisma.leaderboardEntry.upsert({
      where: { userId: adminUser.id },
      create: { userId: adminUser.id, points: 120, riddles: 1, events: 1 },
      update: { points: 120, riddles: 1 },
    });
    console.log('Created pre-filled submission (admin solved puzzle 1 with 120 pts)');
  }

  // --- Library entries ---
  const existingLibrary = await prisma.libraryEntry.count();
  if (existingLibrary === 0) {
    await prisma.libraryEntry.createMany({
      data: [
        {
          title: 'La Storia della Magia',
          description: 'Un viaggio nella storia dell\'illusionismo, dai tempi antichi ai giorni nostri.',
          category: 'Storia',
          content: 'L\'illusionismo ha origini antichissime...',
          entryType: 'HISTORY',
          order: 0,
        },
        {
          title: 'Come Funzionano gli Enigmi',
          description: 'Una guida per principianti su come approcciare gli enigmi logici.',
          category: 'Guide',
          content: 'Gli enigmi logici si basano su pattern di pensiero laterale...',
          entryType: 'ARTICLE',
          order: 1,
        },
      ],
    });
  }

  console.log('Seed completed successfully!');
  console.log('---');
  console.log('Admin login: admin@magic-farm.test');
  console.log('Player login: player@magic-farm.test');
  console.log('Event join code: MAGIC1');
  console.log('Table join codes: TBL001, TBL002, TBL003');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
