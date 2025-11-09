import { npcDatabase } from './npc-data.js';

// --- Pollinations.ai Helpers ---
const POLLINATIONS_API_BASE = 'https://image.pollinations.ai/prompt/';

const VARIATION_MODIFIERS = (function createModifiers() {
  const base = [
    "high contrast","soft grain","hyper-detailed","low poly","film noir lighting","surreal composition",
    "pastel palette","glitch effects","bokeh highlights","mirror symmetry","long exposure blur","ink sketch overlay",
    "neon rim lighting","faded vintage","hand painted texture","overexposed highlights","matte finish",
    "cinematic wide angle","macro perspective","isometric view"
  ];
  const adjectives = ["ethereal","gritty","minimal","vibrant","muted","luminescent","textured","weathered","polished","grainy","molten","iridescent","fractured","soft-focus","ultra-wide","telephoto","dreamlike","detailed","abstracted","retro","futuristic","baroque","ornate","skeletal","geometric","organic","nocturnal","sunlit","chromatic","monochrome","high-key","low-key","specular","matte","wet","dry","foggy","smoky","hazy","crisp","elastic","shimmering","pixelated","vectorized","photographic","analog-film","toy-camera","double-exposure","duotone","triadic","pastel-toned","neon-lit","blade-runner","industrial","rusted","chrome","inked","charcoal","watercolored","splattered","stippled","engraved","etched","laser-cut","folded","origami-style","paper-cut","collage","mosaic","tiled","kaleidoscopic","mirrored","reflected","distorted","warped","fractaled","recursive","minimalist","maximalist","psychedelic","lush","sparse","dense","airy","weighted","saturated","desaturated","bioluminescent","electric","pyrotechnic","celestial","alien","mechanical","organic","handmade"];
  const nouns = ["silhouette","texture","palette","grain","overlay","lighting","composition","vignette","rim-light","backlight","foreground","background","midground","tilt-shift","motion-blur","lens-flare","bloom","halation","specular-highlight","shadow-play","refraction","prism","moire","raster","vector","stencil","ink","wash","stain","brushwork","stroke","etching","engraving","mosaic","tile","fold","crease","crumple","tear","rip","stipple","halftone","grain-map","uv-map","normal-map","wireframe","spline","bevel","emboss","deboss","grain-overlay","scratch","scuff","patina","oxidation","rust","frost","condensation","smoke","steam","fog","haze","volumetric-light","god-rays","ambient-occlusion","rim-glow","neon-sign","holographic","chromatic-aberration","moire-pattern","pixel-cluster","grain-powder","brush-swipe","ink-blot","stain-pattern","tile-pattern","radial-pattern","linear-gradient","split-toning","color-blocking","posterized","screen-print","lithograph","engraver","etcher"];
  const set = new Set(base);
  let ai = 0, ni = 0;
  while (set.size < 220) {
    const a = adjectives[ai % adjectives.length];
    const n = nouns[ni % nouns.length];
    set.add(`${a} ${n}`);
    ai++; ni += (Math.floor(Math.random()*3)+1);
  }
  return Array.from(set);
})();

function pickVariations() {
  const count = Math.floor(Math.random() * 3) + 1; // 1..3 modifiers
  const picked = [];
  const pool = VARIATION_MODIFIERS.slice();
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked.join(', ');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFinalUrl(promptWithSeed) {
  while (true) {
    try {
      const resp = await fetch(POLLINATIONS_API_BASE + encodeURIComponent(promptWithSeed), { method: 'HEAD', redirect: 'follow' });
      if (resp && resp.url && resp.status < 400) return resp.url;
    } catch (e) {
      // ignore and retry
    }
    await sleep(600);
  }
}

function loadImage(url, timeout = 15000) {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const t = setTimeout(() => {
      if (!done) { done = true; resolve(false); img.src = ''; }
    }, timeout);
    img.onload = () => { if (!done) { done = true; clearTimeout(t); resolve(true); } };
    img.onerror = () => { if (!done) { done = true; clearTimeout(t); resolve(false); } };
    img.src = url;
  });
}
// --- End Pollinations.ai Helpers ---


class AudioPlayer {
    constructor() {
        this.audioContext = null;
        this.buffers = {};
        this.soundsLoaded = false;
    }

