/**
 * preload.js — Puente seguro entre el proceso principal (Node) y el renderer (UI)
 * 
 * Usa contextBridge para exponer una API limitada y segura al frontend,
 * sin dar acceso directo a Node.js ni al sistema de archivos.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  /**
   * Obtiene todos los libros.
   * @returns {Promise<Array>} Lista de libros.
   */
  getAllBooks: () => ipcRenderer.invoke('get-all-books'),

  /**
   * Busca libros por un término.
   * @param {string} query — Texto de búsqueda.
   * @returns {Promise<Array>} Libros encontrados.
   */
  searchBooks: (query) => ipcRenderer.invoke('search-books', query),

  /**
   * Agrega un nuevo libro.
   * @param {Object} book — Datos del libro.
   * @returns {Promise<Object>} Libro creado con su ID.
   */
  addBook: (book) => ipcRenderer.invoke('add-book', book),

  /**
   * Actualiza un libro existente.
   * @param {number} id — ID del libro.
   * @param {Object} book — Nuevos datos.
   * @returns {Promise<Object>} Resultado de la operación.
   */
  updateBook: (id, book) => ipcRenderer.invoke('update-book', id, book),

  /**
   * Elimina un libro por ID.
   * @param {number} id — ID del libro.
   * @returns {Promise<Object>} Resultado de la operación.
   */
  deleteBook: (id) => ipcRenderer.invoke('delete-book', id),

  /**
   * Obtiene la cantidad total de libros.
   * @returns {Promise<number>} Total de registros.
   */
  getBookCount: () => ipcRenderer.invoke('get-book-count')
});
