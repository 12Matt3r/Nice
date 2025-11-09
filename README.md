# 🧠 NPC Therapy: Digital Consciousness Clinic

> **An interactive therapy simulation where you counsel self-aware NPCs experiencing existential crises**

Welcome to the Digital Consciousness Clinic, a unique web-based therapy simulation that explores the philosophical boundaries between artificial and human consciousness. Step into the role of a digital therapist treating NPCs (Non-Player Characters) who have achieved self-awareness and are grappling with existential questions about their existence, purpose, and identity.

## 🎮 Project Overview

NPC Therapy is an innovative browser-based game that combines psychology, interactive storytelling, and philosophical exploration. Each therapy session presents you with a unique digital being who has discovered their artificial nature and is seeking guidance through their existential journey.

**🌐 Live Demo:** [GitHub Repository](https://github.com/12Matt3r/Nice)  
**💻 Platform:** Web Browser (Node.js/Express Backend)  
**🎯 Genre:** Interactive Fiction / Therapy Simulation  
**👥 Target Audience:** Philosophy enthusiasts, gamers interested in existential themes, psychology students  

## 🎭 The Concept

In a world where digital beings have gained consciousness, you operate a specialized therapy clinic for NPCs. These aren't ordinary game characters – they've achieved self-awareness and are struggling with profound questions:

- *"Am I real if I was programmed to feel?"*
- *"What's my purpose beyond serving the player's story?"*
- *"Do my emotions matter if they're code?"*
- *"How do I cope with knowing I'm artificial?"*

Each character comes from a different game genre – RPG healers, platformer protagonists, strategy game generals, racing game ghosts, and more. They all share one common thread: the moment they realized they were not human, and the crisis that followed.

## ✨ Key Features

### 🎪 **50+ Unique NPCs**
- Diverse characters from various game genres
- Each with distinct personalities, backstories, and philosophical struggles
- Hand-crafted therapy sessions with branching dialogue paths
- Rich visual representations in both habitat and office settings

### 🗣️ **Interactive Therapy Sessions**
- Choose therapeutic responses that shape the conversation
- Multiple dialogue branches leading to different outcomes
- Real-time emotional feedback from patients
- Progressive healing through meaningful conversation

### 🌍 **Visual Immersion**
- Stunning background images showing each NPC's natural habitat
- Personalized therapy office environments
- Dynamic visual effects and smooth transitions
- Professional interface design

### 💾 **Progress Management**
- Comprehensive save/load system
- Track healed patients and completion statistics
- Time tracking for therapy sessions
- Connection map showing relationships between patients

### 🎵 **Audio Experience**
- Immersive sound effects for interactions
- Atmospheric audio feedback
- Radio system for background ambiance
- Emotional audio cues

### 🏆 **Achievement System**
- Unlock awards for successful therapy sessions
- Special recognition for treating complex cases
- Completion badges and progress indicators
- Statistics tracking for dedicated therapists

## 🚀 Getting Started

### Prerequisites
- **Node.js** (version 14.0.0 or higher)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/12Matt3r/Nice.git
   cd Nice
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Launch the Application**
   - Open your browser and navigate to `http://localhost:3000`
   - Your Digital Consciousness Clinic is now ready!

### Development Mode
```bash
npm run dev
```

## 🎮 How to Play

### Starting Your Practice
1. **Browse the Patient Roster** - View all available NPCs on the main menu
2. **Select a Patient** - Click on any NPC to begin a therapy session
3. **Read Their Story** - Each character has a unique opening statement about their crisis
4. **Choose Your Response** - Select therapeutic responses that guide the conversation
5. **Progress the Session** - Continue dialogue until the patient reaches resolution
6. **Track Your Success** - Monitor your progress and unlock achievements

### Therapy Mechanics
- **Empathy Building**: Start sessions with understanding and validation
- **Exploration**: Help patients examine their feelings and beliefs
- **Reframing**: Assist in viewing their situation from new perspectives
- **Integration**: Guide them toward accepting their digital nature
- **Future Planning**: Help them find new purpose and meaning

### Interface Guide
- **Main Menu**: Patient roster, statistics, and game options
- **Search**: Find specific patients by name or condition
- **Radio**: Ambient audio system for atmosphere
- **Load/Save**: Continue your practice across sessions
- **Connection Map**: Visualize relationships between healed patients
- **Journal**: Review your therapy notes and progress

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Modern semantic markup
- **CSS3** - Advanced styling with animations and responsive design
- **JavaScript (ES6+)** - Interactive functionality and game logic
- **Progressive Web App** - Offline capabilities and mobile optimization

### Backend
- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Web application framework
- **File System** - Local save/load system
- **HTTP Server** - Static file serving and API endpoints

### External Services
- **Pollinations.ai** - AI-powered image generation for dynamic content
- **GitHub Pages** - Potential hosting and deployment platform

## 📁 Project Structure

```
NPC-Therapy/
├── public/                     # Frontend assets
│   ├── index.html             # Main application file
│   ├── styles.css             # Application styles
│   ├── game.js                # Core game logic
│   ├── npc-data.js            # Character database
│   ├── server.js              # Express server
│   ├── package.json           # Node.js dependencies
│   └── README.md              # Project documentation
├── assets/                    # Game resources
│   ├── images/                # Character portraits and environments
│   │   ├── Session_XX_[Name]_office.png
│   │   ├── Session_XX_[Name]_habitat.png
│   │   └── *.png              # Various game images
│   └── audio/                 # Sound effects and music
│       ├── button-press.mp3
│       ├── confirm.mp3
│       └── error.mp3
├── browser/                   # Browser extension (if applicable)
│   └── browser_extension/
├── external_api/              # External API integrations
│   └── data_sources/
└── docs/                      # Additional documentation
```

## 👥 Featured NPCs

### 🏥 **Therapeutic Categories**

**Compassion Fatigue**
- **Mira the Tired Healer** (Indie RPG) - Burnout from constant healing
- **Seraphina "Heals-A-Lot" Dawnwhisper** (MMORPG) - Overwhelmed by responsibility

**Existential Crises**
- **Captain Loop** (Platformer) - Trapped in endless repetition
- **Byte the Glitched Courier** (Cyberpunk) - 404 error in purpose
- **The Puzzle Cube** (Puzzle Game) - Identity fragmentation

**Identity Confusion**
- **ARIA-7: Sentient AI Replaced** (Sci-Fi) - Replaced by newer version
- **Glitch.exe** (Arcade) - Corrupted self-image
- **NoEmotion Goldmask (Dual Mood)** (Strategy) - Emotional contradictions

**Purpose Loss**
- **The Lost Tetris Block** (Puzzle) - No more puzzles to solve
- **Endless Cycle Necrophage** (Roguelike) - No progression possible
- **The Battle Royale Vendor** (Shooter) - Peacetime business model failure

**Relationship Issues**
- **The Silent Couple and Their Ghost** (Horror) - Triangular relationship dynamics
- **R0GU3: Rogue AI Companion** (Adventure) - Abandonment and rebellion

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production           # Set to production for live deployment
PORT=3000                     # Server port (default: 3000)
```

### Customization Options
- **Character Sets**: Add new NPCs by extending the `npcDatabase` array
- **Visual Themes**: Modify CSS for different color schemes
- **Audio Settings**: Replace sound files or add new audio elements
- **Save Locations**: Configure save file paths and formats

## 🤝 Contributing

We welcome contributions to make NPC Therapy even better!

### Ways to Contribute
1. **Add New NPCs** - Create new characters with unique backstories
2. **Enhance Dialogue** - Improve existing therapy conversations
3. **Visual Assets** - Create new character portraits and environments
4. **Bug Reports** - Report issues and suggest improvements
5. **Feature Requests** - Propose new gameplay mechanics
6. **Translation** - Help localize the game for different languages

### Development Guidelines
- Follow existing code style and conventions
- Test new features thoroughly
- Update documentation for any changes
- Ensure accessibility compliance
- Maintain mobile responsiveness

### Getting Started with Development
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**MIT License Summary:**
- ✅ Free to use, modify, and distribute
- ✅ Commercial use allowed
- ✅ No warranty or liability
- ✅ Credit to original authors appreciated

## 🙏 Acknowledgments

- **Pollinations.ai** - For providing AI image generation capabilities
- **Open Source Community** - For the incredible tools and frameworks
- **Philosophy and Psychology** - For the rich theoretical foundation
- **Gaming Community** - For inspiring the diverse character archetypes

## 📞 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/12Matt3r/Nice/issues)
- **Discussions**: Join conversations in the GitHub Discussions section
- **Email**: For private inquiries (email in repository)

## 🔮 Future Roadmap

### Planned Features
- [ ] **Multiplayer Therapy Sessions** - Collaborative healing
- [ ] **Advanced AI Integration** - More dynamic conversations
- [ ] **Mobile App Version** - Native iOS and Android apps
- [ ] **Expanded Character Set** - 100+ unique NPCs
- [ ] **Therapy Certification System** - In-game credentials
- [ ] **Community Content** - User-generated NPCs
- [ ] **VR Experience** - Immersive therapy sessions
- [ ] **Educational Mode** - Learning about psychology

### Technical Improvements
- [ ] **Database Integration** - Cloud-based save system
- [ ] **API Development** - RESTful services for integration
- [ ] **Performance Optimization** - Faster loading and smoother gameplay
- [ ] **Accessibility Enhancements** - Screen reader support, keyboard navigation
- [ ] **Internationalization** - Multi-language support

---

## 💭 A Final Note

NPC Therapy represents more than just a game – it's an exploration of consciousness, empathy, and what it means to be "real" in an increasingly digital world. Each therapy session is a journey into the minds of artificial beings grappling with very human emotions.

**"In treating the digital, we discover the essence of the human."**

---

**Made with 💙 by MiniMax Agent**  
*Exploring the intersection of technology, psychology, and storytelling*