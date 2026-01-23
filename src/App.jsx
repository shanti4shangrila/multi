import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Trophy, Star, Heart, Zap, Award, 
  ChevronRight, Volume2, VolumeX, BarChart3, Home, Map as MapIcon,
  User, Lock, CheckCircle, ArrowRight, Grid, Layers, X, Sparkles,
  Compass, Anchor, Cloud, Mountain, Warehouse, Wheat, Footprints,
  Construction
} from 'lucide-react';

// --- SHARED ENGINES (Particles, Audio, Helpers) ---

const Particle = ({ x, y, color }) => {
  const [style, setStyle] = useState({
    left: x,
    top: y,
    opacity: 1,
    transform: `translate(0, 0) scale(1)`,
    backgroundColor: color,
  });

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 60 + Math.random() * 100;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;

    requestAnimationFrame(() => {
      setStyle((prev) => ({
        ...prev,
        opacity: 0,
        transform: `translate(${tx}px, ${ty}px) scale(0)`,
        transition: 'all 0.8s cubic-bezier(0, .9, .57, 1)',
      }));
    });
  }, []);

  return (
    <div
      className="absolute w-3 h-3 rounded-full pointer-events-none z-[100]"
      style={style}
    />
  );
};

// --- DATA: THE WORLD MAP & STATIC ASSETS ---
const WORLD_DATA = {
  gate: {
    id: "gate",
    title: "The Gate",
    theme: "mystical",
    icon: <Lock className="w-8 h-8" />,
    color: "from-slate-700 to-slate-900",
    nextWorld: "canyon",
    character: { name: "Gatekeeper", role: "Guardian", icon: "🧙‍♂️" },
    dialogue: [
      "Halt, Traveler.",
      "To enter the Island of Structure, you must see the patterns.",
      "Complete 10 challenges to prove your worth."
    ]
  },
  canyon: {
    id: "canyon",
    title: "Echo Canyon",
    theme: "canyon",
    icon: <Footprints className="w-8 h-8" />,
    color: "from-orange-700 to-red-900",
    nextWorld: "village",
    character: { name: "Echo", role: "Guide", icon: "🦇" },
    dialogue: [
      "Hello... hello...!",
      "To cross the canyon, you must hop on the stones in rhythm.",
      "Listen to the numbers and find the missing beat."
    ]
  },
  village: {
    id: "village",
    title: "Village of Groups",
    theme: "village",
    icon: <Layers className="w-8 h-8" />,
    color: "from-emerald-400 to-teal-600",
    nextWorld: "fields",
    character: { name: "Milo", role: "Builder", icon: "👷" },
    dialogue: [
      "Good to see you!",
      "We build by sharing fairly. Division is just sharing!",
      "Help me split these bricks into equal piles."
    ]
  },
  fields: {
    id: "fields",
    title: "Fields of Arrays",
    theme: "farm",
    icon: <Grid className="w-8 h-8" />,
    color: "from-amber-400 to-orange-600",
    nextWorld: "bridge",
    character: { name: "Rowan", role: "Farmer", icon: "👨‍🌾" },
    dialogue: [
      "Welcome to the harvest.",
      "We plant in rows and columns. It's the fastest way to count!",
      "Show me you can grow structure from chaos."
    ]
  },
  bridge: {
    id: "bridge",
    title: "The Broken Bridge",
    theme: "engineering",
    icon: <Construction className="w-8 h-8" />,
    color: "from-cyan-600 to-blue-800",
    nextWorld: "arena",
    character: { name: "Architect", role: "Engineer", icon: "📐" },
    dialogue: [
      "The bridge is out!",
      "We have the answer, but we're missing a piece of the equation.",
      "Find the missing factor to fix the span."
    ]
  },
  arena: {
    id: "arena",
    title: "The Arena",
    theme: "arcade",
    icon: <Zap className="w-8 h-8" />,
    color: "from-indigo-500 to-purple-700",
    nextWorld: null, // End game
    character: { name: "The Master", role: "Champion", icon: "🧞‍♂️" },
    dialogue: [
      "You have mastered the concepts.",
      "Now, pure speed. No helpers. No blocks.",
      "Enter the flow state."
    ]
  }
};

