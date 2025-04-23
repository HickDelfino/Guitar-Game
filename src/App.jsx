import React, { useState, useEffect, useRef } from 'react';

const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const tuning = ['E', 'B', 'G', 'D', 'A', 'E'];
const fretMarkers = [3, 5, 7, 9, 12, 15];

const getNoteAtFret = (openNote, fret) => {
  const startIndex = allNotes.indexOf(openNote);
  return allNotes[(startIndex + fret) % 12];
};

const generateFretboard = () => {
  return tuning.map(openNote =>
    Array.from({ length: 15 }, (_, fret) => getNoteAtFret(openNote, fret))
  );
};

const getRandomPosition = (activeStrings, fretboard, includeSharps) => {
  const validPositions = [];
  for (let s of activeStrings) {
    for (let f = 0; f < 15; f++) {
      const note = fretboard[s][f];
      if (includeSharps || !note.includes('#')) {
        validPositions.push({ string: s, fret: f });
      }
    }
  }
  if (validPositions.length === 0) return { string: activeStrings[0], fret: 0 };
  return validPositions[Math.floor(Math.random() * validPositions.length)];
};

const playSound = (type) => {
  // Cria sons simples sem arquivos externos
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type === 'correct' ? 'sine' : 'square';
  osc.frequency.value = type === 'correct' ? 880 : 220;
  gain.gain.value = 0.1;
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
  osc.stop(ctx.currentTime + 0.5);
};

