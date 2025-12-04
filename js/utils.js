// Общие утилиты
function genId() {
  return 'p_' + Math.random().toString(36).slice(2, 9);
}

function formatMoney(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function placeholderFor(name) {
  return 'https://via.placeholder.com/800x600?text=' + encodeURIComponent(name);
}

// Функция для закрытия всех модальных окон
function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.style.display = 'none';
  });
}