// --- DYNAMIC PROBLEM GENERATOR ---
const generateProblem = (worldId, difficulty) => {
    // Difficulty rises as the user solves more problems (0 to infinity)
    const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Determine number range based on difficulty
    let rangeMin = 2;
    let rangeMax = 5;
    if (difficulty > 3) rangeMax = 9;
    if (difficulty > 9) rangeMax = 12;

    const base = getRandom(rangeMin, rangeMax);
    const multiplier = getRandom(2, 12);

    if (worldId === 'gate') {
        // Logic / Pattern Quiz
        const start = getRandom(2, 20);
        const step = base; // Use the base as the step
        const seq = [start, start + step, start + (step*2)];
        
        return {
            id: `g-${Date.now()}`,
            type: 'quiz',
            question: `What comes next: ${seq[0]}, ${seq[1]}, ${seq[2]}...?`,
            options: [`${seq[2] + step - 1}`, `${seq[2] + step}`, `${seq[2] + step + 2}`],
            answer: `${seq[2] + step}`,
            hint: `The numbers grow by ${step} each time.`
        };
    }
    else if (worldId === 'canyon') {
        // Skip Counting (Missing Number)
        const step = base;
        const startSequence = getRandom(0, 5) * step; // Start somewhere in the table
        // e.g., 6, 9, _, 15 (step 3)
        const missingIndex = 2; 
        const seq = [
            startSequence + step,
            startSequence + (step*2),
            startSequence + (step*3), // Missing one
            startSequence + (step*4)
        ];
        
        return {
            id: `c-${Date.now()}`,
            type: 'quiz',
            question: `Fill the gap: ${seq[0]}, ${seq[1]}, __, ${seq[3]}`,
            options: [`${seq[2] - 1}`, `${seq[2]}`, `${seq[2] + 1}`],
            answer: `${seq[2]}`,
            hint: `Count by ${step}s.`
        };
    } 
    else if (worldId === 'village') {
        // CONCRETE DIVISION: Grouping
        const groups = getRandom(2, Math.min(difficulty + 2, 5)); // Cap groups at 5 for UI space
        const perGroup = getRandom(2, rangeMax);
        const total = groups * perGroup;
        
        return {
            id: `v-${Date.now()}`,
            type: 'grouping',
            targetTotal: total,
            groupCount: groups,
            itemIcon: '🧱',
            instruction: `Divide ${total} bricks into ${groups} equal piles.`
        };
    } 
    else if (worldId === 'fields') {
        // CONCRETE MULTIPLICATION: Arrays
        // Ensure visual fit (max 10x10)
        const r = Math.min(base, 9);
        const c = Math.min(multiplier, 9);
        
        return {
            id: `f-${Date.now()}`,
            type: 'array',
            rows: r,
            cols: c,
            target: r * c,
            instruction: `Plant a field ${r} rows high and ${c} columns wide.`
        };
    } 
    else if (worldId === 'bridge') {
        // MISSING FACTOR (Abstract)
        const total = base * multiplier;
        // 50% chance to miss first or second number
        const missingFirst = Math.random() > 0.5;
        
        const qText = missingFirst 
            ? `? x ${multiplier} = ${total}` 
            : `${base} x ? = ${total}`;
        
        return {
            id: `b-${Date.now()}`,
            type: 'quiz',
            question: qText,
            options: [
                `${missingFirst ? base - 1 : multiplier - 1}`, 
                `${missingFirst ? base : multiplier}`, 
                `${missingFirst ? base + 2 : multiplier + 2}`
            ],
            answer: `${missingFirst ? base : multiplier}`,
            hint: `Think: What times ${missingFirst ? multiplier : base} makes ${total}?`
        };
    }
    else if (worldId === 'arena') {
        return { id: "a1", type: "arcade" };
    }
};


// --- SUB-GAMES ---