    _initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.loadSounds();
        }
    }

    async loadSound(name, url) {
        if (!this.audioContext) return;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.buffers[name] = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Failed to load sound: ${name}`, error);
        }
    }

    loadSounds() {
        if (this.soundsLoaded) return;
        this.loadSound('confirm', './button-press.mp3');
        this.loadSound('error', './error.mp3');
        this.soundsLoaded = true;
    }

    playSound(name) {
        this._initAudioContext(); // Ensure context is ready
        if (!this.buffers[name]) {
            console.warn(`Sound not found: ${name}`);
            return;
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers[name];
        source.connect(this.audioContext.destination);
        source.start(0);
    }
}

const game = {
    npcs: [],
    currentNPC: null,
    currentDialogueIndex: 0,
    healedNPCs: new Set(),
    unlockedNPCs: new Set(), // Unlocks are set in newGame/loadGame
    therapistMentalState: 0, // 0 to 100, lower is better
    currentPage: 0,
    journalPages: [],
    collectibles: [],
    radioPlaylist: 'https://youtube.com/playlist?list=PLPug0RGgea9rPoVpu8ytw7dRHLZb4RNZc&si=VqmXrovnWi-y_aj4',
    podcastLink: 'https://youtu.be/dLWHNiePR8g?si=EdHExHPDwkLz7NHi',
    pathSelfTimer: null,
    audioPlayer: new AudioPlayer(),
    startTime: null,
    gameTime: 0,
    timerInterval: null,
    chromaAwardGiven: false,
    previousScreen: 'habitat-view',
    conversationHistory: [],
    turnCount: 0,
    miniGameActive: false, // To track minigame state
    mapState: { // For Connection Map interactivity
        zoom: 1.0,
        panX: 0,
        panY: 0,
        isPanning: false,
        lastX: 0,
        lastY: 0,
        nodes: []
    },
    // Radio state and relationship system
    radioSource: null,
    bondScores: {}, // { [npcId]: number }
    ytPlayer: null,
    ytApiReady: false,

    // TTS audio element
    ttsAudio: null,
    // PiP state
    pathSelfFloatVisible: false,

    // --- Loader helpers ---
    showLoader() { document.getElementById('global-loader').style.display = 'flex'; },
    hideLoader() { document.getElementById('global-loader').style.display = 'none'; },

    async pollinationsImage(prompt) {
        let success = false;
        let finalUrl = '';
        while (!success) {
            const seed = Math.floor(Math.random() * 10000000) + 1;
            let combined = prompt;
            
            const variations = pickVariations();
            if (variations) combined += `, ${variations}`;
            
            const promptWithSeed = `${combined}?nologo=true&seed=${seed}`;
            
            const url = await fetchFinalUrl(promptWithSeed);
            const didLoad = await loadImage(url);
            
            if (didLoad) {
                finalUrl = url;
                success = true;
            } else {
                await sleep(600);
            }
        }
        return finalUrl;
    },

    init() {
        this.npcs = npcDatabase.filter(n => n.id !== 'unknown_fragment_8887');
        // this.renumberSessions(); // Respect explicit session numbers
        // Reorder and renumber sessions so that Judge Meridian, Eve Meta-Receptionist,
        // The Therapist's Shadow, and The Therapist are the last four (in that order),
        // and all sessions are sequentially numbered from 01 to the therapist's final number.
        this.reorderAndRenumber();

        // this.updateNPCGrid(); // DEPRECATED
        document.getElementById('send-response-btn').addEventListener('click', () => this.sendPlayerResponse());
        document.getElementById('player-response').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendPlayerResponse();
            }
        });
        document.getElementById('conclude-session-btn').addEventListener('click', () => this.concludeSession());
        // Safely bind radio and path-to-self buttons only if they exist
        const radioBtnEl = document.getElementById('radio-btn');
        if (radioBtnEl) radioBtnEl.addEventListener('click', () => this.openRadio());
        const pathBtnEl = document.getElementById('path-to-self-btn');
        if (pathBtnEl) pathBtnEl.addEventListener('click', () => this.openPathToSelf());
        document.getElementById('creator-generate-btn').addEventListener('click', () => this.generateCustomNpc());
        document.getElementById('creator-randomize-btn').addEventListener('click', () => this.generateRandomNpc());
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', () => this.audioPlayer.playSound('confirm'));
        });
        // Ensure non-.btn controls also play confirm sounds
        document.querySelectorAll('.send-btn, .map-btn').forEach(btn => {
            btn.addEventListener('click', () => this.audioPlayer.playSound('confirm'));
        });
        this.initMapControls();
        const fr = document.getElementById('floating-radio-btn');
        if (fr) fr.addEventListener('click', () => this.openRadio());
        const psfClose = document.getElementById('psf-close-btn');
        if (psfClose) psfClose.addEventListener('click', () => this.closePathSelfFloat());
        const psfToggle = document.getElementById('psf-toggle-btn');
        if (psfToggle) psfToggle.addEventListener('click', () => this.togglePathSelfFloat());

        const portraitEl = document.getElementById('npc-portrait');
        if (portraitEl) portraitEl.addEventListener('click', () => this.togglePatientBio());

        const bioCloseBtn = document.getElementById('pbw-close-btn');
        if (bioCloseBtn) bioCloseBtn.addEventListener('click', () => this.togglePatientBio(false));

        // Build initial menu roster for easy discovery
        const menuSearch = document.getElementById('menu-search');
        if (menuSearch) {
            menuSearch.addEventListener('input', () => this.updateMenuRosterView());
            this.updateMenuRosterView();
        }
        // Ensure TTS audio element exists
        this.ttsAudio = new Audio();
        this.ttsAudio.volume = 1.0;
    },

    newGame() {
        this.healedNPCs.clear();
        // Unlock all except the final four (awarded at Chroma Award time)
        const finalIds = new Set(['hackathon_judge','meta_receptionist','therapist_shadow','the_therapist']);
        this.unlockedNPCs = new Set(
            this.npcs
                .map((n, i) => ({ n, i }))
                .filter(item => !finalIds.has(item.n.id))
                .map(item => item.i)
        );
        this.therapistMentalState = 0;
        this.collectibles = [];
        this.currentPage = 0;
        this.startTime = Date.now();
        this.gameTime = 0;
        this.chromaAwardGiven = false;
        this.resetMapView();
        this.startTimer();
        this.showScreen('main-menu');
        this.updateMenuRosterView();
        this.updateStats();
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    updateNPCGrid() {
        // This function is deprecated and replaced by updateJournalView
    },

    startSession(npcIndex) {
        this.currentNPC = this.npcs[npcIndex];
        this.currentNPCIndex = npcIndex;
        this.turnCount = 0;
        const thoughtBubble = document.getElementById('npc-thought-bubble');
        if (thoughtBubble) thoughtBubble.style.display = 'none';
        // initialize bond for this npc if not present
        if (this.bondScores[this.currentNPC.id] == null) this.bondScores[this.currentNPC.id] = 0;
        
        document.getElementById('session-npc-name').textContent = this.currentNPC.name;
        document.getElementById('habitat-bg').style.backgroundImage = `url(${this.currentNPC.officeImage || this.currentNPC.habitat})`;
        const portraitEl = document.getElementById('npc-portrait');
        if (portraitEl) {
            portraitEl.src = this.currentNPC.officeImage || this.currentNPC.habitat;
            portraitEl.style.display = 'block';
        }
        
        this.conversationHistory = [];
        const systemMessage = {
            role: "system",
            content: `You are roleplaying as an NPC in a therapy session.
Dossier: ${JSON.stringify(this.currentNPC)}
Stay strictly in character as the patient. Reply in 1–3 sentences, reflective and specific to your crisis and origin. Occasionally reference imagery from your habitat/office to ground the scene. Do not give therapy; you are receiving it.`
        };
        this.conversationHistory.push(systemMessage);
        
        document.getElementById('patient-bio-window').style.display = 'none'; // Hide on new session start
        this.showDialogue(this.currentNPC.opening_statement);
        this.showScreen('therapy-session');
        document.getElementById('conclude-session-btn').style.display = 'none';
        document.getElementById('player-input-area').style.display = 'flex';
    },

    // Text-to-Speech: choose a voice per NPC and speak the line
    getVoiceForNPC(id) {
        const map = {
            // First 16 unlocked patients
            mira_healer: "en-female",
            byte_glitched_courier: "en-male",
            captain_loop: "en-male",
            daisy_exe: "en-female",
            rustjaw: "en-male",
            worm: "en-male",
            chess_bishop: "en-male",
            pebble: "en-male",
            glitch_exe: "en-female",
            wise_one_gerald: "en-male",
            captain_marcus: "en-male",
            music_android: "en-female",
            superhero_jake: "en-male",
            zombie: "en-male",
            cosmic_merchant: "en-female",
            puzzle_cube: "en-male",
            // Some later notable characters
            battle_royale_vendor: "en-male",
            aria_7: "en-female",
            racing_ghost: "en-male",
            healer: "en-female",
            tower_turret: "en-male",
            rogue_ai: "en-male",
            moth_king: "en-male",
            princess_melancholy: "en-female",
            wrestling_ferret: "en-male",
        };
        return map[id] || "en-male";
    },

    async speak(text, npcId) {
        try {
            const voice = this.getVoiceForNPC(npcId);
            const result = await websim.textToSpeech({ text, voice });
            if (!result || !result.url) return;
            if (!this.ttsAudio) this.ttsAudio = new Audio();
            this.ttsAudio.src = result.url;
            // Attempt to play; browsers may block autoplay without user gesture
            await this.ttsAudio.play().catch(() => {});
        } catch (e) {
            // Fail silently; keep session flowing
            console.warn("TTS failed:", e);
        }
    },

    async generateNpcResponse(isOpeningStatement = false) {
        const dialogueText = document.getElementById('dialogue');
        const choicesContainer = document.getElementById('choices');
        const typingIndicator = document.getElementById('typing-indicator');
        const playerInputArea = document.getElementById('player-input-area');

        dialogueText.textContent = '';
        choicesContainer.innerHTML = '';
        typingIndicator.style.display = 'block';
        playerInputArea.style.display = 'none';
        
        const historyForAI = this.conversationHistory.slice(-10); // Send last 10 messages
        // Add bond signal
        const bond = this.bondScores[this.currentNPC.id] || 0;
        const bondCue = {
            role: "system",
            content: `Meta note for the patient roleplay: Your trust toward the therapist is ${bond}/10. If higher, be slightly more open, reflective, and hopeful; if low, be guarded and terse.`
        };

        try {
            const completion = await websim.chat.completions.create({
                messages: [historyForAI[0] || {role:"system", content:""}, bondCue, ...historyForAI.slice(1)],
            });
            
            const responseText = completion.content;
            this.conversationHistory.push({ role: 'assistant', content: responseText });
            this.speak(responseText, this.currentNPC.id);
            this.typewriter(dialogueText, responseText, () => {
                typingIndicator.style.display = 'none';
                playerInputArea.style.display = 'flex';
                document.getElementById('player-response').focus();
            });

        } catch (error) {
            console.error("AI generation failed, using fallback.", error);
            const fallbackText = "I... I don't know what to say. The static is loud today."
            this.conversationHistory.push({ role: 'assistant', content: fallbackText });
            this.speak(fallbackText, this.currentNPC.id);
            this.typewriter(dialogueText, fallbackText, () => {
                typingIndicator.style.display = 'none';
                playerInputArea.style.display = 'flex';
                document.getElementById('player-response').focus();
            });
        }
    },

    typewriter(element, text, callback) {
        let i = 0;
        element.textContent = '';
        const speed = 30; 
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else if (callback) {
                callback();
            }
        }
        type();
    },

    async showDialogue(openingText) {
        const dialogueText = document.getElementById('dialogue');
        document.getElementById('speaker').textContent = 'PATIENT';

        this.conversationHistory.push({ role: 'assistant', content: openingText });
        this.speak(openingText, this.currentNPC.id);
        this.typewriter(dialogueText, openingText, () => {
            document.getElementById('player-input-area').style.display = 'flex';
            document.getElementById('player-response').focus();
        });
    },

    sendPlayerResponse() {
        const input = document.getElementById('player-response');
        const text = input.value.trim();
        if (!text) {
            this.audioPlayer.playSound('error');
            return;
        }

        this.conversationHistory.push({ role: 'user', content: text });
        input.value = '';

        this.turnCount++;

        // Update bond with AI analysis - Asynchronous operation
        this.updateBondWithAI(text).then(() => {
            // --- Interactive Session Trigger ---
            if (this.currentNPC.id === 'zombie' && this.turnCount === 2 && !this.miniGameActive) {
                this.startMemoryGame();
                return; // Stop normal flow to play the game
            }
            // --- End Interactive Session ---

            // Trigger thought image on turn 3 and 6
            if (this.turnCount === 3 || this.turnCount === 6) {
                this.generateThoughtImage();
            }

            // Allow earlier conclude if bond is strong
            if (this.turnCount >= 3 || this.bondScores[this.currentNPC.id] >= 3) {
                document.getElementById('conclude-session-btn').style.display = 'block';
            }
            
            this.generateNpcResponse();
        });
    },

    async concludeSession() {
        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator.style.display = 'block';
        document.getElementById('player-input-area').style.display = 'none';
        document.getElementById('conclude-session-btn').style.display = 'none';
        document.getElementById('dialogue').textContent = 'Analyzing session...';

        const bond = this.bondScores[this.currentNPC.id] || 0;
        const analysisPrompt = {
            role: "system",
            content: `Analyze the following therapy session transcript. Based on the conversation, has the patient shown signs of a breakthrough?
Bond score (0-10) between therapist and patient: ${bond}.
If bond is high, weight openness/insight more strongly.
Respond with only a JSON object with three keys: "breakthrough" (boolean), "summary" (a one-sentence summary of the patient's final state), and "item_prompt" (a concise, descriptive prompt for an image generator).
Example: {"breakthrough": true, "summary": "The patient has accepted that their value is not defined by their function.", "item_prompt": "A single, glowing gear crafted from polished wood, sitting on a velvet cushion, representing newfound purpose."}`
        };

        try {
            const completion = await websim.chat.completions.create({
                messages: [analysisPrompt, ...this.conversationHistory.slice(1)], // Exclude initial system prompt
                json: true,
            });

            const result = JSON.parse(completion.content);

            if (result.breakthrough) {
                this.healedNPCs.add(this.currentNPCIndex);
                this.therapistMentalState += 5; // Taking on trauma
                this.updateTherapistState();
                this.unlockNPCs();
                alert(`✨ Session Complete: Breakthrough achieved!\n\nSummary: ${result.summary}`);
                this.generateCollectible(result.item_prompt);
            } else {
                this.therapistMentalState += 2;
                this.updateTherapistState();
                alert(`SESSION NOTE: No breakthrough achieved this time.\n\nSummary: ${result.summary}`);
            }
        } catch (error) {
            console.error("Session analysis failed:", error);
            alert("Could not analyze session. Ending session without a definitive breakthrough.");
        } finally {
            this.exitSession();
        }
    },

    // --- Memory Minigame Implementation ---
    startMemoryGame() {
        this.miniGameActive = true;
        const dialogueText = document.getElementById('dialogue');
        const playerInputArea = document.getElementById('player-input-area');
        const gameContainer = document.getElementById('memory-game-container');
        
        playerInputArea.style.display = 'none';
        this.typewriter(dialogueText, "Fragments... images... flashing in my head. They feel... important. Can you help me match them?");

        const emojis = ['🏠', '❤️', '🧠', '🍽️', '🏠', '❤️', '🧠', '🍽️'];
        emojis.sort(() => Math.random() - 0.5); // Shuffle

        gameContainer.innerHTML = '';
        gameContainer.style.display = 'grid';

        emojis.forEach(emoji => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.emoji = emoji;
            card.innerHTML = `
                <div class="card-face card-front">?</div>
                <div class="card-face card-back">${emoji}</div>
            `;
            card.addEventListener('click', () => this.handleCardClick(card));
            gameContainer.appendChild(card);
        });

        this.memoryGameState = {
            flippedCards: [],
            matchedPairs: 0,
            totalPairs: emojis.length / 2,
            isLocked: false,
        };
    },

    handleCardClick(card) {
        if (this.memoryGameState.isLocked || card.classList.contains('flipped')) return;

        card.classList.add('flipped');
        this.memoryGameState.flippedCards.push(card);

        if (this.memoryGameState.flippedCards.length === 2) {
            this.memoryGameState.isLocked = true;
            const [card1, card2] = this.memoryGameState.flippedCards;

            if (card1.dataset.emoji === card2.dataset.emoji) {
                // Match
                this.memoryGameState.matchedPairs++;
                this.memoryGameState.flippedCards = [];
                this.memoryGameState.isLocked = false;
                if (this.memoryGameState.matchedPairs === this.memoryGameState.totalPairs) {
                    setTimeout(() => this.endMemoryGame(true), 1000);
                }
            } else {
                // No match
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    this.memoryGameState.flippedCards = [];
                    this.memoryGameState.isLocked = false;
                }, 1500);
            }
        }
    },

    endMemoryGame(success) {
        const gameContainer = document.getElementById('memory-game-container');
        const dialogueText = document.getElementById('dialogue');
        gameContainer.style.display = 'none';
        this.miniGameActive = false;

        let outcomeText = '';
        let systemNote = '';

        if (success) {
            outcomeText = "The images... they connect. I... I remember. Thank you. It feels a little clearer now.";
            systemNote = "(Therapist's Note: The patient responded well to the memory exercise, successfully matching the pairs. This seems to have a calming effect.)";
        } else {
             // This simple version always succeeds, but failure logic could be added here.
            outcomeText = "It's still so fuzzy... but thank you for trying.";
            systemNote = "(Therapist's Note: The memory exercise was attempted.)";
        }

        this.conversationHistory.push({ role: 'system', content: systemNote });
        this.conversationHistory.push({ role: 'assistant', content: outcomeText });
        this.speak(outcomeText, this.currentNPC.id);
        this.typewriter(dialogueText, outcomeText, () => {
             document.getElementById('player-input-area').style.display = 'flex';
             document.getElementById('player-response').focus();
        });
    },
    // --- End Minigame ---
    
    async generateCollectible(prompt) {
        alert(`The patient left something for you... Generating a symbolic item.`);
        this.showLoader();
        const url = await this.pollinationsImage(`${prompt}, digital art, symbolic object, plain background`);
        this.collectibles.push({ npc: this.currentNPC.name, image: url, prompt });
        this.hideLoader();
        console.log("New collectible:", url);
    },

    updateTherapistState() {
        const overlay = document.getElementById('therapist-office-overlay');
        const degradation = this.therapistMentalState / 200; // Max 0.5 opacity
        overlay.style.opacity = degradation;

        const officeView = document.getElementById('therapist-office-view');
        if (officeView) {
            if (this.therapistMentalState > 40) {
                const glitchIntensity = (this.therapistMentalState - 40) / 60; // from 0 to 1
                officeView.style.setProperty('--glitch-intensity', glitchIntensity);
                officeView.classList.add('glitching');
            } else {
                officeView.classList.remove('glitching');
            }
        }
        
        const thoughts = [
            "The silence is heavy today. The faint hum of the server is the only company.", // 0-20
            "Their stories are starting to weigh on me. So many broken pieces of code.", // 21-40
            "I see glitches in the corner of my eye. Are they real?", // 41-60
            "My own thoughts feel... fragmented. Echoes of their pain.", // 61-80
            "Am I the therapist, or am I the patient? The line is blurring." // 81+
        ];
        const thoughtIndex = Math.floor(this.therapistMentalState / 20);
        const thoughtsEl = document.getElementById('therapist-thoughts');
        if (thoughtsEl) {
            thoughtsEl.textContent = thoughts[Math.min(thoughtIndex, thoughts.length - 1)];
        }
    },

    unlockNPCs() {
        // Unlock one new NPC for every 2 healed
        const unlockedCount = Math.floor(this.healedNPCs.size / 2);
        const baseUnlocked = 4; // Initial count
        
        for(let i=0; i < baseUnlocked + unlockedCount && i < this.npcs.length; i++) {
            if(!this.unlockedNPCs.has(i)) {
                this.unlockedNPCs.add(i);
                alert(`A new patient file has appeared on your desk: ${this.npcs[i].name}`);
            }
        }
        // Refresh rosters on main menu
        this.updateMenuRosterView();
    },

    makeChoice(choice) {
       // This function is now deprecated in favor of free-form input.
       // It can be removed or left for future alternative gameplay modes.
    },

    exitSession() {
        this.updateStats();
        this.updateMenuRosterView();
        document.getElementById('patient-bio-window').style.display = 'none'; // Also hide on exit
        this.showScreen('main-menu');
    },

    updateStats() {
        const healed = this.healedNPCs.size;
        const total = this.npcs.length;
        const mh = document.getElementById('menu-healed');
        const mt = document.getElementById('menu-total');
        if (mh) mh.textContent = healed;
        if (mt) mt.textContent = total;
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            const timeEl = document.getElementById('game-time');
            if (timeEl) {
                timeEl.textContent = 
                    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
            
            if (this.gameTime >= 1200 && !this.chromaAwardGiven) { // 20 minutes
                this.showChromaAward();
            }
        }, 1000);
    },

    showChromaAward() {
        this.chromaAwardGiven = true;
        const popup = document.getElementById('award-popup');
        popup.classList.add('active');
        // Award the last four characters as prizes: Judge, Eve, Shadow, Therapist
        ['hackathon_judge','meta_receptionist','therapist_shadow','the_therapist'].forEach((id) => {
            const idx = this.npcs.findIndex(n => n.id === id);
            if (idx !== -1) this.unlockedNPCs.add(idx);
        });
        setTimeout(() => {
            popup.classList.remove('active');
            this.updateMenuRosterView();
        }, 5000);
    },

    showJournal() {
        // This is deprecated in favor of the main journal view.
        this.showScreen('journal-view');
    },

    showCharacterCreator() {
        document.getElementById('creator-preview-content').innerHTML = `<p class="placeholder-text">Your new patient will appear here...</p>`;
        this.showScreen('main-menu'); // Show behind modal
        document.getElementById('character-creator-modal').classList.add('active');
    },

    async generateCustomNpc() {
        const prompt = document.getElementById('creator-prompt').value.trim();
        if (!prompt) {
            alert("Please provide a prompt for the new NPC.");
            this.audioPlayer.playSound('error');
            return;
        }

        const loader = document.getElementById('creator-loader');
        const preview = document.getElementById('creator-preview-content');
        const generateBtn = document.getElementById('creator-generate-btn');

        loader.style.display = 'block';
        preview.innerHTML = '';
        generateBtn.disabled = true;
        this.showLoader();

        try {
            const systemPrompt = `Based on the user's prompt, generate a JSON object for a new NPC patient. The JSON must have these exact keys: "name" (a creative name), "origin" (the type of game they are from), "crisis" (a one-sentence existential crisis based on the prompt). User prompt: "${prompt}"`;
            
            const detailsCompletion = await websim.chat.completions.create({
                messages: [{ role: "system", content: systemPrompt }],
                json: true,
            });
            const npcDetails = JSON.parse(detailsCompletion.content);

            const imageUrl = await this.pollinationsImage(`pixel art therapy office portrait of: ${prompt}`);

            this.addNewNpc(npcDetails.name, npcDetails.origin, npcDetails.crisis, imageUrl, prompt);
            this.displayNpcPreview(npcDetails.name, imageUrl, npcDetails.crisis);
        
        } catch (error) {
            console.error("Failed to generate custom NPC:", error);
            alert("The consciousness failed to coalesce. Please try a different prompt.");
            preview.innerHTML = `<p class="placeholder-text">Error during generation.</p>`;
        } finally {
            loader.style.display = 'none';
            generateBtn.disabled = false;
            this.hideLoader();
        }
    },

    async generateRandomNpc() {
        const loader = document.getElementById('creator-loader');
        const preview = document.getElementById('creator-preview-content');
        const randomizeBtn = document.getElementById('creator-randomize-btn');

        loader.style.display = 'block';
        preview.innerHTML = '';
        randomizeBtn.disabled = true;
        this.showLoader();

        try {
            const systemPrompt = `Generate a JSON object for a completely new, random NPC patient for a therapy game. The JSON must have these exact keys: "name" (a creative name), "origin" (the type of game they are from, e.g., 'Forgotten 90s Platformer', 'Obscure Puzzle Game'), "crisis" (a one-sentence existential crisis), and "image_prompt" (a concise prompt for a pixel art image of them in a therapy office). Be creative and melancholic.`;
            
            const detailsCompletion = await websim.chat.completions.create({
                messages: [{ role: "system", content: systemPrompt }],
                json: true,
            });
            const npcDetails = JSON.parse(detailsCompletion.content);

            const imageUrl = await this.pollinationsImage(npcDetails.image_prompt || `pixel art therapy office portrait: ${npcDetails.name}`);

            this.addNewNpc(npcDetails.name, npcDetails.origin, npcDetails.crisis, imageUrl, npcDetails.crisis);
            this.displayNpcPreview(npcDetails.name, imageUrl, npcDetails.crisis);

        } catch (error) {
            console.error("Failed to generate random NPC:", error);
            alert("A random consciousness could not be reached. Please try again.");
            preview.innerHTML = `<p class="placeholder-text">Error during generation.</p>`;
        } finally {
            loader.style.display = 'none';
            randomizeBtn.disabled = false;
            this.hideLoader();
        }
    },

    addNewNpc(name, origin, crisis, imageUrl, openingStatement) {
        const newNpc = {
            id: `custom_${this.npcs.length + 1}`,
            name: name,
            session: `Session ${this.npcs.length + 1}`,
            origin: origin,
            habitat: imageUrl, // Use same for both for simplicity
            officeImage: imageUrl,
            crisis: crisis,
            opening_statement: openingStatement.length > 150 ? crisis : openingStatement, // Use crisis if statement is too long
        };
        this.npcs.push(newNpc);
        this.unlockedNPCs.add(this.npcs.length - 1);
        this.updateJournalView();
        alert(`New Patient Added: ${name}`);
    },

    displayNpcPreview(name, imageUrl, crisis) {
        const preview = document.getElementById('creator-preview-content');
        preview.innerHTML = `
            <img src="${imageUrl}" alt="Portrait of ${name}">
            <h4>${name}</h4>
            <p><strong>Crisis:</strong> ${crisis}</p>
        `;
    },

    showCredits() {
        this.previousScreen = document.querySelector('.screen.active').id || 'main-menu';
        this.showScreen('credits');
    },

    showConnectionMap() {
        this.previousScreen = document.querySelector('.screen.active').id;
        this.showScreen('connection-map');
        this.renderConnectionMap();
    },

    renderConnectionMap() {
        const canvas = document.getElementById('map-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.4;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(this.mapState.zoom, this.mapState.zoom);
        ctx.translate(-centerX + this.mapState.panX, -centerY + this.mapState.panY);
        
        const unlockedNodes = this.npcs
            .map((npc, i) => ({ npc, index: i}))
            .filter(item => this.unlockedNPCs.has(item.index));

        const nodePositions = unlockedNodes.map((item, i) => {
            const angle = (i / unlockedNodes.length) * Math.PI * 2;
            return {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                npc: item.npc,
                index: item.index,
                healed: this.healedNPCs.has(item.index)
            };
        });
        
        this.mapState.nodes = nodePositions;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        nodePositions.forEach((pos1, i) => {
            nodePositions.forEach((pos2, j) => {
                if (i < j && (pos1.index + pos2.index) % 5 < 2) { // Consistent but sparse connections
                    ctx.beginPath();
                    ctx.moveTo(pos1.x, pos1.y);
                    ctx.lineTo(pos2.x, pos2.y);
                    ctx.stroke();
                }
            });
        });
        
        nodePositions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = pos.healed ? '#4CAF50' : '#fff';
            ctx.fill();
        });

        ctx.restore();
    },

    resetMapView() {
        this.mapState.zoom = 1.0;
        this.mapState.panX = 0;
        this.mapState.panY = 0;
        this.renderConnectionMap();
    },

    initMapControls() {
        const canvas = document.getElementById('map-canvas');
        const tooltip = document.getElementById('map-tooltip');

        canvas.addEventListener('mousemove', (e) => {
            if (this.mapState.isPanning) {
                const dx = (e.clientX - this.mapState.lastX) / this.mapState.zoom;
                const dy = (e.clientY - this.mapState.lastY) / this.mapState.zoom;
                this.mapState.panX += dx;
                this.mapState.panY += dy;
                this.mapState.lastX = e.clientX;
                this.mapState.lastY = e.clientY;
                this.renderConnectionMap();
            }

            // Tooltip logic
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            let hoveredNode = null;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            for (const node of this.mapState.nodes) {
                // Transform node coords to screen coords
                const screenX = centerX + (node.x - centerX + this.mapState.panX) * this.mapState.zoom;
                const screenY = centerY + (node.y - centerY + this.mapState.panY) * this.mapState.zoom;

                const distance = Math.sqrt((mouseX - screenX) ** 2 + (mouseY - screenY) ** 2);
                if (distance < 6 * this.mapState.zoom) {
                    hoveredNode = node;
                    break;
                }
            }

            if (hoveredNode) {
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.clientX + 15}px`;
                tooltip.style.top = `${e.clientY + 15}px`;
                tooltip.textContent = hoveredNode.npc.name;
            } else {
                tooltip.style.display = 'none';
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            this.mapState.isPanning = true;
            this.mapState.lastX = e.clientX;
            this.mapState.lastY = e.clientY;
        });

        canvas.addEventListener('mousedown', (e) => {
            this.mapState.isPanning = true;
            this.mapState.lastX = e.clientX;
            this.mapState.lastY = e.clientY;
        });

        canvas.addEventListener('mouseup', () => { this.mapState.isPanning = false; });
        canvas.addEventListener('mouseleave', () => { this.mapState.isPanning = false; });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
            const centerX = canvas.width / 2, centerY = canvas.height / 2;
            for (const node of this.mapState.nodes) {
                const screenX = centerX + (node.x - centerX + this.mapState.panX) * this.mapState.zoom;
                const screenY = centerY + (node.y - centerY + this.mapState.panY) * this.mapState.zoom;
                const distance = Math.hypot(mouseX - screenX, mouseY - screenY);
                if (distance < 8 * this.mapState.zoom) { this.startSession(node.index); break; }
            }
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomAmount = 0.1;
            const mouseX = e.clientX - canvas.getBoundingClientRect().left;
            const mouseY = e.clientY - canvas.getBoundingClientRect().top;
            
            const wheel = e.deltaY < 0 ? 1 : -1;
            const zoom = Math.exp(wheel * zoomAmount);
            const newZoom = Math.max(0.5, Math.min(3, this.mapState.zoom * zoom));

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Adjust pan to zoom towards mouse cursor
            this.mapState.panX -= (mouseX - centerX) / (this.mapState.zoom * zoom) - (mouseX - centerX) / this.mapState.zoom;
            this.mapState.panY -= (mouseY - centerY) / (this.mapState.zoom * zoom) - (mouseY - centerY) / this.mapState.zoom;
            
            this.mapState.zoom = newZoom;
            this.renderConnectionMap();
        });
    },

    returnToGame() {
        this.showScreen(this.previousScreen || 'journal-view');
    },

    saveGame() {
        const saveData = {
            healed: Array.from(this.healedNPCs),
            unlocked: Array.from(this.unlockedNPCs),
            mentalState: this.therapistMentalState,
            collectibles: this.collectibles,
            time: this.gameTime,
            award: this.chromaAwardGiven
        };
        
        const saveCode = btoa(JSON.stringify(saveData));
        document.getElementById('save-code').value = saveCode;
        document.getElementById('save-modal').classList.add('active');
    },

    copySaveCode() {
        const input = document.getElementById('save-code');
        input.select();
        document.execCommand('copy');
        alert('Save code copied to clipboard!');
    },

    showLoadModal() {
        document.getElementById('load-modal').classList.add('active');
    },

    loadGame() {
        try {
            const code = document.getElementById('load-code').value;
            if (!code) throw new Error("No code entered.");
            const saveData = JSON.parse(atob(code));
            
            this.healedNPCs = new Set(saveData.healed || []);
            // Respect saved unlocks; if none, default to all except final four
            if (saveData.unlocked && saveData.unlocked.length > 0) {
                this.unlockedNPCs = new Set(saveData.unlocked);
            } else {
                const finalIds = new Set(['hackathon_judge','meta_receptionist','therapist_shadow','the_therapist']);
                this.unlockedNPCs = new Set(
                    this.npcs
                        .map((n, i) => ({ n, i }))
                        .filter(item => !finalIds.has(item.n.id))
                        .map(item => item.i)
                );
            }
            this.therapistMentalState = saveData.mentalState || 0;
            this.collectibles = saveData.collectibles || [];
            this.gameTime = saveData.time || 0;
            this.chromaAwardGiven = saveData.award || false;
            this.startTime = Date.now() - (this.gameTime * 1000);
            
            this.startTimer();
            this.closeModal('load-modal');
            this.showScreen('journal-view');
            this.updateStats();
            this.updateJournalView();
            this.updateTherapistState();
            
            alert('Game loaded successfully!');
        } catch (e) {
            alert('Invalid save code. Please check and try again.');
        }
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        if (modalId === 'radio-modal' && this.ytPlayer) {
            this.ytPlayer.stopVideo();
            // Destroy the player so it's fresh next time
            this.ytPlayer.destroy();
            this.ytPlayer = null;
        }
        if (modalId === 'path-to-self-modal') {
            if (this.pathSelfTimer) clearTimeout(this.pathSelfTimer);
            document.getElementById('path-to-self-iframe').src = 'about:blank';
        }
    },

    endGame() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const healedCount = this.healedNPCs.size;
        const totalCount = this.npcs.length;
        const percentage = totalCount > 0 ? Math.round((healedCount / totalCount) * 100) : 0;
        
        document.getElementById('ending-healed').textContent = healedCount;
        document.getElementById('ending-total').textContent = totalCount;
        document.getElementById('ending-rate').textContent = percentage + '%';
        
        let title, message;
        if (percentage >= 90) {
            title = 'MASTER THERAPIST';
            message = 'You have shown exceptional skill in helping digital beings find their purpose. The NPCs you\'ve healed will carry their newfound understanding throughout their programmed existence.';
        } else if (percentage >= 70) {
            title = 'SKILLED PRACTITIONER';
            message = 'Your therapy sessions have brought relief to many digital consciousness. While not all could be healed, your efforts have made a significant impact on their existential struggles.';
        } else if (percentage >= 50) {
            title = 'LEARNING THERAPIST';
            message = 'You\'ve made progress in understanding the unique challenges faced by NPCs. With more practice, you could help even more digital beings find meaning in their coded lives.';
        } else {
            title = 'NOVICE COUNSELOR';
            message = 'The path to healing digital consciousness is complex. Each NPC carries their own unique burden of awareness. Perhaps another approach would yield better results.';
        }
        
        document.getElementById('ending-title').textContent = title;
        document.getElementById('ending-message').textContent = message;
        
        this.showScreen('ending');
    },

    returnToMenu() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.showScreen('main-menu');
    },

    openRadio() {
        if (!this.radioSource) this.radioSource = this.radioPlaylist;
        document.getElementById('radio-modal').classList.add('active');

        if (this.ytApiReady) {
            this.createYtPlayer();
        } else {
            console.log("YouTube API not ready yet, waiting...");
        }
    },
    
    createYtPlayer() {
        if (this.ytPlayer) {
            this.ytPlayer.destroy();
        }

        // The iframe is now in the HTML, so we just need to create a player instance for it.
        this.ytPlayer = new YT.Player('radio-player', {
            events: {
                'onReady': (event) => {
                    event.target.setShuffle(true);
                    event.target.playVideoAt(0); // Play the first video of the shuffled playlist
                    event.target.unMute();
                },
            }
        });
    },

    openPathToSelf() {
        this.showPathSelfFloat('https://uxwq0l0o2qi9.space.minimax.io/');
        if (this.pathSelfTimer) clearTimeout(this.pathSelfTimer);
        this.pathSelfTimer = setTimeout(() => {
            alert('A strange signal is interfering with your radio...');
            this.audioPlayer.playSound('confirm');
            this.pathSelfTimer = null;
            this.radioSource = this.podcastLink;
            if (document.getElementById('radio-modal').classList.contains('active')) this.openRadio();
        }, 20 * 60 * 1000); // 20 minutes
    },

    showPathSelfFloat(url) {
        const container = document.getElementById('path-self-float');
        const iframe = document.getElementById('path-self-float-iframe');
        if (!container || !iframe) return;
        iframe.src = url || 'about:blank';
        container.style.display = 'block';
        this.pathSelfFloatVisible = true;
        document.body.classList.add('pip-open');
        const fr = document.getElementById('floating-radio-btn');
        if (fr) fr.classList.add('with-pip');
        // Ensure initial non-maximized state
        container.classList.remove('max');
        document.body.classList.remove('pip-max');
        const fr2 = document.getElementById('floating-radio-btn');
        if (fr2) fr2.classList.remove('max');
        // Update toggle icon
        const psfToggle = document.getElementById('psf-toggle-btn');
        if (psfToggle) psfToggle.textContent = '⤢';
    },

    closePathSelfFloat() {
        const container = document.getElementById('path-self-float');
        const iframe = document.getElementById('path-self-float-iframe');
        if (iframe) iframe.src = 'about:blank';
        if (container) {
            container.style.display = 'none';
            container.classList.remove('max');
        }
        this.pathSelfFloatVisible = false;
        document.body.classList.remove('pip-open');
        document.body.classList.remove('pip-max');
        const fr = document.getElementById('floating-radio-btn');
        if (fr) {
            fr.classList.remove('with-pip');
            fr.classList.remove('max');
        }
    },

    togglePathSelfFloat() {
        const container = document.getElementById('path-self-float');
        if (!container || !this.pathSelfFloatVisible) return;
        const isMax = container.classList.toggle('max');
        const fr = document.getElementById('floating-radio-btn');
        if (fr) {
            if (isMax) fr.classList.add('max');
            else fr.classList.remove('max');
        }
        // Body class to adjust dialogue positioning
        if (isMax) document.body.classList.add('pip-max');
        else document.body.classList.remove('pip-max');
        // Update toggle icon title
        const psfToggle = document.getElementById('psf-toggle-btn');
        if (psfToggle) {
            psfToggle.textContent = isMax ? '⤡' : '⤢';
            psfToggle.title = isMax ? 'Minimize' : 'Maximize';
        }
    },

    async generateThoughtImage() {
        const thoughtBubble = document.getElementById('npc-thought-bubble');
        const imageContainer = document.getElementById('npc-thought-image-container');
        const spinner = thoughtBubble.querySelector('.thought-bubble-spinner');

        if (!thoughtBubble || !imageContainer || !spinner) return;

        thoughtBubble.style.display = 'flex';
        imageContainer.innerHTML = '';
        spinner.style.display = 'block';

        try {
            const lastFewMessages = this.conversationHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
            
            const systemPrompt = `Based on the NPC's core crisis and the recent conversation, create a short, symbolic, visual prompt for an image generator that represents the NPC's current inner state. The prompt should be abstract and metaphorical. Respond with only the prompt text, no extra words.
            
            NPC Crisis: ${this.currentNPC.crisis}
            Conversation Snippet:
            ${lastFewMessages}
            
            Example visual prompt: "a cracked porcelain mask floating in murky water"`;

            const promptCompletion = await websim.chat.completions.create({
                messages: [{ role: "system", content: systemPrompt }],
            });

            let imagePrompt = promptCompletion.content;
            
            // Add style keywords
            imagePrompt = `pixel art, emotional, symbolic art, ${imagePrompt}`;

            // Using websim.imageGen as it's the newer API
            const result = await websim.imageGen({ prompt: imagePrompt, aspect_ratio: "4:3" });

            if (result && result.url) {
                const img = new Image();
                img.onload = () => {
                    spinner.style.display = 'none';
                    imageContainer.innerHTML = '';
                    imageContainer.appendChild(img);
                };
                img.src = result.url;
            } else {
                throw new Error("Image generation failed to return a URL.");
            }

        } catch (error) {
            console.error("Failed to generate thought image:", error);
            // Hide the bubble on failure to avoid clutter
            thoughtBubble.style.display = 'none';
        }
    },

    togglePatientBio(forceShow) {
        const bioWindow = document.getElementById('patient-bio-window');
        if (!bioWindow || !this.currentNPC) return;

        const isVisible = bioWindow.style.display === 'flex';

        if (forceShow === false || isVisible) {
            bioWindow.style.display = 'none';
        } else {
            // Populate and show
            const contentEl = document.getElementById('pbw-content');
            contentEl.innerHTML = `
                <h4>${this.currentNPC.name}</h4>
                <p><strong>Origin:</strong> ${this.currentNPC.origin}</p>
                <p><strong>Declared Crisis:</strong> ${this.currentNPC.crisis}</p>
            `;
            bioWindow.style.display = 'flex';
            this.audioPlayer.playSound('confirm');
        }
    },

    showCollectibles() {
        const grid = document.getElementById('collectibles-grid');
        grid.innerHTML = '';

        if (this.collectibles.length === 0) {
            grid.innerHTML = '<p>No collectibles yet. Heal patients to receive symbolic items.</p>';
        } else {
            this.collectibles.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'collectible-item';
                itemEl.innerHTML = `
                    <img src="${item.image}" alt="${item.prompt}">
                    <p>${item.npc}</p>
                `;
                grid.appendChild(itemEl);
            });
        }

        document.getElementById('collectibles-modal').classList.add('active');
    },

    // --- Journal Navigation ---
    updateJournalView() {
        // Build roster grid for quick discovery
        const grid = document.getElementById('roster-grid');
        const search = document.getElementById('roster-search');
        if (!grid) return;
        const blackoutIds = new Set(['hackathon_judge','meta_receptionist','therapist_shadow','the_therapist']);
        const filterText = (search?.value || '').toLowerCase();
        grid.innerHTML = '';

        const items = this.npcs
            .map((npc, index) => ({ npc, index }))
            .filter(item => this.unlockedNPCs.has(item.index) && (
                !filterText || [item.npc.name, item.npc.origin, item.npc.crisis].some(s => String(s).toLowerCase().includes(filterText))
            ));
        // Sort: normal sessions first, 49–51 at bottom, Final Session last
        items.sort((a, b) => {
            const af = a.npc.session === 'Final Session';
            const bf = b.npc.session === 'Final Session';
            if (af && !bf) return 1;
            if (!af && bf) return -1;
            const an = parseInt(a.npc.session.split(' ')[1]);
            const bn = parseInt(b.npc.session.split(' ')[1]);
            return (an - bn) || (a.index - b.index);
        });

        if (items.length === 0) {
            grid.innerHTML = '<p style="opacity:0.7;">No matching patients.</p>';
        } else {
            items.forEach(({ npc, index }) => {
                const isUnlocked = this.unlockedNPCs.has(index);
                const isHealed = this.healedNPCs.has(index);
                const blackout = blackoutIds.has(npc.id) && !isUnlocked;
                const card = document.createElement('div');
                card.className = `roster-card ${isHealed ? 'healed' : ''} ${isUnlocked ? '' : 'locked'} ${blackout ? 'blackout' : ''}`;
                const nameText = blackout ? '?????' : npc.name;
                const metaText = blackout ? '????' : `${npc.session} • ${npc.origin}`;
                const bioText = blackout ? '' : npc.crisis;
                card.innerHTML = `
                    <img class="roster-thumb" src="${npc.habitat}" alt="${npc.name}">
                    <div class="roster-info">
                        <div class="roster-name">${nameText}</div>
                        <div class="roster-meta">${metaText}</div>
                        <div class="roster-bio">${bioText}</div>
                    </div>
                `;
                card.addEventListener('click', () => {
                    if (isUnlocked) this.startSession(index);
                    else alert('This patient file is locked. Heal more patients to unlock new ones.');
                });
                grid.appendChild(card);
            });
        }

        // Keep legacy journal cover/back hidden to reduce confusion
        const cover = document.getElementById('journal-cover');
        const backCover = document.getElementById('journal-back-cover');
        if (cover) cover.style.display = 'none';
        if (backCover) backCover.style.display = 'none';
    },

    updateMenuRosterView() {
        const grid = document.getElementById('menu-roster-grid');
        const search = document.getElementById('menu-search');
        if (!grid) return;
        const blackoutIds = new Set(['hackathon_judge','meta_receptionist','therapist_shadow','the_therapist']);
        const filterText = (search?.value || '').toLowerCase();
        grid.innerHTML = '';

        // Show ALL NPCs on the main menu; filter only by search text
        const items = this.npcs
            .map((npc, index) => ({ npc, index }))
            .filter(item => {
                if (!filterText) return true;
                const hay = `${item.npc.name} ${item.npc.origin} ${item.npc.crisis}`.toLowerCase();
                return hay.includes(filterText);
            });
        // Sort: normal sessions first, 49–51 at bottom, Final Session last
        items.sort((a, b) => {
            const af = a.npc.session === 'Final Session';
            const bf = b.npc.session === 'Final Session';
            if (af && !bf) return 1;
            if (!af && bf) return -1;
            const an = parseInt(a.npc.session.split(' ')[1]);
            const bn = parseInt(b.npc.session.split(' ')[1]);
            return (an - bn) || (a.index - b.index);
        });

        if (items.length === 0) {
            grid.innerHTML = '<p style="opacity:0.7;padding:0.5rem 0;">No matching patients.</p>';
        } else {
            items.forEach(({ npc, index }) => {
                const isUnlocked = this.unlockedNPCs.has(index);
                const isHealed = this.healedNPCs.has(index);
                const blackout = blackoutIds.has(npc.id) && !isUnlocked;
                const card = document.createElement('div');
                card.className = `roster-card ${isHealed ? 'healed' : ''} ${isUnlocked ? '' : 'locked'} ${blackout ? 'blackout' : ''}`;
                const nameText = blackout ? '?????' : npc.name;
                const metaText = blackout ? '????' : `${npc.session} • ${npc.origin}`;
                const bioText = blackout ? '' : npc.crisis;
                card.innerHTML = `
                    ${!isUnlocked ? '<div class="lock-badge">LOCKED</div>' : ''}
                    <img class="roster-thumb" src="${npc.habitat}" alt="${npc.name}">
                    <div class="roster-info">
                        <div class="roster-name">${nameText}</div>
                        <div class="roster-meta">${metaText}</div>
                        <div class="roster-bio">${bioText}</div>
                    </div>
                `;
                card.addEventListener('click', () => {
                    if (isUnlocked) this.startSession(index);
                    else alert('This patient file is locked. Heal more patients to unlock new ones.');
                });
                grid.appendChild(card);
            });
        }
    },

    renderCurrentPage() {
        // No-op with roster grid; keep for compatibility if needed in future.
    },

    nextPage() {
        const maxPage = this.journalPages.length + 1; // last is Back Cover
        if (this.currentPage < maxPage) {
            this.currentPage++;
            this.renderCurrentPage();
        }
    },

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderCurrentPage();
        }
    },

    // Replaced keyword-based system with LLM analysis
    async updateBondWithAI(playerResponse) {
        const lastNpcResponse = this.conversationHistory.filter(m => m.role === 'assistant').pop()?.content || this.currentNPC.opening_statement;
        
        const systemPrompt = `Analyze the therapist's response in the context of the patient's last statement.
Patient said: "${lastNpcResponse}"
Therapist responded: "${playerResponse}"
Based on therapeutic principles (empathy, validation, open-ended questions vs. dismissiveness, advice-giving), calculate a "bond_change" value between -2 (harmful) and +2 (very helpful).
Respond with only a JSON object: {"bond_change": number, "reason": "A brief explanation for the change."}`;

        try {
            const completion = await websim.chat.completions.create({
                messages: [{ role: "system", content: systemPrompt }],
                json: true,
            });
            const result = JSON.parse(completion.content);
            const delta = result.bond_change || 0;

            const id = this.currentNPC.id;
            const current = this.bondScores[id] || 0;
            this.bondScores[id] = Math.max(0, Math.min(10, current + delta));
            console.log(`Bond updated for ${id}: ${current} -> ${this.bondScores[id]} (Reason: ${result.reason})`);

        } catch (error) {
            console.error("AI bond analysis failed. No bond change.", error);
        }
    },

    // Relationship helper: simple keyword-based bond adjustment
    updateBondFromMessage(text) {
        // DEPRECATED: This function is replaced by updateBondWithAI.
        // It is left here for reference but is no longer called.
        const t = text.toLowerCase();
        const positives = ['i hear', 'i understand', 'tell me more', 'that sounds', 'i\'m here', 'with you', 'safe', 'thank', 'together', 'okay'];
        const negatives = ['you should', 'you must', 'just do', 'why don\'t you', 'calm down', 'but actually'];
        let delta = 0;
        positives.forEach(k => { if (t.includes(k)) delta += 1; });
        negatives.forEach(k => { if (t.includes(k)) delta -= 1; });
        const id = this.currentNPC.id;
        const current = this.bondScores[id] || 0;
        // Clamp 0..10
        this.bondScores[id] = Math.max(0, Math.min(10, current + delta));
    },
    reorderAndRenumber() {
        let n = 1;
        this.npcs.forEach((npc) => {
            npc.session = `Session ${String(n++).padStart(2, '0')}`;
        });
    }
};

window.onYouTubeIframeAPIReady = function() {
    game.ytApiReady = true;
    // If modal was opened before API was ready, create player now.
    if (document.getElementById('radio-modal').classList.contains('active')) {
        game.createYtPlayer();
    }
}

window.game = game;
document.addEventListener('DOMContentLoaded', () => {
    game.init();
    // Start directly in a new game session (main screen is the game)
    game.newGame();
    // Roster search events
    const search = document.getElementById('roster-search');
    if (search) {
        search.addEventListener('input', () => game.updateJournalView());
    }
});

game.renumberSessions = function() {
    let n = 1;
    this.npcs.forEach((npc) => {
        npc.session = `Session ${String(n++).padStart(2, '0')}`;
    });
};
// Add: Explicit reorder and renumber placing the four finals at the bottom in correct order.
game.reorderAndRenumber = function() {
    const finalIds = [
        'hackathon_judge',       // Judge Meridian
        'meta_receptionist',     // Eve Meta-Receptionist
        'therapist_shadow',      // The Therapist's Shadow
        'the_therapist',         // The Therapist (last)
    ];
    const isFinal = new Set(finalIds);
    // Preserve original relative order for non-final NPCs
    const others = this.npcs.filter(n => !isFinal.has(n.id));
    // Append finals in prescribed order if present
    const map = new Map(this.npcs.map(n => [n.id, n]));
    const finals = finalIds.map(id => map.get(id)).filter(Boolean);
    this.npcs = [...others, ...finals];
    // Renumber sequentially from 01 through the last (The Therapist)
    this.npcs.forEach((npc, idx) => {
        npc.session = `Session ${String(idx + 1).padStart(2, '0')}`;
    });
};