// Показать уведомление с автоматическим удалением
function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notificationArea');
    if (!notificationArea) return;

    const alertTypes = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };

    const icons = {
        'success': 'bi-check-circle-fill',
        'error': 'bi-exclamation-circle-fill',
        'warning': 'bi-exclamation-triangle-fill',
        'info': 'bi-info-circle-fill'
    };

    const alertClass = alertTypes[type] || 'alert-info';
    const iconClass = icons[type] || 'bi-info-circle-fill';

    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible
                             fade show notification`;
    notification.innerHTML = `
        <i class="bi ${iconClass} me-2"></i>
        ${message}
        <button type="button" class="btn-close"
                data-bs-dismiss="alert"></button>
    `;

    notificationArea.appendChild(notification);

    // Удалить уведомление через 5 секунд
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Форматировать цену в рублях
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// Форматировать дату в формате ДД.ММ.ГГГГ
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Форматировать дату и время
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Обрезать время до формата ЧЧ:ММ
function formatTime(timeString) {
    return timeString.substring(0, 5);
}

// Форматировать дату и время без секунд
function formatDateTimeWithoutSeconds(dateString, timeString) {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const formattedTime = formatTime(timeString);
    return `${formattedDate} ${formattedTime}`;
}

// Склонение числительных по русским правилам
function pluralize(number, one, few, many) {
    const mod10 = number % 10;
    const mod100 = number % 100;

    if (mod10 === 1 && mod100 !== 11) {
        return `${number} ${one}`;
    } else if (mod10 >= 2 && mod10 <= 4 &&
               (mod100 < 10 || mod100 >= 20)) {
        return `${number} ${few}`;
    } else {
        return `${number} ${many}`;
    }
}

// Получить CSS класс для бейджа уровня
function getLevelBadgeClass(level) {
    const levelMap = {
        'Beginner': 'beginner',
        'Intermediate': 'intermediate',
        'Advanced': 'advanced'
    };
    return levelMap[level] || 'beginner';
}

// Перевести уровень на русский язык
function getLevelText(level) {
    const levelMap = {
        'Beginner': 'Начальный',
        'Intermediate': 'Средний',
        'Advanced': 'Продвинутый'
    };
    return levelMap[level] || level;
}

// Проверить является ли день выходным
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

// Проверить является ли дата праздничным днём
function isHoliday(date) {
    // Праздничные дни в России на 2025-2026 годы
    const holidays = [
        // 2025
        '2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04',
        '2025-01-05', '2025-01-06', '2025-01-07', '2025-01-08',
        '2025-02-23', '2025-03-08', '2025-05-01', '2025-05-09',
        '2025-06-12', '2025-11-04',
        // 2026
        '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04',
        '2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08',
        '2026-02-23', '2026-03-08', '2026-05-01', '2026-05-09',
        '2026-06-12', '2026-11-04'
    ];

    const dateStr = date.toISOString().split('T')[0];
    return holidays.includes(dateStr);
}

// Получить множитель цены для выходных
function getWeekendMultiplier(dateString) {
    const date = new Date(dateString);
    return (isWeekend(date) || isHoliday(date)) ? 1.5 : 1;
}

// Рассчитать надбавку за время занятия
function getTimeSurcharge(timeString) {
    const hour = parseInt(timeString.split(':')[0]);
    let surcharge = 0;

    // Утренняя надбавка
    if (hour >= 9 && hour < 12) {
        surcharge += 400;
    }

    // Вечерняя надбавка
    if (hour >= 18 && hour < 20) {
        surcharge += 1000;
    }

    return surcharge;
}

// Рассчитать дату окончания курса
function calculateEndDate(startDateStr, weeks) {
    const date = new Date(startDateStr);
    date.setDate(date.getDate() + (weeks * 7));
    return date;
}

// Отформатировать дату окончания курса
function formatEndDate(startDateStr, weeks) {
    const endDate = calculateEndDate(startDateStr, weeks);
    return formatDate(endDate.toISOString().split('T')[0]);
}

// Проверить ранняя ли это регистрация
function isEarlyRegistration(startDate) {
    const today = new Date();
    const start = new Date(startDate);
    const diffTime = start - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 30;
}

// Задержка выполнения функции для оптимизации
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function generatePagination(currentPage, totalPages, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (totalPages <= 1) return;

    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';

    const createPageItem = (page, text, disabled = false, 
                           active = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} 
                        ${active ? 'active' : ''}`;

        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = text || page;

        if (!disabled) {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                return page;
            });
        }

        li.appendChild(a);
        return li;
    };

    ul.appendChild(createPageItem(currentPage - 1, 'Назад', 
                                  currentPage === 1));

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || 
            (i >= currentPage - 1 && i <= currentPage + 1)) {
            ul.appendChild(createPageItem(i, i, false, 
                                         i === currentPage));
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = '<span class="page-link">...</span>';
            ul.appendChild(li);
        }
    }

    ul.appendChild(createPageItem(currentPage + 1, 'Вперед', 
                                  currentPage === totalPages));

    container.appendChild(ul);
}