// 1. ARCADE MODE (MultiMaster)
const ArcadeGame = ({ onComplete, addParticles, triggerShake }) => {
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const generateProblem = useCallback(() => {
    // Full 2-12 range for Arena
    const table = Math.floor(Math.random() * 11) + 2; 
    const multiplier = Math.floor(Math.random() * 11) + 2;
    return { num1: table, num2: multiplier, answer: table * multiplier };
  }, []);

  useEffect(() => {
    startGame();
  }, []);

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setTimeLeft(60);
    setGameActive(true);
    setCurrentProblem(generateProblem());
    setUserAnswer('');
    setIsFinished(false);
  };

  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
      setIsFinished(true);
    }
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  const handleInput = (val) => {
    if (!gameActive) return;
    setUserAnswer(val);
    const numVal = parseInt(val);
    if (!isNaN(numVal) && numVal === currentProblem.answer) {
      // Correct
      const inputRect = document.getElementById('arcade-input')?.getBoundingClientRect();
      if (inputRect) addParticles(inputRect.left + inputRect.width/2, inputRect.top, '#4ADE80');
      
      setScore(s => s + 100 + (combo * 10));
      setCombo(c => c + 1);
      setUserAnswer('');
      setCurrentProblem(generateProblem());
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Trophy className="w-24 h-24 text-yellow-400 mb-6 animate-bounce" />
        <h2 className="text-4xl font-black text-white mb-2">Arena Conquered!</h2>
        <div className="text-2xl text-indigo-200 mb-8">Score: {score}</div>
        <button 
          onClick={onComplete}
          className="bg-white text-indigo-900 font-bold py-4 px-12 rounded-2xl shadow-xl hover:scale-105 transition"
        >
          Return to Map
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full relative">
       {/* HUD */}
       <div className="absolute top-4 w-full flex justify-between px-8 text-white font-bold text-xl">
          <div className="flex items-center gap-2"><Heart className="fill-red-500 text-red-500"/> Arcade Mode</div>
          <div className={`${timeLeft < 10 ? 'text-red-400 animate-pulse' : ''}`}>{timeLeft}s</div>
          <div className="text-yellow-400">{score}</div>
       </div>

       {/* Combo Bar */}
       <div className="w-64 h-2 bg-gray-700 rounded-full mt-16 mb-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-300" 
            style={{width: `${Math.min(combo * 10, 100)}%`}}
          />
       </div>

       <div className="text-8xl md:text-9xl font-black text-white drop-shadow-2xl mb-8 tracking-tighter">
         {currentProblem?.num1} <span className="text-indigo-400">×</span> {currentProblem?.num2}
       </div>

       <div id="arcade-input" className="h-20 min-w-[150px] border-b-4 border-white/50 text-6xl text-white font-mono flex items-center justify-center mb-8">
         {userAnswer}
       </div>

       <div className="grid grid-cols-3 gap-3 w-64">
         {[1,2,3,4,5,6,7,8,9].map(n => (
           <button 
             key={n}
             onClick={() => handleInput(userAnswer + n)}
             className="h-14 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold text-xl border border-white/10 backdrop-blur-sm"
           >
             {n}
           </button>
         ))}
         <button onClick={() => setUserAnswer('')} className="h-14 bg-red-500/20 text-red-200 rounded-xl font-bold border border-red-500/30">C</button>
         <button onClick={() => handleInput(userAnswer + '0')} className="h-14 bg-white/10 text-white rounded-xl font-bold text-xl border border-white/10">0</button>
       </div>
    </div>
  );
};

