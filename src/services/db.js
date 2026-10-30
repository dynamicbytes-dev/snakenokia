// src/services/db.js
// Servicio asíncrono puro utilizando la API estándar de IndexedDB (sin librerías externas)

const DB_NAME = 'NokiaSnakeDB';
const DB_VERSION = 1;
const STORE_NAME = 'scores';

/**
 * Abre o crea la conexión con IndexedDB.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB no es compatible con este dispositivo.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        // Índice por puntaje para ordenar rápidamente de mayor a menor
        store.createIndex('by_score', 'score', { unique: false });
        store.createIndex('by_date', 'date', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Error al conectar con IndexedDB'));
    };
  });
}

/**
 * Guarda un registro de puntaje en la base de datos local.
 * @param {number} score - Puntaje alcanzado
 * @param {string} difficulty - Nivel de dificultad (Fácil, Normal, Difícil)
 * @returns {Promise<number>} ID del registro generado
 */
export async function saveScore(score, difficulty = 'Normal') {
  if (typeof score !== 'number' || score < 0) {
    throw new Error('Puntaje inválido.');
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      score,
      difficulty,
      date: new Date().toISOString(),
    };

    const request = store.add(record);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('No se pudo guardar el puntaje.'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Consulta y retorna los mejores puntajes históricos guardados localmente.
 * @param {number} limit - Límite de registros a recuperar (default 5)
 * @returns {Promise<Array<{id: number, score: number, difficulty: string, date: string}>>}
 */
export async function getTopScores(limit = 5) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('by_score');

    const topScores = [];
    // 'prev' permite recorrer el índice de mayor a menor
    const request = index.openCursor(null, 'prev');

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && topScores.length < limit) {
        topScores.push(cursor.value);
        cursor.continue();
      } else {
        resolve(topScores);
      }
    };

    request.onerror = () => {
      reject(request.error || new Error('Error al leer los puntajes.'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Limpia el historial de puntajes.
 * @returns {Promise<void>}
 */
export async function clearAllScores() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Error al limpiar puntajes.'));

    transaction.oncomplete = () => {
      db.close();
    };
  });
}
