export interface SeedParagraph {
  orderIndex: number;
  ghegText: string;
  englishText: string;
  vocabularyIds: string[];
}

export interface SeedQuestion {
  orderIndex: number;
  questionGheg: string;
  questionEnglish: string;
  sampleAnswers: string[];
}

export interface SeedStory {
  title: string;
  titleEnglish: string;
  weekNumber: number;
  phaseNumber: number;
  difficultyLevel: string;
  wordCount: number;
  targetVocabulary: string[];
  paragraphs: SeedParagraph[];
  questions: SeedQuestion[];
}

export const stories: SeedStory[] = [
  // ─── STORY 1: Week 1 ─────────────────────────────────────────────
  {
    title: "Mira në Prishtinë",
    titleEnglish: "Mira in Pristina",
    weekNumber: 1,
    phaseNumber: 1,
    difficultyLevel: "beginner",
    wordCount: 420,
    targetVocabulary: [
      "jeton", "shtëpi", "familje", "punon", "shkollë",
      "nënë", "babë", "kafe", "mëngjes", "mirëdita"
    ],
    paragraphs: [
      {
        orderIndex: 0,
        ghegText: "Kjo është Mira. Mira jeton në Prishtinë. Prishtina është kryeqyteti i Kosovës.",
        englishText: "This is Mira. Mira lives in Pristina. Pristina is the capital of Kosovo.",
        vocabularyIds: ["kjo", "është", "jeton", "në"]
      },
      {
        orderIndex: 1,
        ghegText: "Mira ka njëzet e pesë vjet. Ajo është e re dhe e bukur.",
        englishText: "Mira is twenty-five years old. She is young and beautiful.",
        vocabularyIds: ["ka", "vjet", "e re", "e bukur"]
      },
      {
        orderIndex: 2,
        ghegText: "Mira jeton me familjen e saj. Familja e saj është e vogël. Ajo ka një nënë dhe një babë.",
        englishText: "Mira lives with her family. Her family is small. She has a mother and a father.",
        vocabularyIds: ["familje", "e vogël", "nënë", "babë"]
      },
      {
        orderIndex: 3,
        ghegText: "Nëna e Mirës quhet Drita. Ajo punon në spital. Ajo është mjeke.",
        englishText: "Mira's mother is called Drita. She works at a hospital. She is a doctor.",
        vocabularyIds: ["quhet", "punon", "spital", "mjeke"]
      },
      {
        orderIndex: 4,
        ghegText: "Babai i Mirës quhet Agim. Ai punon në universitet. Ai është profesor.",
        englishText: "Mira's father is called Agim. He works at a university. He is a professor.",
        vocabularyIds: ["babai", "ai", "universitet", "profesor"]
      },
      {
        orderIndex: 5,
        ghegText: "Çdo mëngjes, Mira zgjohet herët. Ajo pin kafe turke. Kafja turke është shumë e mirë në Kosovë.",
        englishText: "Every morning, Mira wakes up early. She drinks Turkish coffee. Turkish coffee is very good in Kosovo.",
        vocabularyIds: ["mëngjes", "zgjohet", "pin", "kafe"]
      },
      {
        orderIndex: 6,
        ghegText: "Mira punon si mësuese. Ajo punon në një shkollë të vogël. Shkolla është afër shtëpisë.",
        englishText: "Mira works as a teacher. She works at a small school. The school is near the house.",
        vocabularyIds: ["mësuese", "shkollë", "e vogël", "shtëpi"]
      },
      {
        orderIndex: 7,
        ghegText: "Mira i do fëmijët. Fëmijët e dojnë Mirën. Ajo flet shqip me ta.",
        englishText: "Mira loves children. The children love Mira. She speaks Albanian with them.",
        vocabularyIds: ["do", "fëmijë", "flet", "shqip"]
      },
      {
        orderIndex: 8,
        ghegText: "Pas punës, Mira shkon në shtëpi. Ajo ha darkë me familjen. Pastaj ajo lexon libra.",
        englishText: "After work, Mira goes home. She eats dinner with the family. Then she reads books.",
        vocabularyIds: ["shkon", "shtëpi", "ha", "darkë", "lexon"]
      },
      {
        orderIndex: 9,
        ghegText: "Mira është e lumtur në Prishtinë. Ajo e do qytetin e saj. Prishtina është shtëpia e saj.",
        englishText: "Mira is happy in Pristina. She loves her city. Pristina is her home.",
        vocabularyIds: ["e lumtur", "do", "qytet", "shtëpi"]
      }
    ],
    questions: [
      {
        orderIndex: 0,
        questionGheg: "Ku jeton Mira?",
        questionEnglish: "Where does Mira live?",
        sampleAnswers: ["Në Prishtinë", "Mira jeton në Prishtinë", "Prishtinë"]
      },
      {
        orderIndex: 1,
        questionGheg: "Çka punon Mira?",
        questionEnglish: "What does Mira do for work?",
        sampleAnswers: ["Ajo është mësuese", "Mira punon si mësuese", "Mësuese"]
      },
      {
        orderIndex: 2,
        questionGheg: "Çka pin Mira në mëngjes?",
        questionEnglish: "What does Mira drink in the morning?",
        sampleAnswers: ["Kafe turke", "Ajo pin kafe turke", "Kafe"]
      },
      {
        orderIndex: 3,
        questionGheg: "Ku punon nëna e Mirës?",
        questionEnglish: "Where does Mira's mother work?",
        sampleAnswers: ["Në spital", "Nëna punon në spital", "Spital"]
      }
    ]
  },

  // ─── STORY 2: Week 2 ─────────────────────────────────────────────
  {
    title: "Familja e Dritonit",
    titleEnglish: "Driton's Family",
    weekNumber: 2,
    phaseNumber: 1,
    difficultyLevel: "beginner",
    wordCount: 450,
    targetVocabulary: [
      "familje", "shtëpi", "vëlla", "motër", "gjysh",
      "gjyshe", "dhomë", "kuzhinë", "oborr", "i madh"
    ],
    paragraphs: [
      {
        orderIndex: 0,
        ghegText: "Ky është Dritoni. Dritoni jeton në Prizren. Prizreni është një qytet i bukur në Kosovë.",
        englishText: "This is Driton. Driton lives in Prizren. Prizren is a beautiful city in Kosovo.",
        vocabularyIds: ["ky", "jeton", "qytet", "i bukur"]
      },
      {
        orderIndex: 1,
        ghegText: "Dritoni ka një familje të madhe. Ai jeton me nënën, babën, vëllain dhe motrën.",
        englishText: "Driton has a big family. He lives with his mother, father, brother, and sister.",
        vocabularyIds: ["familje", "e madhe", "nënë", "babë", "vëlla", "motër"]
      },
      {
        orderIndex: 2,
        ghegText: "Vëllai i Dritonit quhet Arben. Arbeni ka tridhjetë vjet. Ai punon si inxhinier.",
        englishText: "Driton's brother is called Arben. Arben is thirty years old. He works as an engineer.",
        vocabularyIds: ["vëlla", "quhet", "vjet", "punon"]
      },
      {
        orderIndex: 3,
        ghegText: "Motra e Dritonit quhet Lira. Lira ka njëzet vjet. Ajo shkon në universitet.",
        englishText: "Driton's sister is called Lira. Lira is twenty years old. She goes to university.",
        vocabularyIds: ["motër", "quhet", "shkon", "universitet"]
      },
      {
        orderIndex: 4,
        ghegText: "Shtëpia e Dritonit është e madhe. Ka pesë dhoma. Ka një kuzhinë të madhe.",
        englishText: "Driton's house is big. It has five rooms. It has a big kitchen.",
        vocabularyIds: ["shtëpi", "e madhe", "dhomë", "kuzhinë"]
      },
      {
        orderIndex: 5,
        ghegText: "Shtëpia ka edhe një oborr. Oborri është i bukur. Ka lule dhe pemë.",
        englishText: "The house also has a yard. The yard is beautiful. It has flowers and trees.",
        vocabularyIds: ["oborr", "i bukur", "lule", "pemë"]
      },
      {
        orderIndex: 6,
        ghegText: "Gjyshi i Dritonit jeton afër. Ai vjen çdo ditë në shtëpi. Ai pin kafe me familjen.",
        englishText: "Driton's grandfather lives nearby. He comes every day to the house. He drinks coffee with the family.",
        vocabularyIds: ["gjysh", "jeton", "vjen", "kafe", "familje"]
      },
      {
        orderIndex: 7,
        ghegText: "Gjyshja e Dritonit gatuan shumë mirë. Ajo bën byrek dhe fli. Familja ha bashkë.",
        englishText: "Driton's grandmother cooks very well. She makes burek and fli. The family eats together.",
        vocabularyIds: ["gjyshe", "gatuan", "bën", "ha"]
      },
      {
        orderIndex: 8,
        ghegText: "Çdo mbrëmje, familja ulet bashkë. Ata flasin dhe qeshin. Familja e Dritonit është e lumtur.",
        englishText: "Every evening, the family sits together. They talk and laugh. Driton's family is happy.",
        vocabularyIds: ["mbrëmje", "ulet", "flasin", "e lumtur"]
      }
    ],
    questions: [
      {
        orderIndex: 0,
        questionGheg: "Ku jeton Dritoni?",
        questionEnglish: "Where does Driton live?",
        sampleAnswers: ["Në Prizren", "Dritoni jeton në Prizren", "Prizren"]
      },
      {
        orderIndex: 1,
        questionGheg: "Sa dhoma ka shtëpia?",
        questionEnglish: "How many rooms does the house have?",
        sampleAnswers: ["Pesë dhoma", "Ka pesë dhoma", "Pesë"]
      },
      {
        orderIndex: 2,
        questionGheg: "Si quhet motra e Dritonit?",
        questionEnglish: "What is Driton's sister's name?",
        sampleAnswers: ["Lira", "Motra quhet Lira", "Quhet Lira"]
      },
      {
        orderIndex: 3,
        questionGheg: "Çka bën gjyshja?",
        questionEnglish: "What does the grandmother make?",
        sampleAnswers: ["Byrek dhe fli", "Ajo bën byrek dhe fli", "Gjyshja bën byrek"]
      }
    ]
  },

  // ─── STORY 3: Week 3 ─────────────────────────────────────────────
  {
    title: "Në treg",
    titleEnglish: "At the Market",
    weekNumber: 3,
    phaseNumber: 1,
    difficultyLevel: "beginner",
    wordCount: 430,
    targetVocabulary: [
      "treg", "blej", "bukë", "djathë", "fruta",
      "perime", "para", "sa", "faleminderit", "ju lutem"
    ],
    paragraphs: [
      {
        orderIndex: 0,
        ghegText: "Sot është e shtunë. Mira shkon në treg. Tregu i Prishtinës është i madh.",
        englishText: "Today is Saturday. Mira goes to the market. The Pristina market is big.",
        vocabularyIds: ["sot", "e shtunë", "shkon", "treg", "i madh"]
      },
      {
        orderIndex: 1,
        ghegText: "Mira do me ble fruta dhe perime. Ajo ka një çantë të madhe.",
        englishText: "Mira wants to buy fruits and vegetables. She has a big bag.",
        vocabularyIds: ["do", "blej", "fruta", "perime", "çantë"]
      },
      {
        orderIndex: 2,
        ghegText: "Mira shikon mollë të kuqe. Ajo pyet: 'Sa kushtojnë mollët?' Shitësi thotë: 'Dy euro kilogrami.'",
        englishText: "Mira sees red apples. She asks: 'How much do the apples cost?' The seller says: 'Two euros per kilogram.'",
        vocabularyIds: ["shikon", "mollë", "e kuqe", "sa", "kushtojnë"]
      },
      {
        orderIndex: 3,
        ghegText: "Mira blen dy kilogram mollë. Pastaj ajo blen domate dhe speca. Perimet janë të freskëta.",
        englishText: "Mira buys two kilograms of apples. Then she buys tomatoes and peppers. The vegetables are fresh.",
        vocabularyIds: ["blen", "domate", "speca", "të freskëta"]
      },
      {
        orderIndex: 4,
        ghegText: "Mira shkon te bukëpjekësi. Ajo blen bukë të nxehtë. Bukë e freskët është shumë e mirë.",
        englishText: "Mira goes to the bakery. She buys hot bread. Fresh bread is very good.",
        vocabularyIds: ["bukë", "e nxehtë", "e freskët", "e mirë"]
      },
      {
        orderIndex: 5,
        ghegText: "Pastaj Mira blen djathë. Djathi i bardhë është nga Sharri. Ai është shumë i shijshëm.",
        englishText: "Then Mira buys cheese. The white cheese is from Sharr. It is very delicious.",
        vocabularyIds: ["djathë", "i bardhë", "i shijshëm"]
      },
      {
        orderIndex: 6,
        ghegText: "Mira blen edhe qumësht dhe vezë. Tani çanta është e rëndë.",
        englishText: "Mira also buys milk and eggs. Now the bag is heavy.",
        vocabularyIds: ["qumësht", "vezë", "tani", "e rëndë"]
      },
      {
        orderIndex: 7,
        ghegText: "Mira i thotë shitësit: 'Faleminderit!' Shitësi thotë: 'Ju lutem! Mirupafshim!'",
        englishText: "Mira says to the seller: 'Thank you!' The seller says: 'You're welcome! Goodbye!'",
        vocabularyIds: ["faleminderit", "ju lutem", "mirupafshim"]
      },
      {
        orderIndex: 8,
        ghegText: "Mira shkon në shtëpi. Ajo është e lumtur. Tani ajo ka ushqim për gjithë javën.",
        englishText: "Mira goes home. She is happy. Now she has food for the whole week.",
        vocabularyIds: ["shkon", "shtëpi", "e lumtur", "ushqim", "javë"]
      }
    ],
    questions: [
      {
        orderIndex: 0,
        questionGheg: "Ku shkon Mira sot?",
        questionEnglish: "Where does Mira go today?",
        sampleAnswers: ["Në treg", "Mira shkon në treg", "Treg"]
      },
      {
        orderIndex: 1,
        questionGheg: "Sa kushtojnë mollët?",
        questionEnglish: "How much do the apples cost?",
        sampleAnswers: ["Dy euro kilogrami", "Dy euro", "Kushtojnë dy euro"]
      },
      {
        orderIndex: 2,
        questionGheg: "Çka blen Mira në treg?",
        questionEnglish: "What does Mira buy at the market?",
        sampleAnswers: [
          "Fruta, perime, bukë, djathë, qumësht dhe vezë",
          "Mollë, domate, bukë dhe djathë",
          "Ajo blen fruta dhe perime"
        ]
      }
    ]
  },

  // ─── STORY 4: Week 4 ─────────────────────────────────────────────
  {
    title: "Një ditë në shkollë",
    titleEnglish: "A Day at School",
    weekNumber: 4,
    phaseNumber: 1,
    difficultyLevel: "beginner",
    wordCount: 440,
    targetVocabulary: [
      "shkollë", "mësuese", "nxënës", "libër", "klasë",
      "mëson", "shkruan", "lexon", "matematikë", "gjuhë"
    ],
    paragraphs: [
      {
        orderIndex: 0,
        ghegText: "Sot është e hënë. Mira shkon në shkollë. Ajo zgjohet herët në mëngjes.",
        englishText: "Today is Monday. Mira goes to school. She wakes up early in the morning.",
        vocabularyIds: ["sot", "e hënë", "shkon", "shkollë", "zgjohet", "mëngjes"]
      },
      {
        orderIndex: 1,
        ghegText: "Mira pin kafe dhe ha mëngjes. Pastaj ajo merr çantën dhe shkon.",
        englishText: "Mira drinks coffee and eats breakfast. Then she takes the bag and goes.",
        vocabularyIds: ["pin", "kafe", "ha", "mëngjes", "çantë", "shkon"]
      },
      {
        orderIndex: 2,
        ghegText: "Shkolla është afër shtëpisë. Mira ecën pesëmbëdhjetë minuta. Ajo arrin në shkollë.",
        englishText: "The school is near the house. Mira walks fifteen minutes. She arrives at school.",
        vocabularyIds: ["shkollë", "afër", "shtëpi", "ecën", "minuta"]
      },
      {
        orderIndex: 3,
        ghegText: "Mira hyn në klasë. Klasa ka njëzet nxënës. Nxënësit janë fëmijë të vegjël.",
        englishText: "Mira enters the classroom. The class has twenty students. The students are small children.",
        vocabularyIds: ["klasë", "nxënës", "fëmijë", "të vegjël"]
      },
      {
        orderIndex: 4,
        ghegText: "Nxënësit thonë: 'Mirëdita, mësuese!' Mira thotë: 'Mirëdita, fëmijë! Si jeni sot?'",
        englishText: "The students say: 'Good day, teacher!' Mira says: 'Good day, children! How are you today?'",
        vocabularyIds: ["mirëdita", "mësuese", "fëmijë", "si jeni"]
      },
      {
        orderIndex: 5,
        ghegText: "Sot Mira mëson gjuhën shqipe. Nxënësit lexojnë një tregim. Pastaj ata shkruajnë.",
        englishText: "Today Mira teaches Albanian language. The students read a story. Then they write.",
        vocabularyIds: ["mëson", "gjuhë", "shqipe", "lexojnë", "shkruajnë"]
      },
      {
        orderIndex: 6,
        ghegText: "Pas gjuhës, është matematikë. Fëmijët mësojnë numrat. Ata llogarisin bashkë.",
        englishText: "After language, it is mathematics. The children learn numbers. They calculate together.",
        vocabularyIds: ["matematikë", "mësojnë", "numra"]
      },
      {
        orderIndex: 7,
        ghegText: "Në pushim, fëmijët luajnë në oborr. Ata vrapojnë dhe qeshin. Mira shikon dhe buzëqesh.",
        englishText: "During break, the children play in the yard. They run and laugh. Mira watches and smiles.",
        vocabularyIds: ["pushim", "luajnë", "oborr", "vrapojnë", "qeshin"]
      },
      {
        orderIndex: 8,
        ghegText: "Pas shkollës, Mira shkon në shtëpi. Ajo është e lodhun por e lumtur. Ajo i do fëmijët.",
        englishText: "After school, Mira goes home. She is tired but happy. She loves the children.",
        vocabularyIds: ["pas", "shkon", "shtëpi", "e lodhun", "e lumtur", "do", "fëmijë"]
      }
    ],
    questions: [
      {
        orderIndex: 0,
        questionGheg: "Sa nxënës ka klasa?",
        questionEnglish: "How many students does the class have?",
        sampleAnswers: ["Njëzet nxënës", "Ka njëzet nxënës", "Njëzet"]
      },
      {
        orderIndex: 1,
        questionGheg: "Çka mëson Mira sot?",
        questionEnglish: "What does Mira teach today?",
        sampleAnswers: ["Gjuhën shqipe", "Mira mëson gjuhën shqipe", "Gjuhë dhe matematikë"]
      },
      {
        orderIndex: 2,
        questionGheg: "Çka bojnë fëmijët në pushim?",
        questionEnglish: "What do the children do during break?",
        sampleAnswers: ["Luajnë në oborr", "Ata luajnë dhe vrapojnë", "Vrapojnë dhe qeshin"]
      },
      {
        orderIndex: 3,
        questionGheg: "Si ndihet Mira pas shkollës?",
        questionEnglish: "How does Mira feel after school?",
        sampleAnswers: ["E lodhun por e lumtur", "Ajo është e lumtur", "E lodhun"]
      }
    ]
  },

  // ─── STORY 5: Week 5 ─────────────────────────────────────────────
  {
    title: "Mbrëmja në shtëpi",
    titleEnglish: "Evening at Home",
    weekNumber: 5,
    phaseNumber: 1,
    difficultyLevel: "beginner",
    wordCount: 460,
    targetVocabulary: [
      "mbrëmje", "darkë", "gatuan", "televizor", "gjumë",
      "fle", "lexon", "dëgjon", "muzikë", "familje"
    ],
    paragraphs: [
      {
        orderIndex: 0,
        ghegText: "Është mbrëmje në Prishtinë. Mira vjen në shtëpi pas punës. Ajo është e lodhun.",
        englishText: "It is evening in Pristina. Mira comes home after work. She is tired.",
        vocabularyIds: ["mbrëmje", "vjen", "shtëpi", "punë", "e lodhun"]
      },
      {
        orderIndex: 1,
        ghegText: "Nëna e Mirës është në kuzhinë. Ajo gatuan darkë. Era e bukur vjen nga kuzhina.",
        englishText: "Mira's mother is in the kitchen. She is cooking dinner. A nice smell comes from the kitchen.",
        vocabularyIds: ["nënë", "kuzhinë", "gatuan", "darkë", "erë"]
      },
      {
        orderIndex: 2,
        ghegText: "Sot për darkë ka fasule me mish. Kjo është gatimi i preferuar i Mirës.",
        englishText: "Today for dinner there are beans with meat. This is Mira's favorite dish.",
        vocabularyIds: ["darkë", "fasule", "mish", "gatim", "i preferuar"]
      },
      {
        orderIndex: 3,
        ghegText: "Babai vjen në shtëpi. Ai thotë: 'Mirëmbrëma!' Familja ulet bashkë në tryezë.",
        englishText: "Father comes home. He says: 'Good evening!' The family sits together at the table.",
        vocabularyIds: ["babë", "vjen", "mirëmbrëma", "familje", "ulet", "tryezë"]
      },
      {
        orderIndex: 4,
        ghegText: "Familja ha darkë bashkë. Ata flasin për ditën. Mira tregon për nxënësit e saj.",
        englishText: "The family eats dinner together. They talk about the day. Mira tells about her students.",
        vocabularyIds: ["ha", "darkë", "flasin", "ditë", "tregon", "nxënës"]
      },
      {
        orderIndex: 5,
        ghegText: "Pas darkës, babai shikon televizor. Ai shikon lajmet. Nëna pin çaj.",
        englishText: "After dinner, father watches television. He watches the news. Mother drinks tea.",
        vocabularyIds: ["darkë", "shikon", "televizor", "lajme", "pin", "çaj"]
      },
      {
        orderIndex: 6,
        ghegText: "Mira shkon në dhomën e saj. Ajo lexon një libër. Libri është shumë interesant.",
        englishText: "Mira goes to her room. She reads a book. The book is very interesting.",
        vocabularyIds: ["shkon", "dhomë", "lexon", "libër", "interesant"]
      },
      {
        orderIndex: 7,
        ghegText: "Pastaj Mira dëgjon muzikë. Ajo i do këngët shqiptare. Muzika është e bukur.",
        englishText: "Then Mira listens to music. She loves Albanian songs. The music is beautiful.",
        vocabularyIds: ["dëgjon", "muzikë", "do", "këngë", "shqiptare"]
      },
      {
        orderIndex: 8,
        ghegText: "Ora është dhjetë. Mira është e lodhun. Ajo thotë: 'Natën e mirë!' dhe shkon me fjetë.",
        englishText: "It is ten o'clock. Mira is tired. She says: 'Good night!' and goes to sleep.",
        vocabularyIds: ["ora", "e lodhun", "natën e mirë", "fle"]
      },
      {
        orderIndex: 9,
        ghegText: "Shtëpia bëhet e qetë. Familja fle. Nesër është një ditë e re.",
        englishText: "The house becomes quiet. The family sleeps. Tomorrow is a new day.",
        vocabularyIds: ["shtëpi", "e qetë", "fle", "nesër", "ditë"]
      }
    ],
    questions: [
      {
        orderIndex: 0,
        questionGheg: "Çka gatuan nëna për darkë?",
        questionEnglish: "What does mother cook for dinner?",
        sampleAnswers: ["Fasule me mish", "Nëna gatuan fasule me mish", "Fasule"]
      },
      {
        orderIndex: 1,
        questionGheg: "Çka bën Mira pas darkës?",
        questionEnglish: "What does Mira do after dinner?",
        sampleAnswers: ["Lexon libër", "Ajo lexon dhe dëgjon muzikë", "Lexon një libër"]
      },
      {
        orderIndex: 2,
        questionGheg: "Çka shikon babai?",
        questionEnglish: "What does father watch?",
        sampleAnswers: ["Televizor", "Ai shikon televizor", "Shikon lajmet", "Lajmet"]
      },
      {
        orderIndex: 3,
        questionGheg: "Kur shkon Mira me fjetë?",
        questionEnglish: "When does Mira go to sleep?",
        sampleAnswers: ["Në orën dhjetë", "Ora dhjetë", "Kur ora është dhjetë"]
      }
    ]
  }
];
