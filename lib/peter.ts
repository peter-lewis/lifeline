import { defineLifeline } from "~/lib/lifeline-data"

/**
 * Peter Lewis — how I got into computers.
 *
 * Three braided threads, keyed by `track` and read off the footer legend:
 *   tech — consoles, computers, phones, connections, operating systems
 *   work — jobs, businesses, and the things I shipped
 *   life — family, church, travel, and the things I do that aren't computers
 *
 * `defineLifeline` fills every year between birthYear and endYear, so the
 * axis is continuous (1984–2026, ages 0–42) and quiet years still take
 * their narrow slot on the rail. Month detail lives in the prose, since
 * the axis is years.
 */
const record = defineLifeline({
  slug: "peter-lewis",
  name: "Peter Lewis",
  birthYear: 1984,
  endYear: 2026,
  description:
    "How I got into computers — from a borrowed Macintosh to directing software engineering.",
  milestones: {
    1984: {
      id: "born",
      events: [
        { track: "life", text: "I was born in Raleigh, North Carolina." },
        {
          track: "life",
          text: "My mother stayed home with me through my early years, until I started school at five. A strong, independent woman who has always loved to serve the Lord.",
        },
      ],
      mentors: [
        { name: "Terry Lewis", role: "Father" },
        { name: "Pam Lewis", role: "Mother" },
      ],
    },
    1988: {
      id: "first-computer-first-games",
      companies: [
        { id: "apple", name: "Apple", track: "tech" },
        { id: "atari", name: "Atari", track: "tech" },
      ],
      events: [
        {
          track: "tech",
          image: {
            src: "/images/hardware/macintosh.webp",
            alt: "An original Macintosh 128K",
          },
          text: "My father brought an original Macintosh home for work — the first computer I ever used.",
        },
        {
          track: "tech",
          text: "Flight Simulator on that Macintosh. The first video game I remember.",
        },
        {
          track: "tech",
          image: {
            src: "/images/hardware/atari-2600.webp",
            alt: "The Atari 2600 with its joystick",
          },
          text: "Asteroids on the family Atari 2600. My first console game.",
        },
        {
          track: "tech",
          text: "Dialled into a local BBS. My first time online, over a modem and a phone line.",
        },
        {
          track: "work",
          text: "Dad was a software engineer himself. He paved the way for my interest in computers and software, and made sure I had a strong ethical foundation.",
        },
      ],
      mentors: [{ name: "Terry Lewis", role: "Father" }],
    },
    1989: {
      id: "nes",
      companies: [{ id: "nintendo", name: "Nintendo", track: "tech" }],
      events: [
        {
          track: "tech",
          image: {
            src: "/images/hardware/nes.webp",
            alt: "The Nintendo Entertainment System and controller",
          },
          text: "A NES under the tree on Christmas morning — the first console that was mine.",
        },
        {
          track: "tech",
          text: "Top Gun for the NES, the first console game I owned.",
        },
        {
          track: "tech",
          text: "Then Mario Bros and both its sequels, Bubble Bobble, and The Legend of Zelda.",
        },
      ],
    },
    1990: {
      id: "game-boy",
      companies: [{ id: "nintendo", name: "Nintendo", track: "tech" }],
      events: [
        {
          track: "tech",
          image: { src: "/images/hardware/game-boy.webp", alt: "The original Game Boy" },
          text: "A Game Boy in March.",
        },
        {
          track: "tech",
          text: "Tetris and Mario, everywhere I went.",
        },
      ],
    },
    1992: {
      id: "spring-branch",
      events: [
        {
          track: "life",
          text: "Moved to Spring Branch, Texas, in August. My mother had taken a job in the San Antonio area. I was eight.",
        },
      ],
      mentors: [{ name: "Pam Lewis", role: "Mother" }],
    },
    1993: {
      id: "snes-286",
      companies: [{ id: "nintendo", name: "Nintendo", track: "tech" }],
      events: [
        {
          track: "tech",
          image: { src: "/images/hardware/snes.webp", alt: "The Super Nintendo Entertainment System" },
          text: "Super Nintendo, Christmas morning.",
        },
        {
          track: "tech",
          text: "Super Mario World, Pilot Wings, Donkey Kong, and NBA Jam TE.",
        },
        {
          track: "tech",
          text: "A 286 — the first computer that belonged to me. Dad and I built it together.",
        },
        {
          track: "tech",
          text: "SimCity, Populous and Commander Keen on it.",
        },
      ],
    },
    1994: {
      id: "386",
      events: [
        { track: "tech", text: "Moved up to a 386, built with Dad again." },
        {
          track: "tech",
          text: "Wolfenstein 3D, then Doom and Doom II.",
        },
      ],
      mentors: [{ name: "Terry Lewis", role: "Father" }],
    },
    1995: {
      id: "486",
      events: [
        { track: "tech", text: "A Datalogic 486." },
        {
          track: "tech",
          text: "SimCity 2000, and Command & Conquer — Red Alert not long after.",
        },
      ],
    },
    1996: {
      id: "game-gear-n64-pentium",
      companies: [
        { id: "sega", name: "Sega", track: "tech" },
        { id: "nintendo", name: "Nintendo", track: "tech" },
        { id: "intel", name: "Intel", track: "tech" },
      ],
      events: [
        {
          track: "tech",
          image: {
            src: "/images/hardware/game-gear.webp",
            alt: "The Sega Game Gear",
          },
          text: "A Sega Game Gear in June.",
        },
        {
          track: "tech",
          image: { src: "/images/hardware/n64.webp", alt: "The Nintendo 64 and controller" },
          text: "Nintendo 64, Christmas morning.",
        },
        {
          track: "tech",
          text: "Super Mario 64, Pilot Wings 64, Ocarina of Time, GoldenEye, Donkey Kong 64.",
        },
        { track: "tech", text: "An IBM Pentium, 75 MHz." },
        {
          track: "life",
          text: "First camera: a Kodak Advantix 3700ix.",
        },
      ],
    },
    1997: {
      id: "lawn-website-k6",
      companies: [{ id: "amd", name: "AMD", track: "tech" }],
      events: [
        {
          track: "work",
          text: "First job. Summers of 1997 and 1998 working for my grandfather's lawn care business — 15 to 20 yards a day, most of it behind a weed eater and a backpack blower.",
        },
        {
          track: "work",
          text: "Hard-earned money. It taught me what my own work was worth, and settled one question early: I did not want to work outside for the rest of my life.",
        },
        {
          track: "work",
          // A floating card can't live here — 1997→1998 is a one-year gap
          // with no text-free run, so it collided with whichever column it
          // was nudged toward. As a hover image it rides the cursor on
          // desktop and taps open into the lightbox on mobile, costing no
          // layout at all.
          image: {
            src: "/images/first-website-1997.webp",
            alt: "Peters Wonderful Website, captured by the Internet Archive in 1999",
          },
          text: [
            { type: "text", value: "Wrote my first website, for fun. " },
            {
              type: "link",
              value: "Peters Wonderful Website!",
              href: "https://web.archive.org/web/19990420233111/http://www.gvtc.com/~flewis/old/index.html",
            },
            {
              type: "text",
              value:
                " is still up on the Internet Archive, hit counter and all — hosted on GVTC's subscriber web space, three years before they hired me.",
            },
          ],
        },
        {
          track: "tech",
          text: "Built a computer myself for the first time, around an AMD K6. Dad watched and stepped in when I needed him. Everything after this one I put together.",
        },
        {
          track: "tech",
          text: "Installed Slackware, my first Linux.",
        },
      ],
      mentors: [
        { name: "Gary Lewis", role: "Grandfather" },
        { name: "Terry Lewis", role: "Father" },
      ],
    },
    1998: {
      id: "celeron-gbc",
      companies: [
        { id: "nintendo", name: "Nintendo", track: "tech" },
        { id: "intel", name: "Intel", track: "tech" },
      ],
      events: [
        {
          track: "tech",
          image: { src: "/images/hardware/game-boy-color.webp", alt: "The Game Boy Color" },
          text: "Game Boy Color, Christmas.",
        },
        {
          track: "tech",
          text: "Pokemon.",
        },
        { track: "tech", text: "An Intel Celeron 300A." },
        {
          track: "work",
          text: "Learned ASP, the first language I actually programmed in. Everything before this had been HTML, and Dad was there whenever I couldn't work out why something wasn't doing what I expected.",
        },
      ],
    },
    1999: {
      id: "dreamcast-athlon",
      companies: [
        { id: "sega", name: "Sega", track: "tech" },
        { id: "amd", name: "AMD", track: "tech" },
      ],
      events: [
        {
          track: "tech",
          image: { src: "/images/hardware/dreamcast.webp", alt: "The Sega Dreamcast and controller" },
          text: "Sega Dreamcast, Christmas.",
        },
        {
          track: "tech",
          text: "Sonic and Crazy Taxi.",
        },
        { track: "tech", text: "An AMD Athlon." },
        {
          track: "tech",
          text: "Quake III Arena, Half-Life, Age of Empires II, SimCity 3000, GTA II.",
        },
      ],
    },
    2000: {
      id: "helpdesk-stickys",
      events: [
        {
          track: "work",
          text: [
            { type: "text", value: "First job in computers: a summer internship on the " },
            { type: "link", value: "GVTC", href: "https://gvtc.com/" },
            { type: "text", value: " help desk, still in high school." },
          ],
        },
        {
          track: "work",
          text: "Once they learned I could program, they had me writing software instead of working tickets.",
        },
        {
          track: "work",
          text: "Wrote my first real application that summer: a Visual Basic 6 program that read call logs off the phone system over a serial connection, flagged every 911 dial, and printed a daily report to a network laser printer for GVTC's government audits.",
        },
        {
          track: "work",
          text: "Founded Sticky's Computers with Kenny Scholwinski, a friend from high school — custom-built machines and small networks for families and businesses on the north side of San Antonio, with an online storefront for parts orders.",
        },
        {
          track: "tech",
          text: "Stood up my first home server. Game server, file server, and a sandbox for Active Directory and Exchange, licensed legitimately through a TechNet subscription.",
        },
      ],
      mentors: [
        { name: "Keith Mitchell", role: "Manager, GVTC" },
        { name: "Kenny Scholwinski", role: "Co-founder" },
      ],
    },
    2001: {
      id: "gba-xbox-athlon-911",
      companies: [
        { id: "nintendo", name: "Nintendo", track: "tech" },
        { id: "xbox", name: "Xbox", track: "tech" },
        { id: "amd", name: "AMD", track: "tech" },
      ],
      events: [
        {
          track: "tech",
          image: { src: "/images/hardware/game-boy-advance.webp", alt: "The Game Boy Advance" },
          text: "Game Boy Advance that summer.",
        },
        {
          track: "tech",
          effect: "fireworks",
          image: {
            src: "/images/hardware/xbox-original.webp",
            alt: "The original Xbox with the Duke controller",
          },
          text: "Won an Xbox in October from a Taco Bell promotion — a month before it reached stores.",
        },
        {
          track: "tech",
          text: "Halo and Unreal Championship on it.",
        },
        { track: "tech", text: "An AMD Athlon XP." },
        {
          track: "work",
          text: "Built the online DSL availability checker for GVTC's ISP.",
        },
        {
          track: "tech",
          text: "Broadband — GVTC DSL, thirteen years after that first dial-up connection.",
        },
      ],
    },
    2002: {
      id: "graduation-first-contract",
      events: [
        { track: "work", text: "Graduated high school in May." },
        {
          track: "work",
          text: "First contract work that summer, for GVTC's long-distance division — a custom reporting tool for leased-line rate reporting.",
        },
        {
          track: "tech",
          text: "Got my ham radio licence. I have held it ever since.",
        },
        {
          track: "work",
          text: "Sticky's Computers wound down. My co-founder and I went separate ways after high school and never restarted it.",
        },
        {
          track: "tech",
          text: "A Compaq iPaq Pocket PC, my first smart device.",
        },
      ],
    },
    2003: {
      id: "parham-athlon64",
      companies: [{ id: "amd", name: "AMD", track: "tech" }],
      events: [
        {
          track: "work",
          text: [
            { type: "text", value: "Hired for the summer to upgrade the offices and stores at Joshua Management and " },
            { type: "link", value: "the Parham Group", href: "https://theparhamgroup.com/" },
            {
              type: "text",
              value:
                " to Windows XP. Construction and real-estate development, specialising in self-storage. It wasn't meant to be permanent — I was going to school.",
            },
          ],
        },
        {
          track: "work",
          text: "Two days in, Mike and Ann offered to pay for my college if I stayed and studied in the San Antonio area.",
        },
        {
          track: "work",
          text: "It grew from help desk work into running their servers, standing up new ones, administering Exchange and the accounting packages, and building their web presence — eventually the systems for close to 100 people across two states. Seven years, and my first full-time job in computing.",
        },
        { track: "tech", text: "An AMD Athlon 64." },
        {
          track: "tech",
          text: "SimCity 4, and more hours in it than anything else I have played. Rise of Nations and Empire Earth alongside it.",
        },
        {
          track: "life",
          text: "My mother stepped back from her career to care for my brother, who has epilepsy, and to homeschool him. She showed me what it means to love through self-sacrifice.",
        },
      ],
      mentors: [
        { name: "Pam Lewis", role: "Mother" },
        { name: "Mike Parham", role: "Owner, the Parham Group" },
        { name: "Ann Parham", role: "Owner, the Parham Group" },
      ],
    },
    2004: {
      id: "nintendo-ds",
      companies: [{ id: "nintendo", name: "Nintendo", track: "tech" }],
      events: [{
          track: "tech",
          image: { src: "/images/hardware/nintendo-ds.webp", alt: "The original Nintendo DS" },
          text: "Nintendo DS, Christmas.",
        }],
    },
    2005: {
      id: "xbox-360",
      companies: [{ id: "xbox", name: "Xbox", track: "tech" }],
      events: [
        {
          track: "life",
          text: "Met Christie, who would become my wife.",
        },
        {
          track: "life",
          text: "Became youth leader at my church, and stayed in it until around 2010.",
        },
        {
          track: "work",
          text: "Started running the church website. I have run the website for every church I have belonged to since.",
        },
        {
          track: "tech",
          text: "Half-Life 2, and Battlefield — 1942 first, then Vietnam.",
        },
        {
          track: "work",
          text: "Set up a branch office in Florida.",
        },
        {
          track: "work",
          text: "Built a custom CD carrying JavaScript project-estimation tooling. A marketing piece: make the complexity of a build plain, and the case for hiring a real estate developer with it.",
        },
        {
          track: "tech",
          image: { src: "/images/hardware/xbox-360.webp", alt: "The Xbox 360 and controller" },
          text: "Xbox 360 on launch day, 22 November.",
        },
        {
          track: "tech",
          text: "Halo 2, Marble Blast Ultra, Fable.",
        },
        {
          track: "life",
          text: "A Samsung A7. There was another camera somewhere around 2000 that I have no memory of.",
        },
      ],
      mentors: [{ name: "Christie Lewis", role: "Wife" }],
    },
    2006: {
      id: "core-2-duo",
      companies: [{ id: "intel", name: "Intel", track: "tech" }],
      events: [
        {
          track: "work",
          text: "Stopped going to college. The credential I've never missed — the network and the experiences it would have given me are the real cost.",
        },
        { track: "tech", text: "An Intel Core 2 Duo." },
        {
          track: "tech",
          text: "An HTC TyTN, sold as the AT&T 8525. My first smartphone: a slide-out keyboard and Windows Mobile.",
        },
      ],
    },
    2007: {
      id: "wii",
      companies: [{ id: "nintendo", name: "Nintendo", track: "tech" }],
      events: [{
          track: "tech",
          image: { src: "/images/hardware/wii.webp", alt: "The Nintendo Wii with Wii Remote" },
          text: "Nintendo Wii, Christmas.",
        },
        {
          track: "tech",
          text: "Mario Kart, Super Smash Bros, New Super Mario Bros.",
        },
        { track: "life", text: "Married Christie in October." },
        {
          track: "work",
          text: "Designed a customer analytics tool that mapped self-storage customers visually. Mike used it to test his theories about traffic patterns when scouting sites for future development.",
        },
        {
          track: "life",
          text: "Disney World on the honeymoon. The first of countless trips there.",
        },
      ],
      mentors: [
        { name: "Christie Lewis", role: "Wife" },
        { name: "Mike Parham", role: "Owner, the Parham Group" },
      ],
    },
    2008: {
      id: "new-braunfels-iphone",
      companies: [{ id: "apple", name: "Apple", track: "tech" }],
      events: [
        {
          track: "life",
          text: "Moved to New Braunfels in January, into the first house Christie and I built and bought.",
        },
        {
          track: "tech",
          text: "iPhone 3G on 11 July, launch day.",
        },
        {
          track: "work",
          text: "Started building an online streaming platform for video lessons — before YouTube. An e-commerce store took the payment, then issued an authorization ticket that unlocked playback through a Wowza media server.",
        },
        {
          track: "work",
          text: "Very difficult. I had to learn every piece of it in order to build it.",
        },
      ],
      mentors: [{ name: "Christie Lewis", role: "Wife" }],
    },
    2009: {
      id: "core-i7",
      companies: [{ id: "intel", name: "Intel", track: "tech" }],
      events: [{ track: "tech", text: "An Intel Core i7." }],
    },
    2010: {
      id: "harland-clarke",
      events: [
        {
          track: "work",
          text: [
            { type: "text", value: "Joined " },
            { type: "link", value: "Harland Clarke", href: "https://www.harlandclarke.com/" },
            { type: "text", value: " as a programmer analyst — my first full-time programming job." },
          ],
        },
        {
          track: "life",
          text: "A Canon 60D — the first camera I took seriously.",
        },
        {
          track: "life",
          text: "The Bahamas.",
        },
      ],
      mentors: [
        { name: "Christie Lewis", role: "Wife" },
        { name: "Bob Andreasen", role: "My manager, 2010–2014" },
        { name: "Terry Lewis", role: "Father" },
      ],
    },
    2011: {
      id: "macbook-pro",
      companies: [{ id: "apple", name: "Apple", track: "tech" }],
      events: [
        { track: "tech", text: "An Apple MacBook Pro." },
        {
          track: "tech",
          text: "Kerbal Space Program.",
        },
        {
          track: "work",
          text: "Started an iPad app with Bob in December, for taking and fulfilling orders at in-person events and seminars.",
        },
      ],
    },
    2012: {
      id: "ipad-order-app",
      companies: [
        { id: "apple", name: "Apple", track: "tech" },
        { id: "intel", name: "Intel", track: "tech" },
      ],
      events: [
        {
          track: "work",
          text: "Wrote the iPad app with Bob through 2012.",
        },
        {
          track: "work",
          text: "The hard part was distribution: an Apple Enterprise-signed build has to reach the people who need it without ever going near the public App Store.",
        },
        {
          track: "work",
          text: "Built the XML-to-PDF rendering engine behind our Adobe InDesign scripting, running through 2012 and into 2013.",
        },
        { track: "tech", text: "An Intel Core i7-3770K." },
        {
          track: "life",
          text: "Alaska.",
        },
      ],
      mentors: [
        { name: "Christie Lewis", role: "Wife" },
        { name: "Bob Andreasen", role: "Built it with me" },
      ],
    },
    2013: {
      id: "xbox-one",
      companies: [{ id: "xbox", name: "Xbox", track: "tech" }],
      events: [
        {
          track: "tech",
          image: {
            src: "/images/hardware/xbox-one.webp",
            alt: "The Xbox One with Kinect",
          },
          text: "Xbox One on launch day, 22 November — eight years to the day after the 360.",
        },
        {
          track: "tech",
          text: "Halo, again.",
        },
        {
          track: "tech",
          text: "Battlefield 4.",
        },
      ],
    },
    2014: {
      id: "illustrator-tooling",
      events: [
        {
          track: "work",
          text: "Built the Adobe Illustrator scripting system that streamlined onboarding new stationery designs, working closely with the graphic artist dedicated to them. An extremely difficult project.",
        },
        {
          track: "work",
          text: "That taught me the thing I still build by: software has to get out of the user's way. If it isn't making their actual work easier, it isn't worth much.",
        },
        {
          track: "life",
          text: "Hawaii.",
        },
      ],
      photos: [
        {
          // Pinned rather than auto-placed: 2013/2014/2015 all carry text,
          // so there is no text-free run for the automatic centring to use.
          // Sits below this column's own events instead.
          track: "work",
          src: "/images/harland-clarke-datacenter-2014.webp",
          alt: "Me at Harland Clarke Information Technology, on a tour of their data centre, July 2014",
          width: 135,
          x: 0.04,
          y: 312,
          rotate: -3,
        },
      ],
      mentors: [{ name: "Christie Lewis", role: "Wife" }],
    },
    2015: {
      id: "back-to-spring-branch",
      events: [
        {
          track: "life",
          text: "Moved back to Spring Branch in January, to be closer to church and into a better neighbourhood.",
        },
        {
          track: "work",
          text: "The awards had stacked up on the desk by now — Pillar of Excellence in 2012 for customer focus, Rock Star in 2015.",
        },
      ],
      photos: [
        {
          track: "work",
          src: "/images/harland-clarke-awards-2015.webp",
          alt: "Harland Clarke awards on my desk: Pillar of Excellence 2012 for customer focus, and 2015 Rock Star",
          width: 150,
          x: 0.04,
          y: 215,
          rotate: -3,
        },
      ],
      mentors: [{ name: "Christie Lewis", role: "Wife" }],
    },
    2016: {
      id: "payment-gateway",
      events: [
        {
          track: "work",
          text: "Built the PCI-compliant payment gateway — where I learned to appreciate regulated systems and the weight of the requirements around them.",
        },
        {
          track: "tech",
          text: "Factorio.",
        },
      ],
    },
    2017: {
      id: "switch",
      companies: [{ id: "nintendo", name: "Nintendo", track: "tech" }],
      events: [
        {
          track: "tech",
          image: { src: "/images/hardware/switch.webp", alt: "The Nintendo Switch in its dock" },
          text: "Nintendo Switch on launch day, 3 March.",
        },
        {
          track: "tech",
          text: "Breath of the Wild.",
        },
      ],
    },
    2018: {
      id: "overhauls",
      events: [
        {
          track: "work",
          text: "Overhauled the iPad app and the payment processing gateway.",
        },
        {
          track: "work",
          text: "Built the distribution system that finally answered 2012, six years on: AWS Lambda and Vue, handling upload and secure delivery of the Enterprise-signed build through an app store of our own.",
        },
        {
          track: "life",
          text: "Mexico and the western Caribbean.",
        },
      ],
      mentors: [{ name: "Christie Lewis", role: "Wife" }],
    },
    2019: {
      id: "glg-ryzen",
      companies: [{ id: "amd", name: "AMD", track: "tech" }],
      events: [
        {
          track: "work",
          image: {
            src: "/images/glg-first-day-badge-2019.webp",
            alt: "My GLG badge, 1 July 2019",
          },
          text: [
            { type: "text", value: "Joined " },
            { type: "link", value: "GLG", href: "https://glg.com/" },
            { type: "text", value: " on 1 July, on Dennis O'Brien's team." },
          ],
        },
        {
          track: "work",
          text: "Six months later I moved to the conference system team, working for Ted Patrick — someone I'd met at Harland Clarke.",
        },
        {
          track: "work",
          text: "My code went beyond small user bases and backend systems into large-scale, public customer-facing systems and landing pages.",
        },
        {
          track: "work",
          text: "At the tail end of the year we started the WebRTC implementation.",
        },
        { track: "tech", text: "A Ryzen 3900X in August." },
      ],
      mentors: [
        { name: "Ted Patrick", role: "Conference systems" },
        { name: "Dennis O'Brien", role: "Engineering leadership, GLG" },
      ],
    },
    2020: {
      id: "covid-webrtc",
      events: [
        {
          track: "work",
          text: "COVID. We went from a telephone-only conference provider to IP-based, and spent the whole year driving the WebRTC implementation hard enough to get ahead of it.",
        },
        {
          track: "work",
          text: "The hard part was parity. It had to work identically across both of our telephony providers — indistinguishable no matter which one was carrying the call.",
        },
        {
          track: "work",
          text: "Technically the most immense thing I've worked on, and the most rewarding.",
        },
        {
          track: "life",
          text: "Started running the livestream at my church, and ran it until we moved in 2021.",
        },
      ],
    },
    2021: {
      id: "series-x-m1",
      companies: [
        { id: "xbox", name: "Xbox", track: "tech" },
        { id: "apple", name: "Apple", track: "tech" },
      ],
      events: [
        {
          track: "tech",
          image: { src: "/images/hardware/xbox-series-x.webp", alt: "The Xbox Series X" },
          text: "Xbox Series X in February.",
        },
        { track: "tech", text: "An Apple MacBook Air — the M1." },
        {
          track: "work",
          text: "Promoted to Principal Software Engineer in the spring.",
        },
        {
          track: "work",
          text: "Left in August to follow Ted to Card.com.",
        },
        {
          track: "life",
          text: "Moved to Ronda, North Carolina, in August, to be near family who had come back here in 2019 — the state I was born in, thirty-seven years later.",
        },
        {
          track: "life",
          text: "A Canon R6, still the one I use.",
        },
        {
          track: "life",
          text: "Yellowstone.",
        },
      ],
      mentors: [{ name: "Christie Lewis", role: "Wife" }],
    },
    2022: {
      id: "back-to-glg",
      events: [
        {
          track: "work",
          text: "Card.com shut down engineering nine months after I arrived.",
        },
        {
          track: "work",
          text: "Dennis hired me back to GLG.",
        },
      ],
      mentors: [{ name: "Dennis O'Brien", role: "Brought me back to GLG" }],
    },
    2023: {
      id: "monorepo",
      events: [
        {
          track: "work",
          text: "Overhauled and built the monorepo that holds our core conference system tools.",
        },
        {
          track: "tech",
          text: "Super Mario Bros Wonder on the Switch.",
        },
      ],
    },
    2024: {
      id: "director",
      events: [
        {
          track: "work",
          text: "Dennis was let go, and I took over the team as its director.",
        },
        {
          track: "tech",
          text: "Satisfactory.",
        },
        {
          track: "life",
          text: "Elected as a deacon at my church.",
        },
      ],
    },
    2025: {
      id: "switch-2",
      companies: [{ id: "nintendo", name: "Nintendo", track: "tech" }],
      events: [
        {
          track: "tech",
          image: { src: "/images/hardware/switch-2.webp", alt: "The Nintendo Switch 2 in its dock" },
          text: "Nintendo Switch 2 on launch day, 5 June.",
        },
        {
          track: "work",
          text: "Pulled together the proof of concept for an invisible compliance auditor, live streaming over Zoom RTMS.",
        },
        {
          track: "life",
          text: "Ordained as a deacon in March.",
        },
      ],
    },
    2026: {
      id: "today",
      events: [
        {
          track: "work",
          text: "What I'm working toward is what it has always been: keep learning. Engineering is changing completely in the age of AI, and adapting is the whole job now — otherwise you get left behind.",
        },
        {
          track: "life",
          text: "Astrophotography, when the sky cooperates — my own lenses, and my father's Celestron when he will lend it.",
        },
        {
          track: "life",
          text: "Alaska again, in June.",
        },
      ],
      mentors: [{ name: "Christie Lewis", role: "Wife" }],
    },
  },
})

export const peterLifeline = record
