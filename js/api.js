const API_CONFIG = {
    // На сайте nginx проксирует учебный API под тем же доменом (иначе HTTPS-страница блокирует
    // запросы к HTTP-API как mixed content). Для запуска с локального диска — полный адрес:
    // http://exam-api-courses.std-900.ist.mospolytech.ru/api
    baseUrl: '/api',
    apiKey: '358a63a5-52ae-4ab0-800b-90f75ce5a5c2'
};

// Хранилище контактных данных в локальном хранилище
const ContactDataStorage = {
    // Сохранить данные контакта для заявки
    save(orderId, data) {
        const storageKey = `order_contact_${orderId}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
    },

    // Получить данные контакта по ID заявки
    get(orderId) {
        const storageKey = `order_contact_${orderId}`;
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : null;
    },

    // Удалить данные контакта из хранилища
    remove(orderId) {
        const storageKey = `order_contact_${orderId}`;
        localStorage.removeItem(storageKey);
    }
};

// Добавить API-ключ к URL запроса
function addApiKey(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}api_key=${API_CONFIG.apiKey}`;
}

// Отправить запрос к API с обработкой ошибок
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = addApiKey(`${API_CONFIG.baseUrl}${endpoint}`);

    const options = {
        method,
        headers: {'Content-Type': 'application/json'}
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Ошибка сервера');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Загрузить список курсов и отобразить
async function loadCourses() {
    try {
        AppState.courses = await apiRequest('/courses');
        AppState.filteredCourses = [...AppState.courses];
        renderCourses();
    } catch (error) {
        showNotification('Ошибка загрузки курсов: ' +
                        error.message, 'error');
    }
}

// Загрузить список репетиторов и отобразить
async function loadTutors() {
    try {
        AppState.tutors = await apiRequest('/tutors');
        AppState.filteredTutors = [...AppState.tutors];
        populateLanguageFilter();
        renderTutors();
    } catch (error) {
        showNotification('Ошибка загрузки репетиторов: ' +
                        error.message, 'error');
    }
}

// Загрузить список заявок и обновить интерфейс
async function loadOrders() {
    try {
        AppState.orders = await apiRequest('/orders');
        renderOrders();
        updateUserInfo();
    } catch (error) {
        showNotification('Ошибка загрузки заявок: ' +
                        error.message, 'error');
    }
}

// Создать новую заявку и сохранить контакты
async function createOrder(orderData, contactData) {
    try {
        const result = await apiRequest('/orders', 'POST', orderData);
        ContactDataStorage.save(result.id, contactData);
        showNotification('Заявка успешно создана!', 'success');
        return result;
    } catch (error) {
        showNotification('Ошибка создания заявки: ' +
                        error.message, 'error');
        throw error;
    }
}

// Обновить существующую заявку и контакты
async function updateOrder(orderId, orderData, contactData) {
    try {
        const result = await apiRequest(`/orders/${orderId}`,
                                       'PUT', orderData);
        if (contactData) {
            ContactDataStorage.save(orderId, contactData);
        }
        showNotification('Заявка успешно обновлена!', 'success');
        return result;
    } catch (error) {
        showNotification('Ошибка обновления заявки: ' +
                        error.message, 'error');
        throw error;
    }
}

// Удалить заявку и её контактные данные
async function deleteOrder(orderId) {
    try {
        const result = await apiRequest(`/orders/${orderId}`, 'DELETE');
        ContactDataStorage.remove(orderId);
        showNotification('Заявка успешно удалена!', 'success');
        return result;
    } catch (error) {
        showNotification('Ошибка удаления заявки: ' +
                        error.message, 'error');
        throw error;
    }
}

// Получить заявку по ID
async function getOrder(orderId) {
    try {
        return await apiRequest(`/orders/${orderId}`);
    } catch (error) {
        showNotification('Ошибка получения заявки: ' +
                        error.message, 'error');
        throw error;
    }
}

// Получить курс по ID
async function getCourse(courseId) {
    try {
        return await apiRequest(`/courses/${courseId}`);
    } catch (error) {
        showNotification('Ошибка получения курса: ' +
                        error.message, 'error');
        throw error;
    }
}

// Получить репетитора по ID
async function getTutor(tutorId) {
    try {
        return await apiRequest(`/tutors/${tutorId}`);
    } catch (error) {
        showNotification('Ошибка получения репетитора: ' +
                        error.message, 'error');
        throw error;
    }
}