export default function GuitarNoteGame() {
  const [activeStrings, setActiveStrings] = useState([0,1,2,3,4,5]);
  const [includeSharps, setIncludeSharps] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [fretboard, setFretboard] = useState(() => generateFretboard());
  const [target, setTarget] = useState(() => getRandomPosition([0,1,2,3,4,5], generateFretboard(), true));
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [correctPopup, setCorrectPopup] = useState(null);
  const [timerMode, setTimerMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [highScores, setHighScores] = useState(() => JSON.parse(localStorage.getItem('highScores') || '[]'));

  const timerRef = useRef(null);

  useEffect(() => {
    const newFretboard = generateFretboard();
    setFretboard(newFretboard);
    setTarget(getRandomPosition(activeStrings, newFretboard, includeSharps));
  }, [includeSharps, activeStrings]);

  useEffect(() => {
    if (timerMode && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerMode && timeLeft === 0) {
      const updatedScores = [...highScores, score].sort((a, b) => b - a).slice(0, 5);
      setHighScores(updatedScores);
      localStorage.setItem('highScores', JSON.stringify(updatedScores));
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, timerMode]);

  const handleGuess = (note) => {
    const correctNote = fretboard[target.string][target.fret];
    if (note === correctNote) {
      playSound('correct');
      setFeedback('correct');
      setCorrectPopup(correctNote);
      setScore(score + 1);
      setTimeout(() => {
        setFeedback(null);
        setCorrectPopup(null);
        setTarget(getRandomPosition(activeStrings, fretboard, includeSharps));
      }, 700);
    } else {
      playSound('wrong');
      setFeedback('wrong');
      const container = document.getElementById('fretboard-container');
      if (container) {
        container.style.animation = 'shake 0.3s';
        setTimeout(() => container.style.animation = '', 300);
      }
      setTimeout(() => setFeedback(null), 500);
    }
  };

  const peekNotes = () => {
    setShowNotes(true);
    setTimeout(() => setShowNotes(false), 1000);
  };

  const toggleString = (index) => {
    setActiveStrings(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index].sort((a,b)=>a-b)
    );
  };

  const startPractice = () => {
    setTimerMode(false);
    setScore(0);
  };

  const startTimerGame = (duration = 60) => {
    setTimerMode(true);
    setScore(0);
    setTimeLeft(duration);
  };

  const displayNotes = includeSharps ? allNotes : naturalNotes;

  // Estilos inline para os botões
  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: '#212728',
    cursor: 'pointer',
    margin: '4px'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff'
  };

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Jogo das Notas no Braço da Guitarra</h1>
      
      <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {tuning.map((note, index) => (
          <button
            key={index}
            style={activeStrings.includes(index) ? activeButtonStyle : buttonStyle}
            onClick={() => toggleString(index)}
          >
            Corda {index+1} ({note})
          </button>
        ))}
        
        <button
          style={includeSharps ? activeButtonStyle : buttonStyle}
          onClick={() => {
            const newValue = !includeSharps;
            setIncludeSharps(newValue);
            const newFretboard = generateFretboard();
            setFretboard(newFretboard);
            setTarget(getRandomPosition(activeStrings, newFretboard, newValue));
          }}
        >
          {includeSharps ? 'Com Sustenidos' : 'Sem Sustenidos'}
        </button>
        
        <button style={buttonStyle} onClick={peekNotes}>Espiar Notas</button>
        <button style={buttonStyle} onClick={startPractice}>Modo Prática</button>
        <button style={buttonStyle} onClick={() => startTimerGame(60)}>Modo Temporizado (60s)</button>
      </div>

      {timerMode && (
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>Tempo restante: {timeLeft}s</div>
      )}

      <div 
        id="fretboard-container" 
        style={{
          position: 'relative',
          backgroundColor: '#4299e1',
          borderRadius: '4px',
          padding: '16px',
          overflowX: 'auto'
        }}
      >
        <div style={{ position: 'relative', height: `${6*40}px` }}>
          {/* Strings */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: '#e2e8f0',
                top: `${i*40+20}px`
              }} 
            />
          ))}
          
          {/* Frets */}
          {Array.from({ length: 16 }).map((_, f) => (
            <div 
              key={f} 
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '0.5px',
                backgroundColor: 'white',
                opacity: 0.5,
                left: `${(f+1)*40}px`
              }} 
            />
          ))}
          
          {/* Fret markers */}
          {fretMarkers.map(fret => {
            if (fret === 12) {
              return [1.5, 3.5].map((si, i) => (
                <div 
                  key={`${fret}-${i}`} 
                  style={{
                    position: 'absolute',
                    width: '24px',
                    height: '24px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    top: `${si*40+20}px`,
                    left: `${(fret+0.5)*40}px`,
                    transform: 'translate(-50%, -50%)'
                  }} 
                />
              ));
            }
            return (
              <div 
                key={fret} 
                style={{
                  position: 'absolute',
                  width: '24px',
                  height: '24px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  top: `${2.5*40+20}px`,
                  left: `${(fret+0.5)*40}px`,
                  transform: 'translate(-50%, -50%)'
                }} 
              />
            );
          })}
          
          {/* Target marker */}
          <div 
            style={{
              position: 'absolute',
              fontSize: '24px',
              transition: 'all 0.2s',
              color: feedback === 'correct' ? '#10b981' : feedback === 'wrong' ? '#ef4444' : 'white',
              left: `${(target.fret+0.5)*40}px`,
              top: `${target.string*40+20}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
          >
            🎯
          </div>
          
          {/* Correct popup */}
          {correctPopup && (
            <div 
              style={{
                position: 'absolute',
                fontSize: '24px',
                color: '#059669',
                fontWeight: 'bold',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '4px 8px',
                left: `${(target.fret+0.5)*40}px`,
                top: `${target.string*40}px`,
                transform: 'translate(-50%, -150%)',
                zIndex: 20
              }}
            >
              {correctPopup}
            </div>
          )}
          
          {/* Show notes when peeking */}
          {showNotes && fretboard.map((string, si) => (
            <React.Fragment key={si}>
              {string.map((note, fi) => {
                if (!includeSharps && note.includes('#')) return null;
                return (
                  <div 
                    key={`${si}-${fi}`} 
                    style={{
                      position: 'absolute',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'rgba(0, 0, 0, 0.7)',
                      left: `${(fi+0.5)*40}px`,
                      top: `${si*40+20}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {note}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
        {displayNotes.map(note => (
          <button 
            key={note} 
            style={buttonStyle}
            onClick={() => handleGuess(note)}
          >
            {note}
          </button>
        ))}
      </div>
      
      <div style={{ marginTop: '16px', fontSize: '20px' }}>Pontuação: {score}</div>

      {highScores.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Top 5 Pontuações:</h2>
          <ul style={{ listStyleType: 'decimal', paddingLeft: '24px' }}>
            {highScores.map((s, i) => (
              <li key={i}> {s} pontos</li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}