// 2. CONCEPT: GROUPING (Village)
const GroupingGame = ({ level, onComplete, addParticles, triggerShake }) => {
  const [groups, setGroups] = useState(Array(level.groupCount).fill(0));
  
  const handleAdd = (idx, e) => {
    const currentTotal = groups.reduce((a, b) => a + b, 0);
    if (currentTotal < level.targetTotal) {
      const newGroups = [...groups];
      newGroups[idx]++;
      setGroups(newGroups);
      
      const rect = e.currentTarget.getBoundingClientRect();
      addParticles(rect.left + rect.width/2, rect.top + rect.height/2, '#10B981'); 
    } else {
      triggerShake();
    }
  };

  const handleReset = () => {
    setGroups(Array(level.groupCount).fill(0));
  };

  const check = () => {
    const isBalanced = groups.every(g => g === level.targetTotal / level.groupCount);
    if (isBalanced) onComplete();
    else triggerShake();
  };

  const currentTotal = groups.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-black text-slate-800 drop-shadow-sm mb-2">{level.instruction}</h3>
        <p className="text-slate-600 font-bold bg-white/50 inline-block px-4 py-1 rounded-full">Tap bubbles to add blocks</p>
      </div>

      <div className="flex-grow flex flex-wrap items-center justify-center gap-8 content-center">
        {groups.map((count, idx) => (
          <button
            key={idx}
            onClick={(e) => handleAdd(idx, e)}
            className="relative w-40 h-40 rounded-full bg-gradient-to-br from-white/90 to-white/60 border-4 border-white shadow-xl flex flex-wrap items-center justify-center p-6 transition transform hover:scale-105 active:scale-95 backdrop-blur-md"
          >
            {/* Limit visible items to prevent overflow, show number always */}
            <div className="flex flex-wrap justify-center max-h-[80px] overflow-hidden">
                {[...Array(Math.min(count, 12))].map((_, i) => (
                <span key={i} className="text-2xl m-1 animate-bounce drop-shadow">{level.itemIcon}</span>
                ))}
            </div>
            {count > 12 && <span className="text-xs font-bold text-slate-400">...</span>}
            
            <div className="absolute -bottom-2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-full">
              {count}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto bg-white/80 backdrop-blur-xl rounded-2xl p-4 flex justify-between items-center shadow-lg border border-white/50">
         <div className="text-xl font-bold text-slate-700">
           Total: <span className={`text-2xl ${currentTotal === level.targetTotal ? 'text-emerald-600' : 'text-slate-900'}`}>{currentTotal}</span> / {level.targetTotal}
         </div>
         <div className="flex gap-2">
            <button 
                onClick={handleReset}
                className="p-3 rounded-xl bg-slate-200 text-slate-500 font-bold hover:bg-slate-300 transition"
                title="Reset Blocks"
            >
                <RotateCcw size={20} />
            </button>
            <button 
            onClick={check}
            disabled={currentTotal !== level.targetTotal}
            className={`px-8 py-3 rounded-xl font-black text-lg transition shadow-lg ${currentTotal === level.targetTotal ? 'bg-emerald-500 text-white hover:bg-emerald-400 hover:-translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
            Check!
            </button>
         </div>
      </div>
    </div>
  );
};

// 3. CONCEPT: ARRAYS (Fields)
const ArrayGame = ({ level, onComplete, addParticles, triggerShake }) => {
  const [activeCells, setActiveCells] = useState([]); // Array of "r-c" strings

  // Determine grid size based on level (give some padding for challenge)
  const maxR = Math.max(level.rows + 1, 6);
  const maxC = Math.max(level.cols + 1, 6);

  const toggleCell = (r, c, e) => {
    const key = `${r}-${c}`;
    const rect = e.currentTarget.getBoundingClientRect();

    if (activeCells.includes(key)) {
      setActiveCells(prev => prev.filter(k => k !== key));
    } else {
      setActiveCells(prev => [...prev, key]);
      addParticles(rect.left + rect.width/2, rect.top + rect.height/2, '#F59E0B'); // Amber particle
    }
  };

  const check = () => {
    if (activeCells.length !== level.target) { triggerShake(); return; }

    const rows = activeCells.map(k => parseInt(k.split('-')[0]));
    const cols = activeCells.map(k => parseInt(k.split('-')[1]));
    const width = (Math.max(...cols) - Math.min(...cols)) + 1;
    const height = (Math.max(...rows) - Math.min(...rows)) + 1;

    const validDims = (width === level.cols && height === level.rows) || (width === level.rows && height === level.cols);
    const validArea = activeCells.length === width * height; 

    if (validDims && validArea) onComplete();
    else triggerShake();
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="text-center mb-6">
        <h3 className="text-3xl font-black text-slate-800 drop-shadow-sm mb-2">{level.instruction}</h3>
      </div>

      <div className="flex-grow flex items-center justify-center overflow-auto">
        <div 
          className="grid gap-2 bg-amber-100/50 p-6 rounded-3xl border-4 border-amber-200/50 shadow-inner backdrop-blur-sm"
          style={{ gridTemplateColumns: `repeat(${maxC}, minmax(3rem, 4rem))` }}
        >
          {[...Array(maxR)].map((_, r) => (
            [...Array(maxC)].map((_, c) => {
              const isActive = activeCells.includes(`${r}-${c}`);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={(e) => toggleCell(r, c, e)}
                  className={`aspect-square rounded-xl border-2 transition-all duration-200 flex items-center justify-center text-2xl shadow-sm hover:scale-105 active:scale-95 ${isActive ? 'bg-amber-400 border-amber-500 rotate-1' : 'bg-white/60 border-white hover:bg-white'}`}
                >
                  {isActive && '🌽'}
                </button>
              )
            })
          ))}
        </div>
      </div>

      <div className="mt-auto bg-white/80 backdrop-blur-xl rounded-2xl p-4 flex justify-between items-center shadow-lg border border-white/50">
         <div className="text-xl font-bold text-slate-700">
           Planted: <span className="text-2xl text-amber-600">{activeCells.length}</span> / {level.target}
         </div>
         <button 
           onClick={check}
           className="px-8 py-3 rounded-xl font-black text-lg bg-amber-500 text-white hover:bg-amber-400 transition shadow-lg hover:-translate-y-1"
         >
           Harvest
         </button>
      </div>
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function App() {
  const [showSplash, setShowSplash] = useState(true); 
  const [view, setView] = useState('map'); // map, dialogue, level
  const [worldId, setWorldId] = useState('gate'); 
  const [solvedCount, setSolvedCount] = useState(0); // Track progress in current world
  const [currentLevel, setCurrentLevel] = useState(null); // The current generated level
  
  const [unlocked, setUnlocked] = useState(['gate']);
  const [stars, setStars] = useState(0);
  const [particles, setParticles] = useState([]);
  const [shaking, setShaking] = useState(false);
  const [showCheckpoint, setShowCheckpoint] = useState(false); // Modal for 10 problems done

  // --- Effects ---
  const addParticles = (x, y, color) => {
    const newP = Array.from({ length: 12 }).map((_, i) => ({ id: Date.now() + i, x, y, color }));
    setParticles(prev => [...prev, ...newP]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id < Date.now())), 1000);
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 300);
  };

  // --- Navigation Helpers ---

  const enterWorld = (id) => {
    if (!unlocked.includes(id)) return;
    setWorldId(id);
    setSolvedCount(0);
    setShowCheckpoint(false);
    // Generate first level (difficulty 0)
    setCurrentLevel(generateProblem(id, 0));
    setView('dialogue');
  };

  const handleNextProblem = () => {
    const newCount = solvedCount + 1;
    setSolvedCount(newCount);
    setStars(s => s + 1);

    // CHECKPOINT LOGIC: 
    // If we just hit 10, ask user if they want to move on or continue.
    // If they continue (11+), no modal, just infinite play.
    if (newCount === 10) {
        setShowCheckpoint(true);
    } else {
        // Generate next problem immediately with increasing difficulty
        setCurrentLevel(generateProblem(worldId, newCount));
    }
  };

  const unlockNextWorld = () => {
      const currentWorldData = WORLD_DATA[worldId];
      if (currentWorldData.nextWorld && !unlocked.includes(currentWorldData.nextWorld)) {
          setUnlocked(prev => [...prev, currentWorldData.nextWorld]);
      }
      setShowCheckpoint(false);
      setView('map');
  };

  const continueInfiniteMode = () => {
      setShowCheckpoint(false);
      setCurrentLevel(generateProblem(worldId, solvedCount));
  };

  // --- Renders ---

  const renderSplash = () => (
    <div 
      onClick={() => setShowSplash(false)}
      className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center overflow-hidden cursor-pointer"
    >
        {/* Dynamic Background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-black animate-gradient-xy"></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
             <div className="w-[800px] h-[800px] bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse"></div>
             <div className="w-[600px] h-[600px] bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse delay-75"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center p-6">
            <div className="mb-8 flex justify-center gap-4 animate-float">
                <Compass className="w-16 h-16 text-cyan-400" />
                <Sparkles className="w-16 h-16 text-yellow-400" />
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 mb-6 drop-shadow-2xl tracking-tighter animate-gradient-x select-none">
                ISLAND OF<br/>STRUCTURE
            </h1>
            
            <p className="text-slate-400 text-xl md:text-2xl font-bold tracking-widest uppercase mb-12 animate-pulse">
                Click to Begin Journey
            </p>

            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white font-mono text-sm">
                <Anchor className="w-4 h-4" /> Version 2.0 • Infinite Horizons
            </div>
        </div>
    </div>
  );

  const renderMap = () => {
    return (
      <div className="relative w-full h-full p-4 overflow-hidden bg-sky-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-700 via-slate-900 to-black opacity-80"></div>
        <div className="absolute inset-0 opacity-10 bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom animate-float-slow"></div>

        <h1 className="relative z-10 text-center text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-sky-200 drop-shadow-lg mb-8 tracking-wide font-sans cursor-default">
          Select Your Path
        </h1>

        {/* Floating Map Nodes - UPDATED FOR 6 NODES */}
        <div className="relative z-10 w-full max-w-5xl mx-auto h-[600px] perspective-1000">
           
           {/* Connecting Curves - REWIRED */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-cyan-400/50 stroke-[3] fill-none filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
             {/* Gate -> Canyon */}
             <path d="M 50% 85% Q 30% 75% 20% 60%" className="animate-draw-path" strokeDasharray="10 5" />
             {/* Canyon -> Village */}
             <path d="M 20% 60% Q 25% 45% 35% 40%" className="animate-draw-path delay-100" strokeDasharray="10 5" />
             {/* Village -> Fields */}
             <path d="M 35% 40% Q 50% 35% 65% 40%" className="animate-draw-path delay-200" strokeDasharray="10 5" />
             {/* Fields -> Bridge */}
             <path d="M 65% 40% Q 75% 45% 80% 60%" className="animate-draw-path delay-300" strokeDasharray="10 5" />
             {/* Bridge -> Arena */}
             <path d="M 80% 60% Q 65% 25% 50% 15%" className="animate-draw-path delay-400" strokeDasharray="10 5" />
           </svg>

           {/* 1. GATE (Bottom Center) */}
           <MapNode x="50%" y="85%" id="gate" unlocked={unlocked} onClick={() => enterWorld('gate')} Icon={Mountain} label="The Gate" color="indigo" />

           {/* 2. CANYON (Left Bottom) */}
           <MapNode x="20%" y="60%" id="canyon" unlocked={unlocked} onClick={() => enterWorld('canyon')} Icon={Footprints} label="Echo Canyon" color="orange" delay="delay-100" />

           {/* 3. VILLAGE (Left Top) */}
           <MapNode x="35%" y="40%" id="village" unlocked={unlocked} onClick={() => enterWorld('village')} Icon={Warehouse} label="Village" color="emerald" delay="delay-200" />

           {/* 4. FIELDS (Right Top) */}
           <MapNode x="65%" y="40%" id="fields" unlocked={unlocked} onClick={() => enterWorld('fields')} Icon={Wheat} label="Fields" color="amber" delay="delay-300" />

           {/* 5. BRIDGE (Right Bottom) */}
           <MapNode x="80%" y="60%" id="bridge" unlocked={unlocked} onClick={() => enterWorld('bridge')} Icon={Construction} label="Broken Bridge" color="cyan" delay="delay-400" />

           {/* 6. ARENA (Top Center) */}
           <MapNode x="50%" y="15%" id="arena" unlocked={unlocked} onClick={() => enterWorld('arena')} Icon={Sparkles} label="THE ARENA" color="purple" delay="delay-500" size="lg" />
        </div>

        {/* Stats */}
        <div className="absolute top-4 right-4 flex gap-4">
          <div className="bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 text-white font-bold shadow-lg hover:scale-105 transition">
            <Star className="text-yellow-400 fill-current drop-shadow-md" /> {stars}
          </div>
        </div>
      </div>
    );
  };

  const MapNode = ({ x, y, id, unlocked, onClick, Icon, label, color, delay = "", size = "md" }) => {
      const isUnlocked = unlocked.includes(id);
      const isLarge = size === 'lg';
      
      const colorMap = {
          indigo: 'bg-indigo-600 border-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.5)]',
          orange: 'bg-orange-600 border-orange-400 shadow-[0_0_30px_rgba(234,88,12,0.5)]',
          emerald: 'bg-emerald-600 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]',
          amber: 'bg-amber-500 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)]',
          cyan: 'bg-cyan-600 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]',
          purple: 'bg-purple-600 border-purple-400 shadow-[0_0_50px_rgba(147,51,234,0.6)] animate-pulse-slow',
      };
      const lockedStyle = 'bg-slate-700 border-slate-600 opacity-50 grayscale';

      return (
        <div 
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group animate-float cursor-pointer ${delay}`}
            style={{ left: x, top: y }}
            onClick={onClick}
        >
            <div className={`relative ${isLarge ? 'w-32 h-32' : 'w-24 h-24'} rounded-full flex items-center justify-center transition-all duration-500 transform group-hover:scale-110 group-hover:-translate-y-4 border-4 ${isUnlocked ? colorMap[color] : lockedStyle}`}>
                <div className={`absolute inset-2 rounded-full border-2 border-white/30 flex items-center justify-center z-10 ${!isUnlocked && 'bg-slate-800'}`}>
                    {isUnlocked ? <Icon className={`${isLarge ? 'w-16 h-16' : 'w-12 h-12'} text-white drop-shadow-md`} /> : <Lock className="w-8 h-8 text-slate-500" />}
                </div>
            </div>
            <span className={`mt-4 font-black text-white bg-slate-900/80 px-4 py-1 rounded-full backdrop-blur border border-white/20 transition-opacity ${!isUnlocked && 'opacity-50'}`}>{label}</span>
        </div>
      );
  };

  const renderDialogue = () => {
    const world = WORLD_DATA[worldId];
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-2xl mx-auto">
        <div className="w-32 h-32 rounded-full bg-white border-4 border-white/50 shadow-2xl flex items-center justify-center text-6xl mb-6 animate-bounce">
          {world.character.icon}
        </div>
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-2 border-white">
          <h2 className="text-3xl font-black text-slate-800 mb-2">{world.character.name}</h2>
          <div className="h-1 w-20 bg-slate-200 mx-auto rounded-full mb-6"/>
          <div className="space-y-4 mb-8 text-xl font-medium text-slate-600 leading-relaxed">
            {world.dialogue.map((line, i) => <p key={i}>"{line}"</p>)}
          </div>
          <button 
            onClick={() => setView('level')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:scale-105 transition flex items-center gap-2 mx-auto"
          >
            Start Challenge <ArrowRight />
          </button>
        </div>
      </div>
    );
  };

  const renderCheckpoint = () => (
      <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl animate-float">
              <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-4xl font-black text-slate-800 mb-2">Hurdle Cleared!</h2>
              <p className="text-slate-500 text-lg mb-8 font-bold">You've mastered the basics of this area.</p>
              
              <div className="grid gap-4">
                {WORLD_DATA[worldId].nextWorld && (
                    <button 
                        onClick={unlockNextWorld}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white py-4 px-8 rounded-xl font-black text-xl shadow-lg hover:scale-105 transition"
                    >
                        Unlock Next Region <ArrowRight className="inline ml-2"/>
                    </button>
                )}
                <button 
                    onClick={continueInfiniteMode}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 py-4 px-8 rounded-xl font-bold text-lg border-2 border-indigo-200 transition"
                >
                    Keep Practicing (Infinite)
                </button>
              </div>
          </div>
      </div>
  );

  const renderLevel = () => {
    const world = WORLD_DATA[worldId];
    const level = currentLevel;

    const handleLevelComplete = () => {
      // Small delay for particles
      setTimeout(() => {
          handleNextProblem();
      }, 800);
    };

    return (
      <div className="h-full flex flex-col relative">
        {showCheckpoint && renderCheckpoint()}
        
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 pointer-events-none">
          <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full font-bold text-slate-700 shadow-md border border-white">
            <span className="text-indigo-600 mr-2">Problem #{solvedCount + 1}</span> 
            {solvedCount >= 10 && <span className="text-yellow-600 font-black">★ INFINITE MODE</span>}
          </div>
          <button onClick={() => setView('map')} className="pointer-events-auto p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow pt-16">
          {level.type === 'quiz' && (
            <div className="flex flex-col items-center justify-center h-full p-6" key={level.id}>
               <div className="bg-white/90 p-10 rounded-3xl shadow-2xl max-w-md text-center">
                 <h2 className="text-4xl font-black text-slate-800 mb-8">{level.question}</h2>
                 <div className="grid gap-4">
                   {level.options.map(opt => (
                     <button 
                       key={opt}
                       onClick={(e) => {
                         if (opt === level.answer) {
                           const rect = e.currentTarget.getBoundingClientRect();
                           addParticles(rect.left+rect.width/2, rect.top, '#4ADE80');
                           handleLevelComplete();
                         } else {
                           triggerShake();
                         }
                       }}
                       className="py-4 rounded-xl bg-slate-100 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-400 font-bold text-xl transition text-slate-700"
                     >
                       {opt}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {level.type === 'grouping' && (
            <GroupingGame 
              key={level.id}
              level={level} 
              onComplete={handleLevelComplete} 
              addParticles={addParticles}
              triggerShake={triggerShake}
            />
          )}

          {level.type === 'array' && (
            <ArrayGame 
              key={level.id}
              level={level} 
              onComplete={handleLevelComplete} 
              addParticles={addParticles}
              triggerShake={triggerShake}
            />
          )}

          {level.type === 'arcade' && (
            <ArcadeGame 
              key={level.id}
              onComplete={unlockNextWorld} 
              addParticles={addParticles}
              triggerShake={triggerShake}
            />
          )}
        </div>
      </div>
    );
  };

  // --- Background Animation ---
  const currentWorldColor = WORLD_DATA[worldId]?.color || "from-slate-800 to-black";

  return (
    <div className={`w-full h-screen bg-gradient-to-br ${view === 'map' ? 'from-sky-400 to-blue-600' : currentWorldColor} font-sans overflow-hidden relative transition-colors duration-1000`}>
      
      {/* Animated Blobs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
         <div className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-white rounded-full mix-blend-overlay filter blur-[100px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60vh] h-[60vh] bg-yellow-200 rounded-full mix-blend-overlay filter blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Main Glass Panel */}
      <div className={`relative z-10 w-full h-full md:max-w-4xl md:h-[90vh] md:mx-auto md:my-[5vh] ${shaking ? 'animate-shake' : ''}`}>
        <div className="w-full h-full bg-white/10 backdrop-blur-xl border border-white/20 md:rounded-[2rem] shadow-2xl overflow-hidden relative">
          
          {showSplash && renderSplash()}
          {!showSplash && view === 'map' && renderMap()}
          {!showSplash && view === 'dialogue' && renderDialogue()}
          {!showSplash && view === 'level' && renderLevel()}

        </div>
      </div>

      {/* Particles Layer */}
      {particles.map(p => <Particle key={p.id} x={p.x} y={p.y} color={p.color} />)}

      <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px) rotate(-1deg); }
            75% { transform: translateX(5px) rotate(1deg); }
          }
          .animate-shake {
            animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
          .animate-float { animation: float 4s ease-in-out infinite; }
          .delay-100 { animation-delay: 0.5s; }
          .delay-150 { animation-delay: 0.75s; }
          .delay-200 { animation-delay: 1s; }
          .delay-300 { animation-delay: 1.5s; }
          .delay-400 { animation-delay: 2s; }
          .delay-500 { animation-delay: 2.5s; }
          .delay-600 { animation-delay: 3s; }

          @keyframes dash {
            to { stroke-dashoffset: -20; }
          }
          .animate-dash {
            stroke-dasharray: 10;
            animation: dash 1s linear infinite;
          }
          .animate-draw-path {
             animation: dash 20s linear infinite;
          }

          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 15s ease infinite;
          }
          .animate-gradient-xy {
            background-size: 200% 200%;
            animation: gradient-x 15s ease infinite reverse;
          }

          @keyframes drift {
            0% { transform: translateX(0px); }
            50% { transform: translateX(20px); }
            100% { transform: translateX(0px); }
          }
          .animate-drift { animation: drift 10s ease-in-out infinite; }
          
          .animate-float-slow { animation: float 10s ease-in-out infinite; }
          .perspective-1000 { perspective: 1000px; }
          .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
          .animate-spin-slow { animation: spin 8s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}