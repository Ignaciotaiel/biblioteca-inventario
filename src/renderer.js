/**
 * renderer.js — Lógica del frontend para la Biblioteca Leopoldo Lugones
 * 
 * Maneja la interfaz de usuario: renderizado de la tabla, formularios,
 * búsquedas, modales y notificaciones toast.
 */

// ═══════════════════════════════════════════════════
// DOM Elements
// ═══════════════════════════════════════════════════

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const addBookBtn = document.getElementById('addBookBtn');
const booksTableBody = document.getElementById('booksTableBody');
const booksTable = document.getElementById('booksTable');
const emptyState = document.getElementById('emptyState');
const noResultsState = document.getElementById('noResultsState');
const bookCountBadge = document.getElementById('bookCountBadge');

// Modal — Add/Edit
const bookModal = document.getElementById('bookModal');
const modalTitle = document.getElementById('modalTitle');
const bookForm = document.getElementById('bookForm');
const bookId = document.getElementById('bookId');
const bookTitle = document.getElementById('bookTitle');
const bookInventory = document.getElementById('bookInventory');
const bookSubject = document.getElementById('bookSubject');
const bookTutor = document.getElementById('bookTutor');
const bookTopic = document.getElementById('bookTopic');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const submitFormBtn = document.getElementById('submitFormBtn');

// Modal — Delete
const deleteModal = document.getElementById('deleteModal');
const deleteBookTitle = document.getElementById('deleteBookTitle');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Toast container
const toastContainer = document.getElementById('toastContainer');

// ═══════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════

let currentDeleteId = null;
let searchTimeout = null;

// ═══════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
  updateBookCount();
  setupEventListeners();
});

// ═══════════════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════════════

function setupEventListeners() {
  // Search — debounced
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();
    clearSearchBtn.style.display = query ? 'flex' : 'none';
    searchTimeout = setTimeout(() => {
      if (query.length > 0) {
        searchBooks(query);
      } else {
        loadBooks();
      }
    }, 250);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    loadBooks();
    searchInput.focus();
  });

  // Add book button
  addBookBtn.addEventListener('click', () => openAddModal());

  // Form submit
  bookForm.addEventListener('submit', handleFormSubmit);

  // Close / Cancel modals
  closeModalBtn.addEventListener('click', closeBookModal);
  cancelFormBtn.addEventListener('click', closeBookModal);
  closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', handleDelete);

  // Close modals on overlay click
  bookModal.addEventListener('click', (e) => {
    if (e.target === bookModal) closeBookModal();
  });
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (bookModal.style.display !== 'none') closeBookModal();
      if (deleteModal.style.display !== 'none') closeDeleteModal();
    }
  });
}

// ═══════════════════════════════════════════════════
// Data Loading
// ═══════════════════════════════════════════════════

/**
 * Carga todos los libros y los renderiza en la tabla.
 */
async function loadBooks() {
  const result = await window.api.getAllBooks();
  if (result.success) {
    renderBooks(result.data);
  } else {
    showToast('Error al cargar los libros: ' + result.error, 'error');
  }
}

/**
 * Busca libros según el término ingresado.
 * @param {string} query — Término de búsqueda.
 */
async function searchBooks(query) {
  const result = await window.api.searchBooks(query);
  if (result.success) {
    renderBooks(result.data, true);
  } else {
    showToast('Error en la búsqueda: ' + result.error, 'error');
  }
}

/**
 * Actualiza el contador de libros en el badge del header.
 */
async function updateBookCount() {
  const result = await window.api.getBookCount();
  if (result.success) {
    const count = result.data;
    bookCountBadge.textContent = count === 1 
      ? '1 libro registrado' 
      : `${count.toLocaleString('es-AR')} libros registrados`;
  }
}

// ═══════════════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════════════

/**
 * Renderiza la lista de libros en la tabla HTML.
 * @param {Array} books — Lista de libros.
 * @param {boolean} isSearch — Indica si es resultado de búsqueda.
 */
function renderBooks(books, isSearch = false) {
  booksTableBody.innerHTML = '';

  if (books.length === 0) {
    booksTable.style.display = 'none';
    if (isSearch) {
      emptyState.style.display = 'none';
      noResultsState.style.display = 'block';
    } else {
      emptyState.style.display = 'block';
      noResultsState.style.display = 'none';
    }
    return;
  }

  booksTable.style.display = 'table';
  emptyState.style.display = 'none';
  noResultsState.style.display = 'none';

  books.forEach(book => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-id">${book.id}</td>
      <td class="td-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</td>
      <td title="${escapeHtml(book.inventory_number)}">${escapeHtml(book.inventory_number)}</td>
      <td title="${escapeHtml(book.subject)}">${escapeHtml(book.subject)}</td>
      <td title="${escapeHtml(book.tutor_name)}">${escapeHtml(book.tutor_name)}</td>
      <td title="${escapeHtml(book.topic)}">${escapeHtml(book.topic)}</td>
      <td class="td-actions">
        <div class="action-buttons">
          <button class="btn-icon btn-icon-edit" title="Editar" data-id="${book.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon btn-icon-delete" title="Eliminar" data-id="${book.id}" data-title="${escapeHtml(book.title)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    `;
    booksTableBody.appendChild(tr);
  });

  // Attach event listeners to action buttons
  booksTableBody.querySelectorAll('.btn-icon-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(Number(btn.dataset.id)));
  });

  booksTableBody.querySelectorAll('.btn-icon-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      openDeleteModal(Number(btn.dataset.id), btn.dataset.title);
    });
  });
}

