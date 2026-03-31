<!-- Arena: Elite Head-to-Head -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&amp;family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#004B23", // Deep Green
                        "secondary": "#E9C176", // Muted Gold (Gilt)
                        "background": "#0E0E0E", // Obsidian
                        "surface": "#131313",
                        "on-surface": "#E0E0E0", // Soft White
                        "on-surface-variant": "#8A9389", // Muted Grey-Green
                        "surface-container-low": "#1C1B1B",
                        "surface-container-high": "#2A2A2A",
                        "outline": "#404941",
                        "error": "#93000a",
                    },
                    fontFamily: {
                        "headline": ["Manrope", "sans-serif"],
                        "body": ["Inter", "sans-serif"],
                        "label": ["Manrope", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.125rem", 
                        "lg": "0.25rem", 
                        "xl": "0.5rem", 
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .pitch-gradient {
            background: linear-gradient(90deg, #0E0E0E 0%, #1C1B1B 50%, #0E0E0E 100%);
        }
        .caret-custom {
            width: 1px;
            height: 1.4em;
            background-color: #E9C176;
            display: inline-block;
            vertical-align: middle;
            margin-left: -1px;
            animation: blink 1s step-end infinite;
        }
        @keyframes blink {
            from, to { opacity: 1; }
            50% { opacity: 0; }
        }
    </style>
</head>
<body class="bg-background text-on-surface font-body selection:bg-primary/40 min-h-screen flex flex-col">
<!-- TopAppBar -->
<header class="bg-[#131313] dark:bg-[#0E0E0E] docked full-width top-0 z-50">
<div class="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto no-border bg-[#1C1B1B]">
<div class="text-2xl font-bold tracking-tighter text-[#E9C176] uppercase font-['Manrope']">
                WPM Pitch
            </div>
<nav class="hidden md:flex items-center space-x-10 font-['Manrope'] text-sm uppercase font-semibold tracking-tight">
<a class="text-[#93D6A0] border-b-2 border-[#004B23] pb-1" href="#">Arena</a>
<a class="text-[#8A9389] hover:text-[#E0E0E0] transition-colors" href="#">Teams</a>
<a class="text-[#8A9389] hover:text-[#E0E0E0] transition-colors" href="#">Leaderboard</a>
</nav>
<div class="flex items-center gap-6">
<button class="p-2 text-[#8A9389] hover:text-[#E0E0E0] transition-transform scale-95 active:opacity-80">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<div class="w-10 h-10 rounded-full border border-outline/20 overflow-hidden grayscale hover:grayscale-0 transition-all duration-500">
<img alt="User profile avatar" class="w-full h-full object-cover" data-alt="Close-up profile of a professional gamer wearing high-tech headphones with green neon accents against a dark background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDawAxzdn5nmvTlu5HUNEMlOX0xx3uNJfqZlrPScWDty-apeXNSIovGRQdr1VlN2Wnv6_lI67zuF_UlK9nDjv_UEPku_zNhQnelwBwZjE24jarV6htiL4ZPflAVPsS42YtjGlV22pm0o7gGirTLXNEi18vqVGIXLiDQPUUvTFW3RtLRjzcQbkxVvmu8jFUWMTv0bDTsY_hggNrONqxrKcJ0wjwDdXf5oQ-8bqrvBrn-16TnGYNoYxARCG5mRVceMVwJ1JYfb6dnYp0"/>
</div>
</div>
</div>
</header>
<main class="flex-grow flex flex-col items-center justify-start pt-12 pb-24 px-8 max-w-6xl mx-auto w-full">
<!-- Live Pitch Progress -->
<section class="w-full mb-16 space-y-4">
<div class="relative h-20 w-full bg-surface-container-low rounded-lg overflow-hidden pitch-gradient border border-outline/10">
<!-- Pitch Markings -->
<div class="absolute inset-0 flex justify-between px-8 opacity-5">
<div class="h-full border-l border-on-surface"></div>
<div class="h-full border-l border-on-surface"></div>
<div class="h-full border-l border-on-surface"></div>
<div class="h-full border-l border-on-surface"></div>
<div class="h-full border-l border-on-surface"></div>
</div>
<!-- Track 1: Player (You) -->
<div class="absolute top-4 left-0 w-full h-4 flex items-center">
<div class="h-px w-full bg-outline/20 absolute"></div>
<div class="absolute left-[65%] flex items-center gap-3 transition-all duration-300 ease-out">
<span class="text-[9px] font-bold text-secondary uppercase tracking-[0.2em] bg-primary px-2 py-0.5 rounded-sm">YOU</span>
<span class="material-symbols-outlined text-secondary text-xl" data-icon="sports_soccer" style="font-variation-settings: 'FILL' 1;">sports_soccer</span>
</div>
</div>
<!-- Track 2: Opponent -->
<div class="absolute bottom-4 left-0 w-full h-4 flex items-center">
<div class="h-px w-full bg-outline/20 absolute"></div>
<div class="absolute left-[42%] flex items-center gap-3 transition-all duration-300 ease-out opacity-40">
<span class="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.2em] bg-surface-container-high px-2 py-0.5 rounded-sm">RIVAL_01</span>
<span class="material-symbols-outlined text-on-surface-variant text-xl" data-icon="sports_soccer" style="font-variation-settings: 'FILL' 0;">sports_soccer</span>
</div>
</div>
</div>
</section>
<!-- Stats Dashboard -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
<div class="bg-surface-container-low/40 p-8 rounded-lg flex flex-col items-center justify-center border border-outline/5">
<span class="text-[10px] font-['Manrope'] font-bold tracking-[0.3em] text-on-surface-variant uppercase mb-3">Current Speed</span>
<div class="flex items-baseline gap-2">
<span class="text-6xl font-headline font-extrabold text-on-surface">84</span>
<span class="text-lg font-headline font-medium text-on-surface-variant">WPM</span>
</div>
</div>
<div class="bg-surface-container-low/40 p-8 rounded-lg flex flex-col items-center justify-center border border-outline/5">
<span class="text-[10px] font-['Manrope'] font-bold tracking-[0.3em] text-on-surface-variant uppercase mb-3">Accuracy</span>
<div class="flex items-baseline gap-2">
<span class="text-6xl font-headline font-extrabold text-on-surface">98.4</span>
<span class="text-lg font-headline font-medium text-on-surface-variant">%</span>
</div>
</div>
<div class="bg-surface-container-low p-8 rounded-lg flex flex-col items-center justify-center border border-primary/40 relative overflow-hidden">
<div class="absolute top-0 left-0 w-full h-1 bg-primary"></div>
<span class="text-[10px] font-['Manrope'] font-bold tracking-[0.3em] text-secondary uppercase mb-3">Live Rank</span>
<div class="flex items-baseline gap-2">
<span class="text-6xl font-headline font-extrabold text-secondary">#1</span>
<span class="text-lg font-headline font-medium text-on-surface-variant">/ 2</span>
</div>
</div>
</div>
<!-- Typing Arena -->
<div class="w-full max-w-4xl bg-surface-container-low/30 p-12 rounded-lg backdrop-blur-md relative border border-outline/10">
<div class="text-2xl md:text-3xl leading-[1.8] font-body text-on-surface-variant select-none tracking-wide text-center">
<span class="text-on-surface">Success</span>
<span class="text-on-surface"> is</span>
<span class="text-on-surface"> not</span>
<span class="text-on-surface"> final,</span>
<span class="text-on-surface"> failure</span>
<span class="text-on-surface"> is</span>
<span class="text-on-surface"> not</span>
<span class="text-on-surface"> fatal:</span>
<span class="text-on-surface"> it</span>
<span class="text-on-surface"> is</span>
<span class="text-on-surface"> the</span>
<span class="text-secondary relative font-medium">
                    cour<span class="caret-custom"></span>age
                </span>
<span class="opacity-40"> to continue that counts. The pitch is where champions are made, one keystroke at a time. Push your limits and outpace the competition with kinetic precision.</span>
</div>
<!-- Real-time Indicators -->
<div class="mt-14 flex justify-center gap-12">
<div class="flex items-center gap-3">
<div class="w-1.5 h-1.5 rounded-full bg-error opacity-60"></div>
<span class="text-[10px] font-label font-semibold uppercase tracking-[0.25em] text-on-surface-variant">2 Errors</span>
</div>
<div class="flex items-center gap-3">
<div class="w-1.5 h-1.5 rounded-full bg-secondary opacity-80"></div>
<span class="text-[10px] font-label font-semibold uppercase tracking-[0.25em] text-on-surface-variant">Streak: 42</span>
</div>
</div>
</div>
<!-- Action Area -->
<div class="mt-16 flex gap-6">
<button class="bg-primary text-secondary font-bold px-10 py-3.5 rounded-sm hover:brightness-125 active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] text-[11px] font-label border border-secondary/20">
                Restart Match
            </button>
<button class="bg-surface-container-high text-on-surface font-bold px-10 py-3.5 rounded-sm hover:bg-outline/20 active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] text-[11px] font-label border border-outline/10">
                Change Mode
            </button>
</div>
</main>
<!-- BottomNavBar (Mobile Only) -->
<nav class="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 bg-[#1C1B1B]/95 backdrop-blur-2xl rounded-t-xl border-t border-outline/10">
<a class="flex flex-col items-center justify-center text-[#E9C176] transition-all duration-300" href="#">
<span class="material-symbols-outlined" data-icon="sports_soccer" style="font-variation-settings: 'FILL' 1;">sports_soccer</span>
<span class="font-['Manrope'] text-[9px] uppercase tracking-widest mt-1.5 font-bold">Play</span>
</a>
<a class="flex flex-col items-center justify-center text-[#8A9389] opacity-60 px-4 py-2 hover:opacity-100 transition-all duration-300" href="#">
<span class="material-symbols-outlined" data-icon="groups">groups</span>
<span class="font-['Manrope'] text-[9px] uppercase tracking-widest mt-1.5 font-bold">Clubs</span>
</a>
<a class="flex flex-col items-center justify-center text-[#8A9389] opacity-60 px-4 py-2 hover:opacity-100 transition-all duration-300" href="#">
<span class="material-symbols-outlined" data-icon="leaderboard">leaderboard</span>
<span class="font-['Manrope'] text-[9px] uppercase tracking-widest mt-1.5 font-bold">Rankings</span>
</a>
<a class="flex flex-col items-center justify-center text-[#8A9389] opacity-60 px-4 py-2 hover:opacity-100 transition-all duration-300" href="#">
<span class="material-symbols-outlined" data-icon="person">person</span>
<span class="font-['Manrope'] text-[9px] uppercase tracking-widest mt-1.5 font-bold">Profile</span>
</a>
</nav>
</body></html>

<!-- Design System -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-error": "#690005",
              "error": "#ffb4ab",
              "inverse-on-surface": "#313030",
              "on-tertiary-fixed-variant": "#004f58",
              "on-surface": "#E0E0E0",
              "outline-variant": "#404941",
              "background": "#0E0E0E",
              "surface-variant": "#353534",
              "secondary-fixed-dim": "#93d6a0",
              "tertiary-fixed-dim": "#00daf3",
              "surface-container-high": "#201F1F",
              "surface-container-lowest": "#0E0E0E",
              "surface-dim": "#131313",
              "secondary-container": "#004B23",
              "on-secondary-fixed-variant": "#004B23",
              "on-primary-fixed-variant": "#3c4d00",
              "error-container": "#93000a",
              "inverse-primary": "#506600",
              "on-primary-fixed": "#161e00",
              "primary-fixed": "#E9C176",
              "inverse-surface": "#e5e2e1",
              "tertiary": "#00daf3",
              "primary": "#E9C176",
              "on-secondary-container": "#93D6A0",
              "on-primary-container": "#E9C176",
              "tertiary-container": "#004750",
              "on-tertiary": "#00363d",
              "on-background": "#E0E0E0",
              "surface": "#131313",
              "on-secondary-fixed": "#00210c",
              "surface-bright": "#393939",
              "on-primary": "#1A1A1A",
              "primary-container": "#2A2A2A",
              "on-surface-variant": "#8A9389",
              "surface-tint": "#E9C176",
              "on-secondary": "#FFFFFF",
              "secondary": "#004B23",
              "on-tertiary-fixed": "#001f24",
              "on-tertiary-container": "#00bdd3",
              "primary-fixed-dim": "#E9C176",
              "surface-container-low": "#1C1B1B",
              "surface-container-highest": "#353534",
              "outline": "#404941",
              "on-error-container": "#ffdad6",
              "secondary-fixed": "#93D6A0",
              "tertiary-fixed": "#9cf0ff",
              "surface-container": "#1C1B1B",
              "gilt": "#E9C176",
              "obsidian": "#0E0E0E",
              "deep-green": "#004B23"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Manrope"],
              "label": ["Manrope"]
            },
            borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      .glass-card {
        background: rgba(28, 27, 27, 0.7);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(233, 193, 118, 0.1);
      }
      .subtle-shadow {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
      .text-gilt { color: #E9C176; }
      .bg-gilt { background-color: #E9C176; }
      .border-gilt { border-color: #E9C176; }
      .text-deep-green { color: #004B23; }
      .bg-deep-green { background-color: #004B23; }
    </style>
</head>
<body class="bg-background text-on-surface font-body min-h-screen selection:bg-gilt selection:text-obsidian">
<!-- TopAppBar Shell -->
<header class="bg-[#1C1B1B] flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto fixed top-0 z-50 border-b border-outline/10">
<div class="text-2xl font-bold tracking-tighter text-gilt uppercase font-headline">
        WPM Pitch
    </div>
<nav class="hidden md:flex items-center space-x-10">
<a class="font-semibold text-sm tracking-tight text-on-surface-variant hover:text-on-surface transition-colors duration-200 uppercase" href="#">Arena</a>
<a class="font-semibold text-sm tracking-tight text-secondary-fixed-dim border-b-2 border-deep-green pb-1 transition-colors duration-200 uppercase" href="#">Teams</a>
<a class="font-semibold text-sm tracking-tight text-on-surface-variant hover:text-on-surface transition-colors duration-200 uppercase" href="#">Leaderboard</a>
</nav>
<div class="flex items-center space-x-6">
<button class="material-symbols-outlined text-on-surface-variant hover:text-gilt transition-colors cursor-pointer" data-icon="notifications">notifications</button>
<div class="w-10 h-10 rounded-full border border-outline/30 p-0.5 overflow-hidden transition-all hover:border-gilt/50">
<img alt="User profile avatar" class="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg8jOTDzC73tTl1nj4ula9Abutc7k9_ZycqQkzKTuGvjSoCm0ZKEtbcAz6DtefuZBdyabpRYy8tkMIU7GC2E_NCQT8KqxVkmh-1wTgK60PWsQ9LzetZbMDYW96xsOM_rktu9r-3mMPuwn_E6lYwjZsoQ6OZnlvMqAljphWvgcA3xfIu9vx6CKcIX1saSJF7JmfDsKXJR9MMb_CrNBewBwEfWtH14HiJxBhJXNEgl2IwG867Omtzeroa-jM9ZbG-rD-gfcWMxdV5EI"/>
</div>
</div>
</header>
<main class="pt-32 pb-32 px-8 max-w-7xl mx-auto">
<!-- Header Section -->
<div class="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
<div>
<span class="text-on-surface-variant font-headline font-semibold text-xs tracking-[0.3em] uppercase">Recruitment Phase</span>
<h1 class="text-4xl md:text-6xl font-headline font-bold tracking-tight mt-3 text-on-surface uppercase">Select Your <span class="text-gilt">Club</span></h1>
</div>
<div class="flex flex-col gap-1 items-end border-l border-outline/20 pl-8">
<span class="text-on-surface-variant font-label text-[10px] tracking-widest uppercase">Global Pool</span>
<span class="text-3xl font-headline font-light text-on-surface">1,284 <span class="text-on-surface-variant text-sm font-semibold uppercase tracking-tighter">Teams</span></span>
</div>
</div>
<!-- Filter Bar -->
<div class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
<div class="md:col-span-7 relative">
<span class="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" data-icon="search">search</span>
<input class="w-full bg-surface-container-low border border-outline/10 focus:border-gilt/30 focus:ring-0 rounded-lg py-4 pl-14 pr-6 text-sm font-medium tracking-wide text-on-surface placeholder:text-on-surface-variant/30 uppercase" placeholder="Search for a club..." type="text"/>
</div>
<div class="md:col-span-5 flex gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
<button class="bg-deep-green text-white font-semibold text-[11px] tracking-[0.1em] px-8 py-4 rounded-lg whitespace-nowrap uppercase transition-all hover:brightness-110">All Leagues</button>
<button class="bg-surface-container-high border border-outline/5 text-on-surface-variant hover:text-on-surface font-semibold text-[11px] tracking-[0.1em] px-8 py-4 rounded-lg whitespace-nowrap uppercase transition-all">Elite Series</button>
<button class="bg-surface-container-high border border-outline/5 text-on-surface-variant hover:text-on-surface font-semibold text-[11px] tracking-[0.1em] px-8 py-4 rounded-lg whitespace-nowrap uppercase transition-all">Challengers</button>
</div>
</div>
<!-- Team Grid - Minimalist approach -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
<!-- Team Card 1 - Active/Selected -->
<div class="group relative overflow-hidden rounded-xl bg-surface-container-low p-8 border border-gilt/40 transition-all duration-500 hover:bg-[#201F1F] subtle-shadow cursor-pointer">
<div class="absolute top-6 right-6">
<span class="material-symbols-outlined text-gilt text-xl" data-icon="check_circle" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
<div class="flex flex-col h-full">
<div class="mb-10 w-20 h-20 bg-[#2A2A2A] rounded-lg flex items-center justify-center p-4 border border-outline/10 group-hover:border-gilt/20 transition-all">
<img alt="Apex United" class="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" data-alt="minimalist modern soccer crest with a sharp stylized lightning bolt in electric lime green on a dark charcoal shield" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU_As0RMgJQSPsXkruxeCbSOTMpM5XeU5ZJusZFfnWn6pNFu0-AtNa_BwX4lwBvFDYRvrBEPk1MBQUuyU_9J-F7iodVznpQQ31WsTuW6xfBW7h1sdTonYUjj2dSmpit_4etsHhONfzQ9d_38dvKxzocnPR-O74U9aBPP-FP64ThBsnivpccXWe5QHusuCfQxvivTI814rwG1LcpPjCs1yZccWAV8NTpWIFI_P_lzBGncnrKg93Z9KYVJ3OB48i814Ku2dztj9S84s"/>
</div>
<div class="mt-auto">
<span class="text-on-surface-variant font-semibold text-[10px] tracking-[0.2em] uppercase">Elite Series</span>
<h3 class="text-xl font-bold text-on-surface mt-2 group-hover:text-gilt transition-colors uppercase tracking-tight">Apex United</h3>
<div class="flex items-center justify-between mt-6 pt-6 border-t border-outline/10">
<div>
<p class="text-[9px] font-semibold text-on-surface-variant uppercase tracking-widest">Global Rank</p>
<p class="text-xl font-bold text-on-surface">#04</p>
</div>
<div class="flex -space-x-1.5">
<div class="w-3 h-3 rounded-full bg-deep-green border border-outline/20"></div>
<div class="w-3 h-3 rounded-full bg-gilt border border-outline/20"></div>
</div>
</div>
</div>
</div>
</div>
<!-- Team Card 2 -->
<div class="group relative overflow-hidden rounded-xl bg-surface-container-low p-8 border border-outline/5 transition-all duration-500 hover:border-gilt/20 hover:bg-[#201F1F] cursor-pointer">
<div class="flex flex-col h-full">
<div class="mb-10 w-20 h-20 bg-[#2A2A2A] rounded-lg flex items-center justify-center p-4 border border-outline/10 transition-all">
<img alt="Neon Hawks" class="w-full h-full object-contain opacity-50 group-hover:opacity-100 transition-opacity" data-alt="sleek futuristic bird of prey emblem in silver and cyan on a deep matte black geometric background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg9CKaTd0rxmidDBZ9LoWoIeowrxW0AAp3yaoy-AxysPu8P2VBcghT7cxlKNalthHJ-BTrMDYhk0eD3cd_k-6JqTdX_boc36OhgmKr2LRQkEhk4y41i5QpJsvp6fvaLURGX6X14Q50Bk9ja6FBtSgIvw0O-WojtiMlxBhJ6vzmV2v2HgcJGPpli_giPHQWqknbUYe6YYpAjghGVaJ5aU6fgfXbtOeiKWwXBBE7KGA-LeKl_95mUbDxG1BKj7z22btTvQ3o44dhEUI"/>
</div>
<div class="mt-auto">
<span class="text-on-surface-variant font-semibold text-[10px] tracking-[0.2em] uppercase">Elite Series</span>
<h3 class="text-xl font-bold text-on-surface mt-2 group-hover:text-gilt transition-colors uppercase tracking-tight">Neon Hawks</h3>
<div class="flex items-center justify-between mt-6 pt-6 border-t border-outline/10">
<div>
<p class="text-[9px] font-semibold text-on-surface-variant uppercase tracking-widest">Global Rank</p>
<p class="text-xl font-bold text-on-surface">#12</p>
</div>
<div class="flex -space-x-1.5">
<div class="w-3 h-3 rounded-full bg-secondary-fixed-dim border border-outline/20"></div>
<div class="w-3 h-3 rounded-full bg-surface-container-highest border border-outline/20"></div>
</div>
</div>
</div>
</div>
</div>
<!-- Team Card 3 -->
<div class="group relative overflow-hidden rounded-xl bg-surface-container-low p-8 border border-outline/5 transition-all duration-500 hover:border-gilt/20 hover:bg-[#201F1F] cursor-pointer">
<div class="flex flex-col h-full">
<div class="mb-10 w-20 h-20 bg-[#2A2A2A] rounded-lg flex items-center justify-center p-4 border border-outline/10 transition-all">
<img alt="Vanguard FC" class="w-full h-full object-contain opacity-50 group-hover:opacity-100 transition-opacity" data-alt="technical crossed sword icon with digital glitch effects in violet and steel grey" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpAAwZc_IaB2SPIdMc5oMD4z5x-QfL9zfKbKCcBxy59KOGkJnjasW8rDPuUMnrcMKIbGkyr6VMMgv30y1fsGGb7ml9Q4panRwq46E8GDO-MXGrVh7zWuboofiIjHwYL2HbIwTVp-NHVu2zBPKHvv_AAfbIspTJUeuhZSd5uJ24os2jpf1fgL8PWiuryuipypdbgpGuzyFJeF_LmgVc-cBAArmnoAGOAEV40Qsn1geFXYwpcuPcEVdDZGikIodnYilat7-KBUCpGDc"/>
</div>
<div class="mt-auto">
<span class="text-on-surface-variant font-semibold text-[10px] tracking-[0.2em] uppercase">Challengers</span>
<h3 class="text-xl font-bold text-on-surface mt-2 group-hover:text-gilt transition-colors uppercase tracking-tight">Vanguard FC</h3>
<div class="flex items-center justify-between mt-6 pt-6 border-t border-outline/10">
<div>
<p class="text-[9px] font-semibold text-on-surface-variant uppercase tracking-widest">Global Rank</p>
<p class="text-xl font-bold text-on-surface">#38</p>
</div>
<div class="flex -space-x-1.5">
<div class="w-3 h-3 rounded-full bg-error/40 border border-outline/20"></div>
<div class="w-3 h-3 rounded-full bg-deep-green border border-outline/20"></div>
</div>
</div>
</div>
</div>
</div>
<!-- Team Card 4 -->
<div class="group relative overflow-hidden rounded-xl bg-surface-container-low p-8 border border-outline/5 transition-all duration-500 hover:border-gilt/20 hover:bg-[#201F1F] cursor-pointer">
<div class="flex flex-col h-full">
<div class="mb-10 w-20 h-20 bg-[#2A2A2A] rounded-lg flex items-center justify-center p-4 border border-outline/10 transition-all">
<img alt="Blaze Academy" class="w-full h-full object-contain opacity-50 group-hover:opacity-100 transition-opacity" data-alt="dynamic abstract flame logo with sharp edges and orange to red gradient on a dark circular badge" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkSXKvQ03lVjXeEmJk6CxQ9MWwqKa5VVm-QrZCzzkwsappYytcubzdCHfNGCpqbDmAsqHXlL3Rc_ctKYW9F_O6rLOZuMPSl5hG8QdSrOB5VLKavKFK-ff-DguCeKhjE13ObKGzPFwoq7Q0bcSCt1tVzdfrxM7pECsKy9_QW_UUCvDvqOQpTyC6ZJS-Ffj1ZZW_bQDeck3_YYdH1920NXZwbFL_CW1GwWDTq5Bpvoe2e0P19hFYVkOlcpFm46k5P1DZDz5txpL1MHw"/>
</div>
<div class="mt-auto">
<span class="text-on-surface-variant font-semibold text-[10px] tracking-[0.2em] uppercase">Regional</span>
<h3 class="text-xl font-bold text-on-surface mt-2 group-hover:text-gilt transition-colors uppercase tracking-tight">Blaze Academy</h3>
<div class="flex items-center justify-between mt-6 pt-6 border-t border-outline/10">
<div>
<p class="text-[9px] font-semibold text-on-surface-variant uppercase tracking-widest">Global Rank</p>
<p class="text-xl font-bold text-on-surface">#114</p>
</div>
<div class="flex -space-x-1.5">
<div class="w-3 h-3 rounded-full bg-error-container/40 border border-outline/20"></div>
<div class="w-3 h-3 rounded-full bg-gilt border border-outline/20"></div>
</div>
</div>
</div>
</div>
</div>
</div>
<!-- Sticky Confirmation Footer - Quiet & Elegant -->
<div class="fixed bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-40">
<div class="glass-card rounded-xl p-4 flex items-center justify-between subtle-shadow">
<div class="hidden sm:flex items-center gap-5 px-4 border-r border-outline/10 mr-4">
<div class="w-10 h-10 bg-deep-green/10 rounded-lg flex items-center justify-center border border-deep-green/20">
<span class="material-symbols-outlined text-deep-green text-xl" data-icon="stadium">stadium</span>
</div>
<div>
<p class="text-[9px] font-semibold text-on-surface-variant uppercase tracking-widest leading-none">Selected Arena</p>
<p class="text-xs font-bold text-on-surface mt-1 uppercase tracking-tight">Zenith Stadium, NY</p>
</div>
</div>
<button class="w-full sm:w-auto bg-gilt text-obsidian font-bold tracking-tight px-12 py-4 rounded-lg hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-xs">
                Confirm Selection
                <span class="material-symbols-outlined text-sm font-bold" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
</div>
</main>
<!-- BottomNavBar Shell (Mobile Only) -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#1C1B1B] border-t border-outline/10 md:hidden">
<a class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 px-4 py-2 hover:opacity-100 transition-opacity" href="#">
<span class="material-symbols-outlined mb-1" data-icon="sports_soccer">sports_soccer</span>
<span class="font-semibold text-[9px] uppercase tracking-widest">Play</span>
</a>
<a class="flex flex-col items-center justify-center text-secondary-fixed-dim px-4 py-2 relative" href="#">
<span class="material-symbols-outlined mb-1" data-icon="groups" style="font-variation-settings: 'FILL' 1;">groups</span>
<span class="font-semibold text-[9px] uppercase tracking-widest">Clubs</span>
<div class="absolute -top-1 w-1 h-1 bg-deep-green rounded-full"></div>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 px-4 py-2 hover:opacity-100 transition-opacity" href="#">
<span class="material-symbols-outlined mb-1" data-icon="leaderboard">leaderboard</span>
<span class="font-semibold text-[9px] uppercase tracking-widest">Rank</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant opacity-60 px-4 py-2 hover:opacity-100 transition-opacity" href="#">
<span class="material-symbols-outlined mb-1" data-icon="person">person</span>
<span class="font-semibold text-[9px] uppercase tracking-widest">Profile</span>
</a>
</nav>
</body></html>

<!-- Club Selection: Elite Tier -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>WPM Pitch | Arena Entry</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#004B23", // Refined deep green
                        "gilt": "#E9C176",
                        "obsidian": "#0E0E0E",
                        "on-surface": "#E0E0E0",
                        "on-surface-variant": "#8A9389",
                        "outline-variant": "#404941",
                        "background": "#0E0E0E",
                        "surface": "#131313",
                        "surface-container": "#1C1B1B",
                        "surface-container-high": "#201F1F",
                        "surface-container-highest": "#2A2A2A"
                    },
                    fontFamily: {
                        "headline": ["Manrope", "sans-serif"],
                        "body": ["Manrope", "sans-serif"],
                        "label": ["Manrope", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .pitch-pattern {
            background-image: radial-gradient(circle at 1px 1px, rgba(233, 193, 118, 0.03) 1px, transparent 0);
            background-size: 48px 48px;
        }
        .minimalist-glass {
            background: rgba(19, 19, 19, 0.8);
            backdrop-filter: blur(40px);
        }
    </style>
</head>
<body class="bg-background text-on-surface font-body min-h-screen selection:bg-primary selection:text-white">
<!-- Subtle Obsidian Background -->
<div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
<div class="absolute inset-0 pitch-pattern"></div>
<div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent"></div>
</div>
<main class="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
<!-- Logo Branding -->
<div class="mb-16 flex flex-col items-center text-center">
<div class="w-12 h-12 border border-gilt/20 flex items-center justify-center mb-6 transform rotate-45">
<span class="material-symbols-outlined text-gilt text-2xl -rotate-45" style="font-variation-settings: 'FILL' 0;">sports_soccer</span>
</div>
<h1 class="font-headline text-3xl font-extrabold tracking-[-0.05em] text-gilt uppercase">WPM Pitch</h1>
<p class="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.4em] mt-3 opacity-60">The Silent Grandmaster</p>
</div>
<!-- Auth Card Container -->
<div class="w-full max-w-sm">
<div class="minimalist-glass border border-outline-variant/10 shadow-2xl overflow-hidden">
<!-- Card Header/Tabs -->
<div class="flex border-b border-outline-variant/5">
<button class="flex-1 py-5 text-[11px] font-bold tracking-[0.2em] uppercase text-gilt border-b border-gilt bg-white/5 transition-all">
                        Login
                    </button>
<button class="flex-1 py-5 text-[11px] font-bold tracking-[0.2em] uppercase text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-white/5 transition-all">
                        Sign Up
                    </button>
</div>
<div class="p-8 space-y-8">
<!-- Social Logins -->
<div class="grid grid-cols-2 gap-3">
<button class="flex items-center justify-center gap-2 border border-outline-variant/10 py-3 hover:bg-surface-container-high transition-all duration-300">
<img alt="Google" class="w-3.5 h-3.5 opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCE4-E8AhoUnSBn7PdO3duQ85oFPTJiJXiMkgcyMTbGW-pD2g5Puow7Lr5rXo9Sz9QkzKelFmO5J2l0U4vn3RgwqoG5v06oplFCA2flK42A2EF8Wo5XEtFJ5tOXdZIXQmDYA_1bRVveY2PPqfnrlFLl0tUa1uNvsJALTboUZd3QzmPIe-uHGE4ebi8Uzhxhuk2p7oswW7nfYJ5QBlutdmfNSS8wer_UfmazQDMQ_z_JWPZUtkEtOmd17XyLAseH_7hS9QToXgotrJY"/>
<span class="font-label text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">Google</span>
</button>
<button class="flex items-center justify-center gap-2 border border-outline-variant/10 py-3 hover:bg-surface-container-high transition-all duration-300">
<span class="material-symbols-outlined text-on-surface-variant/60 text-lg">chat</span>
<span class="font-label text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">Discord</span>
</button>
</div>
<div class="relative flex items-center justify-center py-2">
<div class="absolute inset-0 flex items-center">
<div class="w-full border-t border-outline-variant/5"></div>
</div>
<span class="relative px-4 bg-[#131313] text-[9px] uppercase tracking-[0.3em] text-on-surface-variant/30 font-bold">Secure Access</span>
</div>
<!-- Traditional Form -->
<form class="space-y-6">
<div class="space-y-2">
<label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-0.5">Captain ID</label>
<div class="group relative">
<input class="w-full bg-surface-container border border-outline-variant/10 py-4 px-4 text-on-surface text-sm placeholder:text-on-surface-variant/20 focus:outline-none focus:border-gilt/30 transition-all duration-300 font-body" placeholder="Email Address" type="email"/>
</div>
</div>
<div class="space-y-2">
<div class="flex justify-between items-end">
<label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-0.5">Encrypted Key</label>
<a class="text-[9px] text-gilt/60 hover:text-gilt uppercase tracking-widest mb-0.5 transition-colors" href="#">Recovery</a>
</div>
<div class="group relative">
<input class="w-full bg-surface-container border border-outline-variant/10 py-4 px-4 text-on-surface text-sm placeholder:text-on-surface-variant/20 focus:outline-none focus:border-gilt/30 transition-all duration-300 font-body" placeholder="••••••••••••" type="password"/>
</div>
</div>
<div class="flex items-center gap-3 group cursor-pointer py-1">
<div class="relative flex items-center justify-center w-4 h-4 border border-outline-variant/30 rounded-sm group-hover:border-gilt/50 transition-colors">
<input class="peer absolute inset-0 opacity-0 cursor-pointer" type="checkbox"/>
<div class="w-2 h-2 bg-gilt scale-0 peer-checked:scale-100 transition-transform"></div>
</div>
<span class="text-[10px] text-on-surface-variant/50 font-label select-none uppercase tracking-widest">Persist Session</span>
</div>
<button class="w-full bg-primary text-white font-headline font-bold uppercase tracking-[0.2em] text-xs py-5 hover:bg-[#005a2b] active:scale-[0.98] transition-all duration-300" type="submit">
                            Enter the Pitch
                        </button>
</form>
</div>
<!-- Card Footer Info -->
<div class="p-6 bg-obsidian border-t border-outline-variant/5 text-center">
<p class="text-[9px] text-on-surface-variant/40 font-label uppercase tracking-[0.2em]">
                        Performance Standard: <span class="text-gilt/70 font-bold">84 WPM</span> • Lead: <span class="text-on-surface font-bold">KINETIC 5</span>
</p>
</div>
</div>
<!-- Global Stats Ticker -->
<div class="mt-12 flex justify-center gap-10 opacity-20">
<div class="flex items-center gap-2">
<span class="text-[9px] font-bold uppercase tracking-[0.2em]">12,402 Participants</span>
</div>
<div class="flex items-center gap-2">
<span class="text-[9px] font-bold uppercase tracking-[0.2em]">Latency Optimized</span>
</div>
</div>
</div>
</main>
<!-- Decorative Corner Elements -->
<div class="fixed top-12 left-12 hidden lg:block">
<div class="flex items-center gap-4">
<div class="w-[1px] h-12 bg-gilt/10"></div>
<div>
<p class="text-[9px] font-bold text-gilt/40 tracking-[0.4em] uppercase">Network Status</p>
<p class="text-[11px] text-on-surface-variant/60 font-medium uppercase tracking-widest mt-1">Operational</p>
</div>
</div>
</div>
<div class="fixed bottom-12 right-12 hidden lg:block">
<div class="text-right">
<p class="text-[9px] font-bold text-gilt/40 tracking-[0.4em] uppercase">Engine v4.0.2</p>
<p class="text-[11px] text-on-surface-variant/60 font-medium uppercase tracking-widest mt-1">Secure Environment</p>
<div class="flex justify-end mt-4 gap-2">
<div class="w-1 h-1 bg-primary"></div>
<div class="w-1 h-1 bg-primary/40"></div>
<div class="w-1 h-1 bg-primary/10"></div>
</div>
</div>
</div>
</body></html>

<!-- Elite Entrance: WPM Pitch -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&amp;family=Inter:wght@400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-error": "#690005",
              "error": "#ffb4ab",
              "inverse-on-surface": "#313030",
              "on-tertiary-fixed-variant": "#004f58",
              "on-surface": "#e5e2e1",
              "outline-variant": "#404941",
              "background": "#0E0E0E",
              "surface-variant": "#353534",
              "secondary-fixed-dim": "#93d6a0",
              "tertiary-fixed-dim": "#00daf3",
              "surface-container-high": "#201F1F",
              "surface-container-lowest": "#0b0b0b",
              "surface-dim": "#0e0e0e",
              "secondary-container": "#004B23",
              "on-secondary-fixed-variant": "#004B23",
              "on-primary-fixed-variant": "#E9C176",
              "error-container": "#93000a",
              "inverse-primary": "#E9C176",
              "on-primary-fixed": "#161e00",
              "primary-fixed": "#E9C176",
              "inverse-surface": "#e5e2e1",
              "tertiary": "#00daf3",
              "primary": "#E9C176",
              "on-secondary-container": "#93d6a0",
              "on-primary-container": "#E9C176",
              "tertiary-container": "#004750",
              "on-tertiary": "#00363d",
              "on-background": "#e5e2e1",
              "surface": "#131313",
              "on-secondary-fixed": "#00210c",
              "surface-bright": "#393939",
              "on-primary": "#1A1A1A",
              "primary-container": "#2A2A2A",
              "on-surface-variant": "#c0c9be",
              "surface-tint": "#E9C176",
              "on-secondary": "#003919",
              "secondary": "#004B23",
              "on-tertiary-fixed": "#001f24",
              "on-tertiary-container": "#00bdd3",
              "primary-fixed-dim": "#E9C176",
              "surface-container-low": "#1c1b1b",
              "surface-container-highest": "#353534",
              "outline": "#404941",
              "on-error-container": "#ffdad6",
              "secondary-fixed": "#93d6a0",
              "tertiary-fixed": "#9cf0ff",
              "surface-container": "#1C1B1B"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Inter"],
              "label": ["Manrope"]
            },
            borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            line-height: 1;
            text-transform: none;
            letter-spacing: normal;
            word-wrap: normal;
            white-space: nowrap;
            direction: ltr;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-background text-on-surface font-body selection:bg-primary selection:text-on-primary min-h-screen flex flex-col">
<!-- TopAppBar Shell -->
<header class="bg-[#131313] dark:bg-[#0E0E0E] flex justify-between items-center w-full px-8 py-4 max-w-none sticky top-0 z-50 bg-[#1C1B1B]">
<div class="flex items-center gap-12">
<span class="text-2xl font-bold tracking-tighter text-[#E9C176] uppercase font-headline">WPM Pitch</span>
<nav class="hidden md:flex items-center gap-8">
<a class="font-['Manrope'] text-sm tracking-tight font-semibold text-[#8A9389] hover:text-[#E0E0E0] uppercase transition-colors duration-200" href="#">Arena</a>
<a class="font-['Manrope'] text-sm tracking-tight font-semibold text-[#8A9389] hover:text-[#E0E0E0] uppercase transition-colors duration-200" href="#">Teams</a>
<a class="font-['Manrope'] text-sm tracking-tight font-semibold text-[#93D6A0] border-b-2 border-[#004B23] pb-1 uppercase transition-colors duration-200" href="#">Leaderboard</a>
</nav>
</div>
<div class="flex items-center gap-4">
<button class="material-symbols-outlined text-[#8A9389] hover:text-[#E9C176] scale-95 active:scale-90 transition-transform" data-icon="notifications">notifications</button>
<div class="w-8 h-8 rounded-lg overflow-hidden border border-outline-variant/15">
<img alt="User profile avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrdaw3lKhrhtjhs0_rDX-3HlkoP09bDfsEoP664YNXPL50PtgQA7esw8SLFJJQZDb8P6Gse9niEncx92pSfbjt2UHfG2zAVIgXTI9R38G1x3383h1jdVSkHtnRjUnF98HXmS0dcqsoX61ejve_2jX9wnzN8EissXm62Yy8nVIq88OfiN3dbBlyNmrRNaDMn6Gf8N6RHYYvxiVHy-lhqz6UwZAznrEinXG_9M6Tt4vTYBlT3sV9TdrEXEycwSEqkaLVwenlwTCStaE"/>
</div>
</div>
</header>
<main class="flex-grow w-full max-w-6xl mx-auto px-8 py-12 mb-24">
<!-- Header Section -->
<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
<div>
<span class="text-[#004B23] font-headline text-xs font-bold tracking-[0.3em] uppercase">Global Rankings</span>
<h1 class="text-6xl font-headline font-black tracking-tight mt-2 text-[#E9C176]">World Leaderboard</h1>
</div>
<!-- Timeframe Tabs -->
<div class="flex bg-[#1C1B1B] p-1.5 rounded-xl border border-outline-variant/10">
<button class="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 bg-[#2A2A2A] text-[#93D6A0] shadow-sm">Daily</button>
<button class="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 text-[#8A9389] hover:text-[#E0E0E0]">Weekly</button>
<button class="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 text-[#8A9389] hover:text-[#E0E0E0]">All-Time</button>
</div>
</div>
<!-- Top 3 Podium (Elite Bento) -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
<!-- Rank 2 -->
<div class="bg-[#1C1B1B] border border-outline-variant/10 rounded-2xl p-8 flex flex-col items-center justify-center order-2 md:order-1 relative overflow-hidden group">
<div class="absolute top-4 right-6 font-headline text-5xl font-black opacity-5 text-primary">2</div>
<div class="w-20 h-20 rounded-full mb-6 border-2 border-outline-variant/20 p-1.5 bg-[#2A2A2A]">
<img alt="Player 2" class="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFEQgyKkMWQy17k0ZONsigtSmMB3tjLfiDt_HHRa90u6N-aNZLkAtgxF28tJR6DS1I2S4LmdjvnHg9ank6QPfh3B3zFaZDbKyd-KECAQ_st_PZE0rJP131eWy7LGsMllW8g0a7Hlsnjy8ClUc8y-EF0rbJoBmVVmiEGJMKilJaD9BYaU3aMy5C0TlyBvQqE6OcyKOS3N97ObD_KhCZCOxBsAcOVrHEFKus-Cnpo7ElDmSwYR1Ug4IDlx8DvWxIPNS36tPt3_zBsP4"/>
</div>
<h3 class="text-xl font-bold font-headline text-[#E0E0E0]">VeloType_99</h3>
<span class="text-[10px] text-[#8A9389] uppercase tracking-[0.2em] mt-1.5 font-bold">Real Madrid</span>
<div class="mt-6 flex items-baseline gap-1.5">
<span class="text-4xl font-headline font-black text-[#E9C176]">142</span>
<span class="text-xs font-bold text-[#8A9389] tracking-widest">WPM</span>
</div>
</div>
<!-- Rank 1 (Champion) -->
<div class="bg-[#201F1F] border-2 border-[#004B23]/30 rounded-3xl p-10 flex flex-col items-center justify-center order-1 md:order-2 scale-105 relative overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
<div class="absolute inset-0 bg-gradient-to-b from-[#004B23]/10 to-transparent pointer-events-none"></div>
<div class="absolute top-4 right-8 font-headline text-7xl font-black text-[#004B23]/20">1</div>
<div class="w-28 h-28 rounded-full mb-8 border-4 border-[#E9C176] p-1.5 shadow-[0_0_50px_rgba(0,75,35,0.2)] bg-[#2A2A2A]">
<img alt="Player 1" class="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuc6rugf9jt-ZCJYmjHMuS_E3bojApK_M5P9i0xxku8UN-HjJu0zolze4kLfj2rUcJkkj8hwmyeTTlfZvgkwIXpf4lunpbB61m7PyweANZeU9HI8CEflx9xmJ4jQUZvyeAZUk11hZR_RjuoLWBK_R3TXR1Wk1-kSRgyVxiHXAvRxOtn7tc7Rhil8X3DsKPmgWBdG8i996M6BEKAnzbAaGCLV1fNCasddoXhQTESJVNFiGOExtBkXvffmIZrpgQLPthX5lBOD8LpMY"/>
</div>
<h3 class="text-3xl font-black font-headline text-[#E9C176] tracking-tight">KeyMaster_Pro</h3>
<span class="text-xs text-[#93D6A0] uppercase tracking-[0.3em] mt-2 font-black">Manchester City</span>
<div class="mt-8 flex items-baseline gap-2">
<span class="text-6xl font-headline font-black text-[#E9C176] drop-shadow-sm">158</span>
<span class="text-sm font-bold text-[#E9C176] tracking-widest">WPM</span>
</div>
<div class="mt-6 flex items-center gap-2 bg-[#004B23]/20 px-4 py-1.5 rounded-full border border-[#004B23]/30">
<span class="material-symbols-outlined text-[#93D6A0] text-sm" data-icon="trending_up">trending_up</span>
<span class="text-[10px] font-black text-[#93D6A0] uppercase tracking-widest">+2 Positions</span>
</div>
</div>
<!-- Rank 3 -->
<div class="bg-[#1C1B1B] border border-outline-variant/10 rounded-2xl p-8 flex flex-col items-center justify-center order-3 relative overflow-hidden">
<div class="absolute top-4 right-6 font-headline text-5xl font-black opacity-5 text-primary">3</div>
<div class="w-20 h-20 rounded-full mb-6 border-2 border-outline-variant/20 p-1.5 bg-[#2A2A2A]">
<img alt="Player 3" class="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvJA9JEltOgofnZ0Oyfuk1BVycwBTPu0rYeADxaI0O2ncdWHoCvgvVgb8pigltO7unG-Kh5fKJPlXcpQM9_fG65tLP291ttK7ARsTFuKbVwlRcHAlWCK-lVWo-wTbjBQpe3ahLxk1Fi4vnRwwKO89q06p1oVHp0pmyXSlJ91o6qyGmbGnvWCJDL7AFOywmKfb6auxi4kyt0qPCxYKdkFCH2apzsX6TcMlRTjeGGARsEnOpQlZq8sgL6c4R6juzFZh2NOwYoV8It54"/>
</div>
<h3 class="text-xl font-bold font-headline text-[#E0E0E0]">Shift_Queen</h3>
<span class="text-[10px] text-[#8A9389] uppercase tracking-[0.2em] mt-1.5 font-bold">FC Bayern</span>
<div class="mt-6 flex items-baseline gap-1.5">
<span class="text-4xl font-headline font-black text-[#E9C176]">139</span>
<span class="text-xs font-bold text-[#8A9389] tracking-widest">WPM</span>
</div>
</div>
</div>
<!-- Leaderboard Table -->
<div class="bg-[#1C1B1B] border border-outline-variant/10 rounded-2xl overflow-hidden mt-16 shadow-xl">
<div class="grid grid-cols-12 px-10 py-6 border-b border-outline-variant/10 text-[10px] uppercase tracking-[0.3em] font-black text-[#8A9389]">
<div class="col-span-1">Rank</div>
<div class="col-span-5">Player / Team</div>
<div class="col-span-2 text-center">Trend</div>
<div class="col-span-2 text-center text-primary/80">Accuracy</div>
<div class="col-span-2 text-right">Avg WPM</div>
</div>
<div class="flex flex-col">
<!-- Row 4 -->
<div class="grid grid-cols-12 px-10 py-6 items-center hover:bg-[#201F1F] transition-all duration-300 border-b border-outline-variant/5">
<div class="col-span-1 font-headline font-black text-xl text-[#E0E0E0]">04</div>
<div class="col-span-5 flex items-center gap-5">
<div class="w-12 h-12 rounded-lg bg-[#2A2A2A] border border-outline-variant/10 flex items-center justify-center overflow-hidden">
<img alt="Player 4" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDA4GV6rHh9aV2FCNOW7cygNB7NGVlV5oj35ja40BmudAc-yxT9gk1CZTtM3sXwwC6US6xHTM-Y8jj7PS-zbUaHTaRwaVepH1UWxcBaocT5r_gOgHiKBL_cBx1rdulxYCfx6Eyt1X7Cg1iXXoUD1JXFwSX7FqiZ1HW20MyBGMo-QdvRQrkIZb2Yzj65JEXb6orHEU2zJYqYghHDZkiIyHuY5wevqiIztLigk6WZBR_BIZNjvFTh3l7TTsn97cgiaF0YAGcM6x1BrzQ"/>
</div>
<div>
<div class="font-bold text-base text-[#E0E0E0]">TurboTyped</div>
<div class="text-[10px] text-[#8A9389] uppercase tracking-widest font-semibold">Liverpool FC</div>
</div>
</div>
<div class="col-span-2 flex justify-center">
<span class="material-symbols-outlined text-[#93D6A0] text-lg" data-icon="expand_less">expand_less</span>
</div>
<div class="col-span-2 text-center text-sm font-bold text-[#93D6A0]">98.4%</div>
<div class="col-span-2 text-right font-headline font-black text-2xl text-[#E9C176]">136</div>
</div>
<!-- Row 5 -->
<div class="grid grid-cols-12 px-10 py-6 items-center bg-[#181818] hover:bg-[#201F1F] transition-all duration-300 border-b border-outline-variant/5">
<div class="col-span-1 font-headline font-black text-xl text-[#8A9389]">05</div>
<div class="col-span-5 flex items-center gap-5">
<div class="w-12 h-12 rounded-lg bg-[#2A2A2A] border border-outline-variant/10 flex items-center justify-center overflow-hidden">
<img alt="Player 5" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAixqif8wkr6vOcqWzJa7zj5kxURFcpmuV5segPa1D_yYvaZcQ1VDJFXm7PSvutDRWDRHSGo3Js88iKV5vgi3k8fQ58ujkPf6hVCHFnpqjk7xtJlnCdrVBcoeoPJV28GN2G7g0sYVyuIAXDZP-db9uYlNoYpxpXCEze1JCK_DH74u8LBGUZafvd4I4Ux3g7iPqWdVNDKh8ZXdhriWVVTn2-8u3XujHZLIafrGa3mfprod3av4_QbAKOCmchqYUhuJS2eZdPGqEt4II"/>
</div>
<div>
<div class="font-bold text-base text-[#E0E0E0]">CaffeineCode</div>
<div class="text-[10px] text-[#8A9389] uppercase tracking-widest font-semibold">Arsenal</div>
</div>
</div>
<div class="col-span-2 flex justify-center">
<span class="material-symbols-outlined text-error text-lg" data-icon="expand_more">expand_more</span>
</div>
<div class="col-span-2 text-center text-sm font-bold text-[#93D6A0]">99.1%</div>
<div class="col-span-2 text-right font-headline font-black text-2xl text-[#E9C176]">134</div>
</div>
<!-- Row 6 -->
<div class="grid grid-cols-12 px-10 py-6 items-center hover:bg-[#201F1F] transition-all duration-300 border-b border-outline-variant/5">
<div class="col-span-1 font-headline font-black text-xl text-[#8A9389]">06</div>
<div class="col-span-5 flex items-center gap-5">
<div class="w-12 h-12 rounded-lg bg-[#2A2A2A] border border-outline-variant/10 flex items-center justify-center overflow-hidden">
<img alt="Player 6" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChFe3ACsTowC28n3DhxI632iExF2xH3ilmm-s47r5yri7xulsTHY4Ihdy-K9poFR7fBzXVh394zm5RvwXzsBrKAs-hA6-OfIpiaEg-k5ppWpZC5Fa9shTclypApR2QIFBUOX2FaD6TVIvJTWSDJFa_70deadywYNbgb0jnPcNek9ZoX0MHaweTY9GROwGMn213fKiH41eDfNCicG0doIDZIl4zlwJtQh0hYwJT_UWwOKlc8CQOFZ-2XRlBvAoGB6QRqQRh1sg4k28"/>
</div>
<div>
<div class="font-bold text-base text-[#E0E0E0]">SprintWriter</div>
<div class="text-[10px] text-[#8A9389] uppercase tracking-widest font-semibold">Paris SG</div>
</div>
</div>
<div class="col-span-2 flex justify-center">
<span class="material-symbols-outlined text-[#8A9389]/40 text-lg" data-icon="minimize">minimize</span>
</div>
<div class="col-span-2 text-center text-sm font-bold text-[#93D6A0]">97.8%</div>
<div class="col-span-2 text-right font-headline font-black text-2xl text-[#E9C176]">131</div>
</div>
<!-- Row 7 -->
<div class="grid grid-cols-12 px-10 py-6 items-center bg-[#181818] hover:bg-[#201F1F] transition-all duration-300">
<div class="col-span-1 font-headline font-black text-xl text-[#8A9389]">07</div>
<div class="col-span-5 flex items-center gap-5">
<div class="w-12 h-12 rounded-lg bg-[#2A2A2A] border border-outline-variant/10 flex items-center justify-center overflow-hidden">
<img alt="Player 7" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5U-39G2-AOqzv8x3v3Buw1kau4A4UIUnxubw4CMLAjtDsov59Kc0rMfJcK6o1GKJfDNLToKmvmBAEsdwdZdlJAd0IIZDsSLPPi3w_V3JoD86s0jFh-hYFg-TtR7JFSpcDIqA0Vw9C77ZRoW1_5AoXo6_ixist_Wt4Ypmz6-8FKUmSxSoKxPJ9EzbzhH-Fuu6gPWr2cSj45VPpo4R3Ykd9OyW-43-TwHlY0w4IaFZLKjCodEonhCfxAt0ih7IZnyzuqaOIFWQUtrk"/>
</div>
<div>
<div class="font-bold text-base text-[#E0E0E0]">GhostKeys</div>
<div class="text-[10px] text-[#8A9389] uppercase tracking-widest font-semibold">Juventus</div>
</div>
</div>
<div class="col-span-2 flex justify-center">
<span class="material-symbols-outlined text-[#93D6A0] text-lg" data-icon="expand_less">expand_less</span>
</div>
<div class="col-span-2 text-center text-sm font-bold text-[#93D6A0]">98.9%</div>
<div class="col-span-2 text-right font-headline font-black text-2xl text-[#E9C176]">129</div>
</div>
</div>
</div>
<!-- Pagination -->
<div class="flex justify-between items-center mt-10 px-4">
<span class="text-xs text-[#8A9389] uppercase tracking-[0.2em] font-bold">Top 100 Elite Players</span>
<div class="flex gap-3">
<button class="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1C1B1B] hover:bg-[#2A2A2A] border border-outline-variant/10 text-[#8A9389] transition-all duration-200">
<span class="material-symbols-outlined text-xl" data-icon="chevron_left">chevron_left</span>
</button>
<button class="w-10 h-10 rounded-lg flex items-center justify-center bg-[#004B23] text-[#93D6A0] font-black text-xs border border-[#004B23]/30">1</button>
<button class="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1C1B1B] hover:bg-[#2A2A2A] border border-outline-variant/10 text-[#8A9389] transition-all duration-200 font-black text-xs">2</button>
<button class="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1C1B1B] hover:bg-[#2A2A2A] border border-outline-variant/10 text-[#8A9389] transition-all duration-200">
<span class="material-symbols-outlined text-xl" data-icon="chevron_right">chevron_right</span>
</button>
</div>
</div>
</main>
<!-- Floating Current User Context Bar -->
<div class="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 z-40 pointer-events-none">
<div class="bg-[#201F1F]/95 text-[#E0E0E0] backdrop-blur-xl rounded-2xl p-5 flex items-center justify-between shadow-[0_24px_48px_rgba(0,0,0,0.6)] pointer-events-auto border border-[#E9C176]/20">
<div class="flex items-center gap-10">
<div class="flex flex-col">
<span class="text-[10px] font-black uppercase tracking-[0.3em] text-[#E9C176]">Your Rank</span>
<span class="font-headline font-black text-2xl italic leading-none mt-1 text-[#E0E0E0]">#1,284</span>
</div>
<div class="h-10 w-px bg-outline-variant/20"></div>
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg border border-[#E9C176]/30 overflow-hidden bg-[#2A2A2A]">
<img alt="Me" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJubAymiJSCq0ZzLp_PwuGr8SkHGmuVNGJbYP-6cMUVFy1wBmXWt5S_KCRx5OfjInKHTCXAVCt6BgVfursyKKgTjT_CXdPF_LtXYzLG6RL9BwwD3qrJHFx2ehxLSUVXPAVdHJAMqdTXeirKG4K9887JO-oaVmHYLBCxli-VRuiwxVBNlESxYgFamGyXMRkWk4I6eAdqFr8Biv2VvrcSfUmAI1aruf3JOqxffgUYHlumae9TEN6hdxigVzN8UJOkT1yzE86dnnPyQ4"/>
</div>
<div class="flex flex-col">
<span class="font-black text-sm tracking-tight">TheLastTyper (You)</span>
<span class="text-[10px] uppercase tracking-widest font-bold text-[#8A9389]">Chelsea FC</span>
</div>
</div>
</div>
<div class="flex items-center gap-10 px-4">
<div class="text-right">
<span class="text-[10px] font-black uppercase tracking-[0.3em] text-[#8A9389] block">Personal Best</span>
<span class="font-headline font-black text-2xl leading-none text-[#93D6A0]">94 <small class="text-xs font-bold uppercase tracking-widest text-[#8A9389] ml-1">WPM</small></span>
</div>
<button class="bg-[#004B23] text-[#93D6A0] px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-125 transition-all active:scale-95 border border-[#004B23]">Race Now</button>
</div>
</div>
</div>
<!-- BottomNavBar Shell -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 bg-[#1C1B1B]/90 backdrop-blur-2xl rounded-t-[2.5rem] border-t border-outline-variant/10 shadow-[0_-12px_48px_rgba(0,0,0,0.5)]">
<a class="flex flex-col items-center justify-center text-[#8A9389] opacity-70 px-5 py-2 hover:bg-[#2A2A2A] hover:opacity-100 rounded-2xl ease-out duration-300" href="#">
<span class="material-symbols-outlined mb-1.5" data-icon="sports_soccer">sports_soccer</span>
<span class="font-['Manrope'] text-[9px] font-black uppercase tracking-[0.2em]">Play</span>
</a>
<a class="flex flex-col items-center justify-center text-[#8A9389] opacity-70 px-5 py-2 hover:bg-[#2A2A2A] hover:opacity-100 rounded-2xl ease-out duration-300" href="#">
<span class="material-symbols-outlined mb-1.5" data-icon="groups">groups</span>
<span class="font-['Manrope'] text-[9px] font-black uppercase tracking-[0.2em]">Clubs</span>
</a>
<a class="flex flex-col items-center justify-center bg-[#2A2A2A] text-[#E9C176] rounded-2xl px-6 py-3 border border-[#E9C176]/20 ease-out duration-300" href="#">
<span class="material-symbols-outlined mb-1.5" data-icon="leaderboard" style="font-variation-settings: 'FILL' 1;">leaderboard</span>
<span class="font-['Manrope'] text-[9px] font-black uppercase tracking-[0.2em]">Rankings</span>
</a>
<a class="flex flex-col items-center justify-center text-[#8A9389] opacity-70 px-5 py-2 hover:bg-[#2A2A2A] hover:opacity-100 rounded-2xl ease-out duration-300" href="#">
<span class="material-symbols-outlined mb-1.5" data-icon="person">person</span>
<span class="font-['Manrope'] text-[9px] font-black uppercase tracking-[0.2em]">Profile</span>
</a>
</nav>
</body></html>