import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveScore, getTopScores } from './services/db';
import { playEatSound, playCrashSound, playMoveSound } from './services/audio';

// Dimensiones de la cuadrícula clásica
const GRID_SIZE = 20;

// Velocidades de refresco por dificultad (en ms)
const SPEED_CONFIG = {
  Facil: 150,
  Normal: 100,
  Dificil: 70,
};

const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

const INITIAL_DIRECTION = { x: 0, y: -1 }; // Hacia arriba

export default function App() {
  // Vistas: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'SCORES'
  const [view, setView] = useState('MENU');
  const [difficulty, setDifficulty] = useState('Normal');
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Estados de simulación en pantalla
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });

  // Refs para evitar desfases en el bucle asíncrono
  const directionRef = useRef(INITIAL_DIRECTION);
  const nextDirectionRef = useRef(INITIAL_DIRECTION);
  const snakeRef = useRef(INITIAL_SNAKE);
  const foodRef = useRef({ x: 5, y: 5 });
  const scoreRef = useRef(0);
  const gameIntervalRef = useRef(null);

  // Generar comida en posición libre
  const generateFood = useCallback((currentSnake) => {
    let newFood;
    let collisionWithSnake;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      collisionWithSnake = currentSnake.some(
        (seg) => seg.x === newFood.x && seg.y === newFood.y
      );
    } while (collisionWithSnake);

    foodRef.current = newFood;
    setFood(newFood);
  }, []);

  // Cargar lista de récords desde IndexedDB
  const loadHighScores = useCallback(async () => {
    try {
      const records = await getTopScores(5);
      setHighScores(records);
      return records;
    } catch (err) {
      console.error('Error al consultar récords:', err);
      return [];
    }
  }, []);

  // Manejar fin de partida
  const handleGameOver = useCallback(async () => {
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }

    if (soundEnabled) playCrashSound();

    const finalScore = scoreRef.current;
    let wasRecord = false;

    try {
      const currentTops = await getTopScores(1);
      const best = currentTops.length > 0 ? currentTops[0].score : 0;
      if (finalScore > best && finalScore > 0) {
        wasRecord = true;
      }

      // Guardar puntaje en IndexedDB nativo
      await saveScore(finalScore, difficulty);
      await loadHighScores();
    } catch (error) {
      console.error('Error al persistir puntaje en IndexedDB:', error);
    }

    setIsNewRecord(wasRecord);
    setView('GAME_OVER');
  }, [difficulty, soundEnabled, loadHighScores]);

  // Actualización de posición en cada paso de simulación
  const updateGameStep = useCallback(() => {
    const currentDirection = nextDirectionRef.current;
    directionRef.current = currentDirection;

    const currentSnake = snakeRef.current;
    const head = currentSnake[0];
    const newHead = {
      x: head.x + currentDirection.x,
      y: head.y + currentDirection.y,
    };

    // 1. Colisión con bordes de pantalla
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      handleGameOver();
      return;
    }

    // 2. Colisión consigo misma (cuerpo)
    const selfCollision = currentSnake.slice(0, -1).some(
      (seg) => seg.x === newHead.x && seg.y === newHead.y
    );
    if (selfCollision) {
      handleGameOver();
      return;
    }

    const currentFood = foodRef.current;
    const isEating = newHead.x === currentFood.x && newHead.y === currentFood.y;

    let newSnake;
    if (isEating) {
      newSnake = [newHead, ...currentSnake];
      const newScore = scoreRef.current + (difficulty === 'Dificil' ? 15 : difficulty === 'Normal' ? 10 : 5);
      scoreRef.current = newScore;
      setScore(newScore);

      if (soundEnabled) playEatSound();
      generateFood(newSnake);
    } else {
      newSnake = [newHead, ...currentSnake.slice(0, -1)];
      if (soundEnabled && Math.random() < 0.2) playMoveSound();
    }

    snakeRef.current = newSnake;
    setSnake(newSnake);
  }, [difficulty, soundEnabled, generateFood, handleGameOver]);

  // Inicializar nueva partida
  const startGame = () => {
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }

    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    snakeRef.current = INITIAL_SNAKE;
    scoreRef.current = 0;

    setSnake(INITIAL_SNAKE);
    setScore(0);
    setIsNewRecord(false);
    generateFood(INITIAL_SNAKE);

    setView('PLAYING');
  };

  // Gestión limpia del bucle con setInterval y Cleanup
  useEffect(() => {
    if (view === 'PLAYING') {
      const stepMs = SPEED_CONFIG[difficulty] || 100;
      gameIntervalRef.current = setInterval(updateGameStep, stepMs);
    } else {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
        gameIntervalRef.current = null;
      }
    }

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
        gameIntervalRef.current = null;
      }
    };
  }, [view, difficulty, updateGameStep]);

  // Cambiar dirección con validación para no girar 180°
  const changeDirection = useCallback((newDir) => {
    const current = directionRef.current;
    // Evitar giro opuesto directo
    if (newDir.x + current.x === 0 && newDir.y + current.y === 0) {
      return;
    }
    nextDirectionRef.current = newDir;
  }, []);

  // Manejo de teclado (Flechas y WASD)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (view !== 'PLAYING') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          changeDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          changeDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          changeDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          changeDirection({ x: 1, y: 0 });
          break;
        case 'Escape':
        case 'p':
        case 'P':
          e.preventDefault();
          setView((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, changeDirection]);

  // Pausar juego si la app se minimiza en móvil
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && view === 'PLAYING') {
        setView('PAUSED');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [view]);

  // Cargar récords al inicio
  useEffect(() => {
    loadHighScores();
  }, [loadHighScores]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-2 sm:p-4 bg-slate-950 font-retro">
      {/* Carcasa retro estilo Nokia 3310 */}
      <div className="w-full max-w-[390px] bg-nokia-bezel rounded-[45px] p-5 shadow-2xl border-4 border-slate-700/60 flex flex-col items-center">
        {/* Marca retro */}
        <div className="flex items-center justify-between w-full px-4 pt-1 pb-3 text-slate-400">
          <span className="text-xs font-bold tracking-widest text-slate-300">NOKIA</span>
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 active:scale-95 transition"
            title="Activar/Desactivar Sonido"
          >
            {soundEnabled ? '🔊 SFX' : '🔇 MUTE'}
          </button>
        </div>

        {/* Marco y Pantalla LCD Monocromática */}
        <div className="w-full p-3 rounded-2xl bg-[#76805b] shadow-nokia-inset border-2 border-nokia-dark/30">
          <div className="w-full aspect-[4/3] rounded-lg lcd-screen p-2.5 flex flex-col justify-between text-nokia-dark select-none overflow-hidden relative border border-nokia-dark/40">
            {/* Header / Barra superior del juego */}
            <div className="flex justify-between items-center text-[11px] font-bold pb-1 border-b border-nokia-dark/30 uppercase tracking-tighter">
              <span>{difficulty}</span>
              <span className="text-center font-pixel text-xs">SNAKE</span>
              <span>PTS: {score}</span>
            </div>

            {/* VISTA: MENÚ PRINCIPAL */}
            {view === 'MENU' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-1 text-center">
                <div className="text-lg font-pixel tracking-wider font-black">SNAKE 3310</div>
                <p className="text-[10px] leading-tight opacity-90">EL CLÁSICO DE NOKIA</p>

                <div className="flex flex-col gap-1.5 w-full max-w-[170px] mt-1">
                  <button
                    onClick={startGame}
                    className="w-full py-1 text-xs font-bold bg-nokia-dark text-nokia-bg rounded active:opacity-80"
                  >
                    ▶ JUGAR
                  </button>
                  <button
                    onClick={() => {
                      loadHighScores();
                      setView('SCORES');
                    }}
                    className="w-full py-1 text-xs font-bold border border-nokia-dark rounded active:bg-nokia-dark/10"
                  >
                    🏆 RÉCORDS
                  </button>
                </div>

                {/* Selector de Dificultad */}
                <div className="flex items-center gap-1 mt-1 text-[10px]">
                  <span>NIVEL:</span>
                  {['Facil', 'Normal', 'Dificil'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        difficulty === lvl
                          ? 'bg-nokia-dark text-nokia-bg'
                          : 'border border-nokia-dark/40'
                      }`}
                    >
                      {lvl[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA: JUEGO ACTIVO O PAUSADO */}
            {(view === 'PLAYING' || view === 'PAUSED') && (
              <div className="flex-1 relative flex items-center justify-center my-1">
                {/* Cuadrícula del juego */}
                <div
                  className="grid w-full h-full border border-nokia-dark/30 bg-nokia-bg/50"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                    const x = idx % GRID_SIZE;
                    const y = Math.floor(idx / GRID_SIZE);

                    const isSnakeHead = snake[0].x === x && snake[0].y === y;
                    const isSnakeBody = snake.slice(1).some((s) => s.x === x && s.y === y);
                    const isFood = food.x === x && food.y === y;

                    return (
                      <div
                        key={idx}
                        className={`w-full h-full ${
                          isSnakeHead
                            ? 'bg-nokia-dark border-[0.5px] border-nokia-bg rounded-xs'
                            : isSnakeBody
                            ? 'bg-nokia-dark/90'
                            : isFood
                            ? 'bg-nokia-dark animate-pulse scale-90 rounded-full'
                            : ''
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Overlay de Pausa */}
                {view === 'PAUSED' && (
                  <div className="absolute inset-0 bg-nokia-bg/90 backdrop-blur-[1px] flex flex-col items-center justify-center">
                    <span className="text-sm font-black font-pixel mb-2">PAUSA</span>
                    <button
                      onClick={() => setView('PLAYING')}
                      className="px-3 py-1 text-xs bg-nokia-dark text-nokia-bg rounded font-bold"
                    >
                      REANUDAR
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VISTA: GAME OVER */}
            {view === 'GAME_OVER' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center py-1">
                <div className="text-base font-black font-pixel tracking-wider">¡FIN DEL JUEGO!</div>
                {isNewRecord && (
                  <span className="text-[10px] font-bold bg-nokia-dark text-nokia-bg px-2 py-0.5 rounded animate-bounce">
                    ★ ¡NUEVO RÉCORD! ★
                  </span>
                )}
                <div className="text-xs font-bold mt-1">PUNTAJE: {score}</div>
                <p className="text-[9px] opacity-80 mb-1">Guardado en memoria local</p>

                <div className="flex flex-col gap-1 w-full max-w-[150px]">
                  <button
                    onClick={startGame}
                    className="w-full py-1 text-xs font-bold bg-nokia-dark text-nokia-bg rounded active:opacity-80"
                  >
                    REINTENTAR
                  </button>
                  <button
                    onClick={() => setView('MENU')}
                    className="w-full py-1 text-xs font-bold border border-nokia-dark rounded active:bg-nokia-dark/10"
                  >
                    MENÚ
                  </button>
                </div>
              </div>
            )}

            {/* VISTA: MEJORES PUNTAJES (HALL OF FAME) */}
            {view === 'SCORES' && (
              <div className="flex-1 flex flex-col justify-between py-1 text-xs">
                <div className="font-bold text-center border-b border-nokia-dark/20 pb-0.5">
                  🏆 TOP 5 RÉCORDS
                </div>

                <div className="flex-1 flex flex-col justify-center gap-1 my-1 px-1">
                  {highScores.length === 0 ? (
                    <div className="text-[10px] text-center opacity-70">
                      Sin partidas registradas aún.
                    </div>
                  ) : (
                    highScores.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex justify-between items-center text-[10px] border-b border-nokia-dark/10 pb-0.5"
                      >
                        <span className="font-bold">
                          #{idx + 1} ({item.difficulty || 'Norm'})
                        </span>
                        <span className="font-pixel text-[11px] font-black">{item.score} PTS</span>
                        <span className="text-[8px] opacity-75">
                          {new Date(item.date).toLocaleDateString([], {
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setView('MENU')}
                  className="w-full py-1 text-[11px] font-bold bg-nokia-dark text-nokia-bg rounded text-center"
                >
                  VOLVER AL MENÚ
                </button>
              </div>
            )}

            {/* Footer de pantalla */}
            <div className="text-[9px] flex justify-between items-center pt-0.5 opacity-80 border-t border-nokia-dark/20">
              <span>{view === 'PLAYING' ? 'EN VIVO' : 'NOKIA OS'}</span>
              <span>BAT: 100% ▮▮▮</span>
            </div>
          </div>
        </div>

        {/* Botones de Función Superiores (Menú / Salir) */}
        <div className="w-full flex justify-between px-6 mt-4 mb-2">
          <button
            onClick={() => {
              if (view === 'PLAYING') setView('PAUSED');
              else if (view === 'PAUSED') setView('PLAYING');
              else setView('MENU');
            }}
            className="w-14 h-7 rounded-full bg-nokia-keypad text-[10px] font-bold text-nokia-keypadText shadow-keypad active:shadow-keypad-pressed active:translate-y-0.5 transition"
          >
            {view === 'PLAYING' ? 'PAUSA' : 'MENÚ'}
          </button>
          <div className="w-12 h-2 rounded-full bg-slate-700/50 self-center"></div>
          <button
            onClick={() => {
              if (view === 'PLAYING' || view === 'PAUSED') setView('MENU');
            }}
            className="w-14 h-7 rounded-full bg-nokia-keypad text-[10px] font-bold text-nokia-keypadText shadow-keypad active:shadow-keypad-pressed active:translate-y-0.5 transition"
          >
            SALIR
          </button>
        </div>

        {/* D-PAD TÁCTIL (Controles direccionales para Móvil en Grilla Ergonómica) */}
        <div className="mt-2 mb-3 flex flex-col items-center">
          {/* Botón ARRIBA */}
          <button
            onClick={() => changeDirection({ x: 0, y: -1 })}
            className="w-16 h-12 rounded-t-2xl bg-nokia-keypad text-nokia-keypadText font-black text-lg shadow-keypad active:shadow-keypad-pressed active:translate-y-0.5 transition flex items-center justify-center border-t border-slate-500/30"
            aria-label="Arriba"
          >
            ▲
          </button>

          <div className="flex gap-4 my-1">
            {/* Botón IZQUIERDA */}
            <button
              onClick={() => changeDirection({ x: -1, y: 0 })}
              className="w-16 h-12 rounded-l-2xl bg-nokia-keypad text-nokia-keypadText font-black text-lg shadow-keypad active:shadow-keypad-pressed active:translate-y-0.5 transition flex items-center justify-center border-l border-slate-500/30"
              aria-label="Izquierda"
            >
              ◀
            </button>

            {/* Centro decorativo / OK */}
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-[9px] text-slate-400 font-bold">
              OK
            </div>

            {/* Botón DERECHA */}
            <button
              onClick={() => changeDirection({ x: 1, y: 0 })}
              className="w-16 h-12 rounded-r-2xl bg-nokia-keypad text-nokia-keypadText font-black text-lg shadow-keypad active:shadow-keypad-pressed active:translate-y-0.5 transition flex items-center justify-center border-r border-slate-500/30"
              aria-label="Derecha"
            >
              ▶
            </button>
          </div>

          {/* Botón ABAJO */}
          <button
            onClick={() => changeDirection({ x: 0, y: 1 })}
            className="w-16 h-12 rounded-b-2xl bg-nokia-keypad text-nokia-keypadText font-black text-lg shadow-keypad active:shadow-keypad-pressed active:translate-y-0.5 transition flex items-center justify-center border-b border-slate-500/30"
            aria-label="Abajo"
          >
            ▼
          </button>
        </div>

        {/* Leyenda inferior */}
        <p className="text-[10px] text-slate-500 text-center tracking-tight">
          Teclado: Flechas o WASD | Táctil: Botones en pantalla
        </p>
      </div>
    </main>
  );
}
