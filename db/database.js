/**
 * database.js — Módulo de base de datos SQLite para la Biblioteca Leopoldo Lugones
 * 
 * Gestiona la conexión con la base de datos SQLite usando better-sqlite3
 * y expone funciones CRUD para la tabla "books".
 */

const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

/**
 * Inicializa la base de datos. Crea la tabla "books" si no existe.
 * En producción, la base de datos se almacena en userData para tener permisos de escritura.
 * En desarrollo, se almacena en la carpeta del proyecto.
 */
function initDatabase() {
  const isProd = app.isPackaged;
  const dbPath = isProd
    ? path.join(app.getPath('userData'), 'biblioteca.db')
    : path.join(__dirname, '..', 'biblioteca.db');

  db = new Database(dbPath);

  // Optimizaciones de rendimiento para manejar 6000+ registros
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache

  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      inventory_number TEXT NOT NULL,
      subject TEXT NOT NULL,
      tutor_name TEXT NOT NULL,
      topic TEXT NOT NULL
    )
  `);

  // Crear índices para búsquedas rápidas
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_title ON books(title);
    CREATE INDEX IF NOT EXISTS idx_inventory ON books(inventory_number);
    CREATE INDEX IF NOT EXISTS idx_subject ON books(subject);
    CREATE INDEX IF NOT EXISTS idx_tutor ON books(tutor_name);
    CREATE INDEX IF NOT EXISTS idx_topic ON books(topic);
  `);

  return db;
}

/**
 * Obtiene todos los libros de la base de datos.
 * @returns {Array} Lista de todos los registros de libros.
 */
function getAllBooks() {
  const stmt = db.prepare('SELECT * FROM books ORDER BY id DESC');
  return stmt.all();
}

/**
 * Busca libros filtrando por un término en todos los campos.
 * @param {string} query — Término de búsqueda.
 * @returns {Array} Lista de libros que coinciden con la búsqueda.
 */
function searchBooks(query) {
  const searchTerm = `%${query}%`;
  const stmt = db.prepare(`
    SELECT * FROM books 
    WHERE title LIKE @q 
       OR inventory_number LIKE @q 
       OR subject LIKE @q 
       OR tutor_name LIKE @q 
       OR topic LIKE @q
    ORDER BY id DESC
  `);
  return stmt.all({ q: searchTerm });
}

/**
 * Agrega un nuevo libro a la base de datos.
 * @param {Object} book — Datos del libro.
 * @returns {Object} Resultado con el ID del nuevo registro.
 */
function addBook(book) {
  const stmt = db.prepare(`
    INSERT INTO books (title, inventory_number, subject, tutor_name, topic)
    VALUES (@title, @inventory_number, @subject, @tutor_name, @topic)
  `);
  const result = stmt.run(book);
  return { id: result.lastInsertRowid, ...book };
}

/**
 * Actualiza un libro existente por su ID.
 * @param {number} id — ID del libro a actualizar.
 * @param {Object} book — Nuevos datos del libro.
 * @returns {Object} Información del resultado de la operación.
 */
function updateBook(id, book) {
  const stmt = db.prepare(`
    UPDATE books 
    SET title = @title, 
        inventory_number = @inventory_number, 
        subject = @subject, 
        tutor_name = @tutor_name, 
        topic = @topic
    WHERE id = @id
  `);
  return stmt.run({ id, ...book });
}

/**
 * Elimina un libro por su ID.
 * @param {number} id — ID del libro a eliminar.
 * @returns {Object} Información del resultado de la operación.
 */
function deleteBook(id) {
  const stmt = db.prepare('DELETE FROM books WHERE id = @id');
  return stmt.run({ id });
}

/**
 * Obtiene el total de libros registrados.
 * @returns {number} Cantidad total de registros.
 */
function getBookCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM books');
  return stmt.get().count;
}

/**
 * Cierra la conexión con la base de datos.
 */
function closeDatabase() {
  if (db) {
    db.close();
  }
}

module.exports = {
  initDatabase,
  getAllBooks,
  searchBooks,
  addBook,
  updateBook,
  deleteBook,
  getBookCount,
  closeDatabase
};
