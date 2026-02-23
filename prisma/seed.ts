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

  let round3 = await prisma.round.findFirst({
    where: { eventNightId: event.id, title: 'Round 3 — Rebus e Parole' },
  });
  if (!round3) {
    round3 = await prisma.round.create({
      data: {
        eventNightId: event.id,
        title: 'Round 3 — Rebus e Parole',
        description: 'Rebus, giochi di parole e indovinelli per ogni tavolo.',
        type: 'SINGLE_TABLE',
        status: 'PENDING',
      },
    });
  }

  let round4 = await prisma.round.findFirst({
    where: { eventNightId: event.id, title: 'Round 4 — Quiz e Logica' },
  });
  if (!round4) {
    round4 = await prisma.round.create({
      data: {
        eventNightId: event.id,
        title: 'Round 4 — Quiz e Logica',
        description: 'Quiz rapidi e sequenze logiche a difficolta crescente.',
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
    {
      roundId: round3.id,
      title: 'Indovinello: il buco',
      prompt: 'Piu mi togli, piu divento grande. Cosa sono?',
      answer: 'buco',
      order: 0,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Non e un oggetto solido.', penalty: 5, order: 0 },
        { text: 'Nasce quando scavi.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round3.id,
      title: 'Indovinello: la tastiera',
      prompt: 'Ho chiavi ma non ho porte, ho spazio ma non stanze. Cosa sono?',
      answer: 'tastiera',
      order: 1,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'E usata tutti i giorni.', penalty: 5, order: 0 },
        { text: 'Serve per scrivere.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round3.id,
      title: 'Cambia una lettera',
      prompt: "Cambia una lettera di 'pane' per ottenere un animale.",
      answer: 'cane',
      order: 2,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'E un animale domestico.', penalty: 5, order: 0 },
        { text: 'Sostituisci la prima lettera.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round3.id,
      title: 'Rebus lampo',
      prompt: 'RE + BUS = ?',
      answer: 'rebus',
      order: 3,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'E un gioco di parole.', penalty: 5, order: 0 },
        { text: 'Unisci le due parole.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round3.id,
      title: 'Anagramma',
      prompt: "Riordina le lettere di 'ROMA' per ottenere un sentimento.",
      answer: 'amor',
      order: 4,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'E una parola latina.', penalty: 5, order: 0 },
        { text: 'E il contrario di odio.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round4.id,
      title: 'Sequenza 1',
      prompt: '2, 3, 5, 8, 13, ?',
      answer: '21',
      order: 0,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Somma dei due numeri precedenti.', penalty: 5, order: 0 },
        { text: 'Sequenza di Fibonacci.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round4.id,
      title: 'Sequenza 2',
      prompt: '2, 4, 8, 16, ?',
      answer: '32',
      order: 1,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Raddoppia ogni volta.', penalty: 5, order: 0 },
        { text: 'Moltiplica per 2.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round4.id,
      title: 'Quiz lampo: pianeta rosso',
      prompt: 'Quale pianeta e noto come Pianeta Rosso?',
      answer: 'marte',
      order: 2,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Quarto pianeta del sistema solare.', penalty: 5, order: 0 },
        { text: 'Ha due piccole lune.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round4.id,
      title: 'Quiz lampo: mare',
      prompt: 'Quale mare si trova tra Italia e Croazia?',
      answer: 'adriatico',
      order: 3,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Bagna la costa di Venezia.', penalty: 5, order: 0 },
        { text: 'Inizia con la lettera A.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: round4.id,
      title: 'Logica: il treno elettrico',
      prompt: 'Un treno elettrico va verso nord. Da che parte va il fumo?',
      answer: 'nessun fumo',
      order: 4,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'E un treno elettrico.', penalty: 5, order: 0 },
        { text: 'Non brucia combustibile.', penalty: 10, order: 1 },
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
        // Magicians, Mentalists, and Illusionists
        {
          title: 'Harry Houdini',
          description: 'Il leggendario maestro dell\'escapologia, famoso per le sue fughe impossibili e le sue sfide alla morte.',
          category: 'Maghi e Illusionisti',
          content: 'Harry Houdini (1874-1926) è considerato il più grande escapologo di tutti i tempi. Nato Erik Weisz a Budapest, divenne famoso per le sue spettacolari fughe da catene, manette, celle di prigione e contenitori sigillati. Le sue performance includevano la famosa "Water Torture Cell" e le fughe pubbliche da camicie di forza mentre era appeso a testa in giù. Oltre alle sue abilità di escapologia, Houdini era anche un fervente smascheratore di medium e spiritisti fraudolenti.',
          externalUrl: 'https://it.wikipedia.org/wiki/Harry_Houdini',
          entryType: 'CURIOSITY',
          order: 2,
        },
        {
          title: 'David Blaine',
          description: 'Mago e performer americano noto per i suoi incredibili numeri di resistenza fisica e le sue illusioni da strada.',
          category: 'Maghi e Illusionisti',
          content: 'David Blaine (1973-) ha rivoluzionato la magia moderna portando l\'illusionismo nelle strade di New York e creando spettacoli televisivi che combinano magia close-up e imprese di resistenza fisica estreme. È famoso per numeri come essere sepolto vivo per una settimana, restare in apnea per oltre 17 minuti, e vivere in una scatola di vetro sospesa per 44 giorni. Il suo stile minimale e le reazioni genuine del pubblico hanno ridefinito il modo in cui la magia viene presentata al pubblico contemporaneo.',
          externalUrl: 'https://it.wikipedia.org/wiki/David_Blaine',
          entryType: 'CURIOSITY',
          order: 3,
        },
        {
          title: 'Juan Tamariz',
          description: 'Maestro spagnolo della cartomagia, considerato uno dei più grandi dell\'illusionismo e teorico della magia.',
          category: 'Maghi e Illusionisti',
          content: 'Juan Tamariz (1942-) è considerato uno dei più grandi maestri della cartomagia e un profondo teorico dell\'arte magica. Matematico di formazione, ha sviluppato tecniche innovative e ha scritto libri fondamentali come "The Five Points in Magic" e "The Magic Way". Il suo approccio alla magia enfatizza l\'importanza della misdirection psicologica e della presentazione teatrale. Tamariz è noto per la sua personalità carismatica, il suo umorismo e la sua capacità di creare momenti di puro stupore con un semplice mazzo di carte.',
          externalUrl: 'https://en.wikipedia.org/wiki/Juan_Tamariz',
          entryType: 'CURIOSITY',
          order: 4,
        },
        {
          title: 'Dani DaOrtiz',
          description: 'Innovativo cartomago spagnolo, noto per il suo stile unico e le sue tecniche rivoluzionarie di misdirection.',
          category: 'Maghi e Illusionisti',
          content: 'Dani DaOrtiz (1980-) è un cartomago spagnolo contemporaneo che ha portato l\'arte della cartomagia a nuovi livelli con il suo approccio unico basato su "tecniche non tecniche". Allievo di Juan Tamariz, DaOrtiz ha sviluppato un sistema di magia che si basa più sulla psicologia e sulla misdirection che sulla tecnica pura. È famoso per i suoi effetti impossibili con le carte che sembrano violare le leggi della fisica, e per il suo stile frenetico e coinvolgente. Ha pubblicato numerosi DVD e libri che hanno influenzato una nuova generazione di maghi.',
          externalUrl: 'https://en.wikipedia.org/wiki/Dani_DaOrtiz',
          entryType: 'CURIOSITY',
          order: 5,
        },
        {
          title: 'Derren Brown',
          description: 'Mentalista e illusionista britannico, maestro nell\'arte della suggestione psicologica e della lettura del comportamento.',
          category: 'Maghi e Illusionisti',
          content: 'Derren Brown (1971-) è un mentalista britannico che ha ridefinito il concetto di mentalismo moderno. A differenza dei mentalisti tradizionali che affermano di possedere poteri psichici, Brown è aperto nel dichiarare che usa una combinazione di ipnosi, suggestione, psicologia, misdirection e showmanship. I suoi spettacoli televisivi e teatrali hanno esplorato temi come il controllo mentale, la manipolazione sociale e i limiti della percezione umana. È noto per performance audaci come predire i numeri della lotteria, manipolare decisioni apparentemente libere e dimostrare come le tecniche psicologiche possano influenzare il comportamento.',
          externalUrl: 'https://it.wikipedia.org/wiki/Derren_Brown',
          entryType: 'CURIOSITY',
          order: 6,
        },
        {
          title: 'Shin Lim',
          description: 'Cartomago canadese-americano, vincitore di America\'s Got Talent, noto per le sue routine silenziose e poetiche.',
          category: 'Maghi e Illusionisti',
          content: 'Shin Lim (1991-) è un cartomago canadese-americano che ha conquistato il mondo con le sue routine di sleight of hand eseguite in silenzio, accompagnate solo dalla musica. Le sue performance sono caratterizzate da movimenti fluidi, coreografie precise e effetti visualmente stupefacenti con carte da gioco. Ha vinto America\'s Got Talent nel 2018 e America\'s Got Talent: The Champions nel 2019. Il suo stile elegante e artistico ha portato la cartomagia a un nuovo livello di apprezzamento mainstream, dimostrando che la magia può essere una forma d\'arte raffinata e poetica.',
          externalUrl: 'https://it.wikipedia.org/wiki/Shin_Lim',
          entryType: 'CURIOSITY',
          order: 7,
        },
        {
          title: 'Penn & Teller',
          description: 'Duo di maghi americani famosi per il loro approccio unico che combina illusionismo, commedia e demistificazione.',
          category: 'Maghi e Illusionisti',
          content: 'Penn & Teller sono un duo di maghi americani attivi dal 1975. Penn Jillette (il parlante) e Teller (il silenzioso) sono noti per il loro approccio iconoclasta alla magia: spesso rivelano come vengono eseguiti i loro trick per poi stupire comunque il pubblico. Il loro show a Las Vegas è uno dei più longevi nella storia della Strip. Sono anche produttori della serie televisiva "Fool Us", dove maghi da tutto il mondo tentano di ingannarli con i loro effetti. Il loro approccio combina scetticismo scientifico, satira sociale e virtuosismo tecnico.',
          externalUrl: 'https://it.wikipedia.org/wiki/Penn_%26_Teller',
          entryType: 'CURIOSITY',
          order: 8,
        },
        {
          title: 'Dai Vernon',
          description: 'Il "Professore" della magia, considerato il più influente mago del XX secolo e maestro della sleight of hand.',
          category: 'Maghi e Illusionisti',
          content: 'Dai Vernon (1894-1992), soprannominato "Il Professore", è considerato uno dei maghi più influenti del XX secolo. La sua ricerca ossessiva della perfezione tecnica e la sua filosofia sulla misdirection naturale hanno influenzato generazioni di maghi. Vernon era famoso per il suo "Cups and Balls" e per aver ingannato persino Houdini con il suo "Ambitious Card". Ha trascorso gli ultimi anni della sua vita al Magic Castle di Hollywood, dove ha fatto da mentore a numerosi maghi che sono diventati leggende. I suoi insegnamenti sulla naturalezza dei movimenti e sulla psicologia della misdirection sono ancora alla base della magia moderna.',
          externalUrl: 'https://en.wikipedia.org/wiki/Dai_Vernon',
          entryType: 'CURIOSITY',
          order: 9,
        },
        // Storici
        {
          title: 'Jean-Eugene Robert-Houdin',
          description: 'Pioniere storico della magia moderna, trasformo la magia in uno spettacolo teatrale elegante.',
          category: 'Maghi e Illusionisti',
          content: 'Jean-Eugene Robert-Houdin (1805-1871) e considerato il padre della magia moderna. Portò la magia dai mercati ai teatri, introducendo costumi eleganti e una messa in scena raffinata. Le sue automazioni meccaniche e le sue illusioni hanno ispirato generazioni di prestigiatori.',
          externalUrl: 'https://it.wikipedia.org/wiki/Jean-Eug%C3%A8ne_Robert-Houdin',
          entryType: 'CURIOSITY',
          order: 10,
        },
        {
          title: 'Chung Ling Soo',
          description: 'Illusionista storico dei primi del Novecento, celebre per le grandi illusioni da palcoscenico.',
          category: 'Maghi e Illusionisti',
          content: 'Chung Ling Soo era il nome d\'arte dell\'illusionista William Robinson (1861-1918). Divenne famoso in Europa con grandi illusioni sceniche e un personaggio esotico, mantenendo sempre il mistero sul suo metodo. La sua carriera ha segnato l\'epoca d\'oro della magia da teatro.',
          externalUrl: 'https://en.wikipedia.org/wiki/Chung_Ling_Soo',
          entryType: 'CURIOSITY',
          order: 11,
        },
        {
          title: 'Howard Thurston',
          description: 'Showman storico che porto la grande magia americana nei teatri del mondo.',
          category: 'Maghi e Illusionisti',
          content: 'Howard Thurston (1869-1936) fu uno dei piu grandi illusionisti del primo Novecento. I suoi spettacoli combinavano grandi illusioni, levitazioni e numeri di prestigio su larga scala, contribuendo alla diffusione della magia teatrale moderna.',
          externalUrl: 'https://en.wikipedia.org/wiki/Howard_Thurston',
          entryType: 'CURIOSITY',
          order: 12,
        },
        // Classici
        {
          title: 'Cardini',
          description: 'Classico della manipolazione, maestro di carte, sigarette e guanti in scena.',
          category: 'Maghi e Illusionisti',
          content: 'Cardini (1894-1973) fu un maestro della manipolazione da palcoscenico. Le sue routine con carte, sigarette e guanti sono considerate un punto di riferimento per precisione e stile elegante.',
          externalUrl: 'https://en.wikipedia.org/wiki/Cardini',
          entryType: 'CURIOSITY',
          order: 13,
        },
        {
          title: 'Harry Blackstone Sr.',
          description: 'Illusionista classico americano, noto per numeri spettacolari e produzione di oggetti.',
          category: 'Maghi e Illusionisti',
          content: 'Harry Blackstone Sr. (1885-1965) e stato un celebre illusionista da palco negli Stati Uniti. Il suo show era ricco di grandi illusioni, apparizioni e gag visive che hanno definito lo stile classico della magia da teatro.',
          externalUrl: 'https://en.wikipedia.org/wiki/Harry_Blackstone_Sr.',
          entryType: 'CURIOSITY',
          order: 14,
        },
        {
          title: 'Lance Burton',
          description: 'Mago classico moderno, vincitore di FISM, famoso per la sua eleganza scenica.',
          category: 'Maghi e Illusionisti',
          content: 'Lance Burton (1960-) ha unito tecnica impeccabile e presenza scenica teatrale. Ha vinto il Grand Prix FISM nel 1982 e ha portato uno stile classico e raffinato nelle grandi produzioni di Las Vegas.',
          externalUrl: 'https://en.wikipedia.org/wiki/Lance_Burton',
          entryType: 'CURIOSITY',
          order: 15,
        },
        // Italiani
        {
          title: 'Silvan',
          description: 'Icona italiana della magia televisiva, noto per le sue grandi illusioni.',
          category: 'Maghi e Illusionisti',
          content: 'Silvan (Aldo Savoldello, 1937-) e uno dei maghi italiani piu celebri. Ha portato la magia nelle case degli italiani con show televisivi e spettacoli teatrali, diventando un simbolo della prestidigitazione italiana.',
          externalUrl: 'https://it.wikipedia.org/wiki/Silvan',
          entryType: 'CURIOSITY',
          order: 16,
        },
        {
          title: 'Arturo Brachetti',
          description: 'Maestro italiano del quick-change, celebre per i cambi d\'abito fulminei.',
          category: 'Maghi e Illusionisti',
          content: 'Arturo Brachetti (1957-) e il piu celebre trasformista italiano. I suoi spettacoli uniscono magia visiva, teatro e cambi d\'abito rapidissimi, con una forte componente di narrazione scenica.',
          externalUrl: 'https://it.wikipedia.org/wiki/Arturo_Brachetti',
          entryType: 'CURIOSITY',
          order: 17,
        },
        {
          title: 'Tony Binarelli',
          description: 'Mentalista e prestigiatore italiano, noto per lo stile comico e televisivo.',
          category: 'Maghi e Illusionisti',
          content: 'Tony Binarelli (1939-2022) ha unito mentalismo e comicita in uno stile personale. È stato volto noto della TV italiana e ha contribuito a diffondere la cultura della magia e del mentalismo in Italia.',
          externalUrl: 'https://it.wikipedia.org/wiki/Tony_Binarelli',
          entryType: 'CURIOSITY',
          order: 18,
        },
      ],
    });
  }

  // --- Harry Potter Event ---
  let hpEvent = await prisma.eventNight.findFirst({
    where: { joinCode: 'HP2024' },
  });

  if (!hpEvent) {
    hpEvent = await prisma.eventNight.create({
      data: {
        name: 'La Notte di Hogwarts',
        description: 'Una serata magica dedicata al mondo di Harry Potter. Dimostra la tua conoscenza del mondo dei maghi!',
        startsAt: now,
        endsAt: twoHoursFromNow,
        status: 'LIVE',
        joinCode: 'HP2024',
        theme: 'Harry Potter',
        hostName: 'Lorenzo Mameli',
        venueName: 'Vecchia Fattoria',
        organizationId: org.id,
        openingNarrative: 'Benvenuti alla Notte di Hogwarts. Stasera i quattro casati si sfideranno per conquistare la Coppa delle Case. Che abbiate la furbizia di Serpeverde, il coraggio di Grifondoro, la saggezza di Corvonero o la lealtà di Tassorosso, dimostrate il vostro valore!',
      },
    });
  }

  console.log(`Created HP event: ${hpEvent.name} (joinCode: HP2024)`);

  // HP Tables — 4 casati
  const hpTableConfigs = [
    { name: 'Grifondoro', code: 'GRIF01' },
    { name: 'Serpeverde', code: 'SERP01' },
    { name: 'Corvonero', code: 'CORV01' },
    { name: 'Tassorosso', code: 'TASS01' },
  ];

  const hpTables = [];
  for (const tc of hpTableConfigs) {
    const existing = await prisma.table.findFirst({
      where: { eventNightId: hpEvent.id, name: tc.name },
    });
    if (existing) {
      hpTables.push(existing);
      continue;
    }
    const { hash, salt } = hashWithSalt(tc.code);
    const table = await prisma.table.create({
      data: {
        eventNightId: hpEvent.id,
        name: tc.name,
        joinCodeHash: hash,
        joinCodeSalt: salt,
      },
    });
    hpTables.push(table);
  }
  console.log(`Created ${hpTables.length} HP tables`);

  // HP Rounds
  let hpRound1 = await prisma.round.findFirst({
    where: { eventNightId: hpEvent.id, title: 'Round 1 — I Personaggi' },
  });
  if (!hpRound1) {
    hpRound1 = await prisma.round.create({
      data: {
        eventNightId: hpEvent.id,
        title: 'Round 1 — I Personaggi',
        description: 'Quanto conosci i protagonisti del mondo di Harry Potter?',
        type: 'SINGLE_TABLE',
        status: 'ACTIVE',
      },
    });
  }

  let hpRound2 = await prisma.round.findFirst({
    where: { eventNightId: hpEvent.id, title: 'Round 2 — Hogwarts e il Mondo Magico' },
  });
  if (!hpRound2) {
    hpRound2 = await prisma.round.create({
      data: {
        eventNightId: hpEvent.id,
        title: 'Round 2 — Hogwarts e il Mondo Magico',
        description: 'Incantesimi, pozioni, creature magiche e luoghi segreti.',
        type: 'SINGLE_TABLE',
        status: 'PENDING',
      },
    });
  }

  let hpRound3 = await prisma.round.findFirst({
    where: { eventNightId: hpEvent.id, title: 'Round 3 — Indovinelli del Mago' },
  });
  if (!hpRound3) {
    hpRound3 = await prisma.round.create({
      data: {
        eventNightId: hpEvent.id,
        title: 'Round 3 — Indovinelli del Mago',
        description: 'Enigmi e rebus ispirati al mondo magico.',
        type: 'SINGLE_TABLE',
        status: 'PENDING',
      },
    });
  }

  // Set current round
  await prisma.eventNight.update({
    where: { id: hpEvent.id },
    data: { currentRoundId: hpRound1.id },
  });

  // HP Puzzles
  const hpPuzzleDefs = [
    // Round 1 — Personaggi
    {
      roundId: hpRound1.id,
      title: 'Il Prescelto',
      prompt: 'Come si chiama il personaggio principale della saga di Harry Potter? (cognome)',
      answer: 'potter',
      order: 0,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'È un ragazzo che scopre di essere un mago.', penalty: 5, order: 0 },
        { text: 'I suoi genitori si chiamavano James e Lily.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound1.id,
      title: 'Il Migliore Amico',
      prompt: 'Come si chiama il migliore amico di Harry Potter, dai capelli rossi e della famiglia Weasley?',
      answer: 'ron',
      order: 1,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Ha sei fratelli.', penalty: 5, order: 0 },
        { text: 'Il suo nome è Ronald, ma tutti lo chiamano con il diminutivo.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound1.id,
      title: "L'Amica Brillante",
      prompt: 'Chi è la studentessa più brava di Hogwarts, con i capelli ricci e sempre il primo della classe?',
      answer: 'hermione',
      order: 2,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Il suo cognome è Granger.', penalty: 5, order: 0 },
        { text: 'È nata da genitori non magici (babbani).', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound1.id,
      title: 'Il Nemico di Hogwarts',
      prompt: 'Qual è il cognome del nemico giurato di Harry Potter a Hogwarts, figlio di Lucio?',
      answer: 'malfoy',
      order: 3,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'È di Serpeverde e ha i capelli biondi.', penalty: 5, order: 0 },
        { text: 'Il suo nome di battesimo è Draco.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound1.id,
      title: 'Il Grande Mago Oscuro',
      prompt: "Come si chiama il Grande Mago Oscuro, il nemico di Harry Potter, \"colui che non deve essere nominato\"?",
      answer: 'voldemort',
      order: 4,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Il suo vero nome è Tom Riddle.', penalty: 5, order: 0 },
        { text: 'Molti lo chiamano "il Signore Oscuro" o "Tu-sai-chi".', penalty: 10, order: 1 },
      ],
    },
    // Round 2 — Hogwarts e il Mondo Magico
    {
      roundId: hpRound2.id,
      title: 'Lo Sport dei Maghi',
      prompt: 'Come si chiama lo sport magico che si gioca su scope volanti?',
      answer: 'quidditch',
      order: 0,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Si gioca in aria su scope volanti.', penalty: 5, order: 0 },
        { text: 'Si cerca di catturare un piccolo pallino d\'oro alato.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound2.id,
      title: "L'Incantesimo della Luce",
      prompt: 'Quale incantesimo crea un fascio di luce dalla bacchetta, usato come torcia?',
      answer: 'lumos',
      order: 1,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'È una parola latina che significa luce.', penalty: 5, order: 0 },
        { text: 'Si disattiva con "Nox".', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound2.id,
      title: 'La Piattaforma Segreta',
      prompt: 'Da quale binario della stazione di Londra parte il Hogwarts Express?',
      answer: '9 e tre quarti',
      order: 2,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'È un numero tra il 9 e il 10.', penalty: 5, order: 0 },
        { text: 'Per accedervi bisogna attraversare un muro.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound2.id,
      title: 'Il Guardiano della Porta',
      prompt: 'Come si chiama il gigante guardiano di Hogwarts, grande amico di Harry, cane di nome Fang?',
      answer: 'hagrid',
      order: 3,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'È il custode delle chiavi e dei luoghi magici di Hogwarts.', penalty: 5, order: 0 },
        { text: 'Il suo nome completo è Rubeus Hagrid.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound2.id,
      title: 'La Pozione dell\'Amore',
      prompt: "Come si chiama la pozione che fa innamorare perdutamente chiunque la beva?",
      answer: 'amortentia',
      order: 4,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'È la pozione d\'amore più potente al mondo.', penalty: 5, order: 0 },
        { text: 'Ogni persona percepisce l\'odore di chi la attrae.', penalty: 10, order: 1 },
      ],
    },
    // Round 3 — Indovinelli del Mago
    {
      roundId: hpRound3.id,
      title: 'Indovinello: il segreto',
      prompt: 'Sono invisibile agli occhi, ma ti proteggo dai pericoli. A Hogwarts mi portano addosso. Cosa sono? (Hint: Harry lo riceve nel primo anno)',
      answer: 'mantello dell\'invisibilita',
      order: 0,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'È uno dei Doni della Morte.', penalty: 5, order: 0 },
        { text: 'Chi lo indossa non può essere visto.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound3.id,
      title: 'Indovinello: il magazzino dei sogni',
      prompt: "Mostro il desiderio più profondo di chi mi guarda, ma non mostro la verità. Sono uno specchio. Come mi chiamo?",
      answer: 'specchio delle brame',
      order: 1,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'Il mio nome in latino significa: "Non vedo quello che ho, ma quello che desidero".', penalty: 5, order: 0 },
        { text: 'Dumbledore avverte Harry di non fidarsi di ciò che mostro.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound3.id,
      title: 'Il Casato del Coraggio',
      prompt: 'Quale casato di Hogwarts è simboleggiato dal leone ed è noto per il coraggio?',
      answer: 'grifondoro',
      order: 2,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'I colori sono rosso e oro.', penalty: 5, order: 0 },
        { text: 'Harry, Ron ed Hermione appartengono a questo casato.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound3.id,
      title: 'Il Numero Magico di HP',
      prompt: 'Quanti anni ha Harry Potter quando riceve la lettera di Hogwarts?',
      answer: '11',
      order: 3,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'È un numero tra 10 e 12.', penalty: 5, order: 0 },
        { text: 'Nel primo libro festeggia il compleanno il 31 luglio.', penalty: 10, order: 1 },
      ],
    },
    {
      roundId: hpRound3.id,
      title: 'L\'Animale Magico di Hogwarts',
      prompt: 'Come si chiama il rospo di Neville Paciock che perde sempre?',
      answer: 'trevor',
      order: 4,
      puzzleType: 'DIGITAL' as const,
      hints: [
        { text: 'È un anfibio di colore verde.', penalty: 5, order: 0 },
        { text: 'Neville lo cerca disperatamente sul treno per Hogwarts.', penalty: 10, order: 1 },
      ],
    },
  ];

  const createdHpPuzzles = [];
  for (const pd of hpPuzzleDefs) {
    const existing = await prisma.puzzle.findFirst({
      where: { roundId: pd.roundId, title: pd.title },
    });
    if (existing) {
      createdHpPuzzles.push(existing);
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
    createdHpPuzzles.push(puzzle);
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
  console.log(`Created ${hpPuzzleDefs.length} HP puzzles`);

  // Moduli abilitati per la serata HP2024 — 3 raccomandati + 3 originali
  const hpEnabledKeys = new Set([
    'MAGICIANS_CHOICE_4',      // Equivoque digitale — controllo totale
    'CLOCK_FORCE',             // Forzatura ciclica — perfetta multiplayer
    'SEALED_ENVELOPE_DIGITAL', // Busta sigillata — impatto massimo
    'CARD_PREDICTION_BINARY',  // Originale
    'EQUIVOQUE_GUIDED',        // Originale
    'MATHEMATICAL_FORCE_27',   // Forzatura matematica — zero rischio
  ]);

  const allMagicModulesForHp = await prisma.magicModule.findMany();
  for (const mm of allMagicModulesForHp) {
    await prisma.eventModule.upsert({
      where: {
        eventNightId_moduleId: { eventNightId: hpEvent.id, moduleId: mm.id },
      },
      update: { enabled: hpEnabledKeys.has(mm.key) },
      create: {
        eventNightId: hpEvent.id,
        moduleId: mm.id,
        enabled: hpEnabledKeys.has(mm.key),
      },
    });
  }
  console.log(`Created/updated EventModules for HP event (${hpEnabledKeys.size} attivi)`);

  console.log('---');
  console.log('HP event join code: HP2024');
  console.log('HP table codes: GRIF01, SERP01, CORV01, TASS01');

  // --- Magic Modules (sync from registry — all 17) ---
  const moduleDefinitions = [
    // Originali
    { key: 'CARD_PREDICTION_BINARY',   name: 'Predizione Carta',            description: 'Scelta binaria su carta con timer' },
    { key: 'EQUIVOQUE_GUIDED',         name: 'Equivoque Guidato',           description: 'Script guidato a step con rivelazione' },
    { key: 'ENVELOPE_PREDICTION',      name: 'Predizione in Busta',         description: 'Predizione sigillata con rivelazione programmata' },
    // Forzature matematiche/psicologiche
    { key: 'MATHEMATICAL_FORCE_27',    name: 'Forzatura Matematica 27',     description: 'Operazioni guidate → sempre 27 → Asso di Quadri' },
    { key: 'PSYCHOLOGICAL_FORCE_CARD', name: 'Forzatura Psicologica Carta', description: 'Suggestione statistica verso 7 di Cuori / Asso di Picche' },
    { key: 'MAGICIANS_CHOICE_4',       name: 'Equivoque Digitale 4 Carte',  description: 'Qualunque scelta porta alla carta prevista (logica condizionale invisibile)' },
    { key: 'CLOCK_FORCE',              name: 'Forzatura a Orologio',        description: 'Conteggio circolare — sempre la stessa carta' },
    { key: 'SEALED_ENVELOPE_DIGITAL',  name: 'Busta Sigillata Digitale',    description: 'Previsione impossibile: la busta contiene la carta scelta' },
    // Previsioni hash
    { key: 'PREDICTION_HASH',          name: 'Prediction Hash',             description: 'SHA-256 mostrato a inizio serata, rivelato alla fine' },
    // Giochi matematici con carte
    { key: 'MATH_1089_CARDS',          name: '1089 con Carte',              description: 'Formula numerica 1089 → 9 di Cuori, funziona sempre' },
    { key: 'TWENTY_ONE_CARDS',         name: '21 Carte',                    description: 'Principio matematico: 3 colonne × 3 cicli → carta in posizione 11' },
    { key: 'BIRTHDAY_CARD_FORCE',      name: 'Carta dalla Data di Nascita', description: 'La data viene trasformata con formula fissa → carta specifica' },
    // Giochi sociali tra tavoli
    { key: 'SHARED_IMPOSSIBLE_CARD',   name: 'Carta Condivisa Impossibile', description: 'Ogni tavolo sceglie una carta — insieme formano una scala reale' },
    { key: 'SYNCED_CARD_THOUGHT',      name: 'Carta Pensata in Sincronia',  description: 'Tutti i tavoli arrivano alla stessa carta simultaneamente' },
    // Avanzati
    { key: 'INVISIBLE_DECK_DIGITAL',   name: 'Mazzo Invisibile Digitale',   description: 'Classico Invisible Deck su app — carta nominata già girata' },
    { key: 'ACAAN_DYNAMIC',            name: 'ACAAN Dinamico',              description: 'Any Card At Any Number: carta libera, numero libero, sempre corretto' },
    { key: 'MULTILEVEL_PREDICTION',    name: 'Previsione Multilivello',     description: '4 previsioni progressive: seme, valore, colore, posizione' },
  ];

  for (const mod of moduleDefinitions) {
    await prisma.magicModule.upsert({
      where: { key: mod.key },
      update: { name: mod.name, description: mod.description },
      create: { key: mod.key, name: mod.name, description: mod.description },
    });
  }
  console.log(`Synced ${moduleDefinitions.length} magic modules`);

  // Moduli abilitati per default sull'evento MAGIC1
  const magic1EnabledKeys = new Set([
    'CARD_PREDICTION_BINARY',
    'EQUIVOQUE_GUIDED',
    'ENVELOPE_PREDICTION',
  ]);

  const allMagicModules = await prisma.magicModule.findMany();
  for (const mm of allMagicModules) {
    await prisma.eventModule.upsert({
      where: {
        eventNightId_moduleId: { eventNightId: event.id, moduleId: mm.id },
      },
      update: { enabled: magic1EnabledKeys.has(mm.key) },
      create: {
        eventNightId: event.id,
        moduleId: mm.id,
        enabled: magic1EnabledKeys.has(mm.key),
      },
    });
  }
  console.log(`Created/updated EventModules for MAGIC1 event (${magic1EnabledKeys.size} attivi)`);

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