// ═══════════════════════════════════════════════════
// Modal — Add / Edit
// ═══════════════════════════════════════════════════

/**
 * Abre el modal en modo "Agregar".
 */
function openAddModal() {
  modalTitle.textContent = 'Agregar Nuevo Libro';
  submitFormBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
    Guardar
  `;
  bookForm.reset();
  bookId.value = '';
  bookModal.style.display = 'flex';
  bookTitle.focus();
}

/**
 * Abre el modal en modo "Editar" con los datos del libro cargados.
 * @param {number} id — ID del libro a editar.
 */
async function openEditModal(id) {
  const result = await window.api.getAllBooks();
  if (!result.success) {
    showToast('Error al cargar el libro', 'error');
    return;
  }

  const book = result.data.find(b => b.id === id);
  if (!book) {
    showToast('Libro no encontrado', 'error');
    return;
  }

  modalTitle.textContent = 'Editar Libro';
  submitFormBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
    Actualizar
  `;

  bookId.value = book.id;
  bookTitle.value = book.title;
  bookInventory.value = book.inventory_number;
  bookSubject.value = book.subject;
  bookTutor.value = book.tutor_name;
  bookTopic.value = book.topic;

  bookModal.style.display = 'flex';
  bookTitle.focus();
}

/**
 * Cierra el modal de agregar/editar.
 */
function closeBookModal() {
  bookModal.style.display = 'none';
  bookForm.reset();
  bookId.value = '';
}

/**
 * Maneja el submit del formulario (agregar o editar).
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const data = {
    title: bookTitle.value.trim(),
    inventory_number: bookInventory.value.trim(),
    subject: bookSubject.value.trim(),
    tutor_name: bookTutor.value.trim(),
    topic: bookTopic.value.trim()
  };

  // Validar que todos los campos estén completos
  if (!data.title || !data.inventory_number || !data.subject || !data.tutor_name || !data.topic) {
    showToast('Todos los campos son obligatorios', 'error');
    return;
  }

  const editingId = bookId.value;

  if (editingId) {
    // Editar libro existente
    const result = await window.api.updateBook(Number(editingId), data);
    if (result.success) {
      showToast('Libro actualizado correctamente', 'success');
    } else {
      showToast('Error al actualizar: ' + result.error, 'error');
      return;
    }
  } else {
    // Agregar nuevo libro
    const result = await window.api.addBook(data);
    if (result.success) {
      showToast('Libro agregado correctamente', 'success');
    } else {
      showToast('Error al agregar: ' + result.error, 'error');
      return;
    }
  }

  closeBookModal();

  // Recargar según si hay búsqueda activa o no
  const query = searchInput.value.trim();
  if (query) {
    searchBooks(query);
  } else {
    loadBooks();
  }
  updateBookCount();
}

// ═══════════════════════════════════════════════════
// Modal — Delete Confirmation
// ═══════════════════════════════════════════════════

/**
 * Abre el modal de confirmación de eliminación.
 * @param {number} id — ID del libro a eliminar.
 * @param {string} title — Título del libro (para mostrar al usuario).
 */
function openDeleteModal(id, title) {
  currentDeleteId = id;
  deleteBookTitle.textContent = `"${title}"`;
  deleteModal.style.display = 'flex';
}

/**
 * Cierra el modal de eliminación.
 */
function closeDeleteModal() {
  deleteModal.style.display = 'none';
  currentDeleteId = null;
}

/**
 * Ejecuta la eliminación del libro.
 */
async function handleDelete() {
  if (!currentDeleteId) return;

  const result = await window.api.deleteBook(currentDeleteId);
  if (result.success) {
    showToast('Libro eliminado correctamente', 'success');
  } else {
    showToast('Error al eliminar: ' + result.error, 'error');
  }

  closeDeleteModal();

  const query = searchInput.value.trim();
  if (query) {
    searchBooks(query);
  } else {
    loadBooks();
  }
  updateBookCount();
}

// ═══════════════════════════════════════════════════
// Toast Notifications
// ═══════════════════════════════════════════════════

/**
 * Muestra una notificación toast.
 * @param {string} message — Mensaje a mostrar.
 * @param {string} type — Tipo: 'success', 'error' o 'info'.
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = '';
  if (type === 'success') {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = icon + `<span>${message}</span>`;
  toastContainer.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ═══════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════

/**
 * Escapa caracteres HTML para prevenir inyección XSS.
 * @param {string} text — Texto a escapar.
 * @returns {string} Texto seguro para insertar en HTML.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
