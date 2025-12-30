const AccountState = {
    orders: [],
    courses: [],
    tutors: [],
    currentOrderPage: 1,
    ordersPerPage: 5,
    editingOrder: null
};

document.addEventListener('DOMContentLoaded', () => {
    initAccount();
});

// Инициализировать страницу личного кабинета
async function initAccount() {
    await loadAccountData();
    setupAccountEventListeners();
}

// Загрузить данные аккаунта с сервера
async function loadAccountData() {
    try {
        AccountState.orders = await apiRequest('/orders');
        AccountState.courses = await apiRequest('/courses');
        AccountState.tutors = await apiRequest('/tutors');
        renderOrders();
        updateOrdersCount();
    } catch (error) {
        showNotification('Ошибка загрузки данных: ' +
                        error.message, 'error');
    }
}

// Настроить обработчики событий для страницы
function setupAccountEventListeners() {
    const saveOrderChanges = document.getElementById('saveOrderChanges');
    if (saveOrderChanges) {
        saveOrderChanges.addEventListener('click', saveOrderEdit);
    }

    const confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) {
        confirmDelete.addEventListener('click', confirmOrderDeletion);
    }

    const editCourseStartDate =
        document.getElementById('editCourseStartDate');
    if (editCourseStartDate) {
        editCourseStartDate.addEventListener('change',
                                            updateEditCourseTimeSlots);
    }

    const editCourseStartTime =
        document.getElementById('editCourseStartTime');
    if (editCourseStartTime) {
        editCourseStartTime.addEventListener('change',
                                            calculateEditCoursePrice);
    }

    const editStudentsNumber =
        document.getElementById('editStudentsNumber');
    if (editStudentsNumber) {
        editStudentsNumber.addEventListener('input', 
                                           calculateEditCoursePrice);
    }

    const editCheckboxes = ['editSupplementary', 'editPersonalized',
                           'editExcursions', 'editAssessment', 
                           'editInteractive'];
    editCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', 
                                     calculateEditCoursePrice);
        }
    });

}

function updateOrdersCount() {
    const countBadge = document.getElementById('ordersCount');
    if (!countBadge) return;

    const count = AccountState.orders.length;
    countBadge.textContent = pluralize(count, 'заявка', 
                                      'заявки', 'заявок');
}

// Отрисовать таблицу заявок
function renderOrders() {
    const emptyState = document.getElementById('emptyState');
    const ordersTable = document.getElementById('ordersTable');
    const tbody = document.getElementById('ordersList');

    if (AccountState.orders.length === 0) {
        emptyState.style.display = 'block';
        ordersTable.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    ordersTable.style.display = 'block';

    tbody.innerHTML = '';

    const startIdx = (AccountState.currentOrderPage - 1) * 
                     AccountState.ordersPerPage;
    const endIdx = startIdx + AccountState.ordersPerPage;
    const ordersToShow = AccountState.orders.slice(startIdx, endIdx);

    ordersToShow.forEach((order, index) => {
        const tr = document.createElement('tr');
        const orderNumber = startIdx + index + 1;

        let orderName = '';
        if (order.course_id && order.course_id > 0) {
            const course = AccountState.courses.find(
                c => c.id === order.course_id
            );
            orderName = course ? course.name : 
                       `Курс #${order.course_id}`;
        } else if (order.tutor_id && order.tutor_id > 0) {
            const tutor = AccountState.tutors.find(
                t => t.id === order.tutor_id
            );
            orderName = tutor ? `Репетитор: ${tutor.name}` : 
                       `Репетитор #${order.tutor_id}`;
        }

        const orderDate = formatDateTimeWithoutSeconds(
            order.date_start, 
            order.time_start
        );

        tr.innerHTML = `
            <td>${orderNumber}</td>
            <td>${orderName}</td>
            <td>${orderDate}</td>
            <td>${formatPrice(order.price)}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-info view-order-btn" 
                            data-order-id="${order.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-warning edit-order-btn" 
                            data-order-id="${order.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger delete-order-btn" 
                            data-order-id="${order.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    document.querySelectorAll('.view-order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = parseInt(e.currentTarget
                .getAttribute('data-order-id'));
            viewOrderDetails(orderId);
        });
    });

    document.querySelectorAll('.edit-order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = parseInt(e.currentTarget
                .getAttribute('data-order-id'));
            editOrder(orderId);
        });
    });

    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = parseInt(e.currentTarget
                .getAttribute('data-order-id'));
            showDeleteConfirmation(orderId);
        });
    });

    renderOrdersPagination();
}

function renderOrdersPagination() {
    const container = document.getElementById('ordersPagination');
    if (!container) return;

    container.innerHTML = '';

    const totalPages = Math.ceil(AccountState.orders.length / 
                                 AccountState.ordersPerPage);

    if (totalPages <= 1) return;

    const createPageItem = (page, text, disabled = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} 
                        ${page === AccountState.currentOrderPage ? 
                          'active' : ''}`;

        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = text || page;

        if (!disabled) {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                AccountState.currentOrderPage = page;
                renderOrders();
            });
        }

        li.appendChild(a);
        return li;
    };

    container.appendChild(
        createPageItem(AccountState.currentOrderPage - 1, 'Назад', 
                      AccountState.currentOrderPage === 1)
    );

    for (let i = 1; i <= totalPages; i++) {
        container.appendChild(createPageItem(i, i, false));
    }

    container.appendChild(
        createPageItem(AccountState.currentOrderPage + 1, 'Вперед', 
                      AccountState.currentOrderPage === totalPages)
    );
}

// Показать детальную информацию о заявке
function viewOrderDetails(orderId) {
    const order = AccountState.orders.find(o => o.id === orderId);
    if (!order) return;

    const modal = new bootstrap.Modal(
        document.getElementById('orderDetailModal')
    );
    const content = document.getElementById('orderDetailContent');

    let orderTitle = '';
    let teacherInfo = '';

    if (order.course_id && order.course_id > 0) {
        const course = AccountState.courses.find(
            c => c.id === order.course_id
        );
        if (course) {
            orderTitle = course.name;
            teacherInfo = `<p><strong>Преподаватель:</strong> 
                          ${course.teacher}</p>`;
        }
    } else if (order.tutor_id && order.tutor_id > 0) {
        const tutor = AccountState.tutors.find(
            t => t.id === order.tutor_id
        );
        if (tutor) {
            orderTitle = `Репетитор: ${tutor.name}`;
        }
    }

    const options = [];
    if (order.early_registration) 
        options.push('Ранняя регистрация (-10%)');
    if (order.group_enrollment) 
        options.push('Групповая скидка (-15%)');
    if (order.intensive_course) 
        options.push('Интенсивный курс (+20%)');
    if (order.supplementary) 
        options.push('Дополнительные учебные материалы (+2000₽/студ.)');
    if (order.personalized) 
        options.push('Индивидуальные занятия (+1500₽/нед.)');
    if (order.excursions) 
        options.push('Культурные экскурсии (+25%)');
    if (order.assessment) 
        options.push('Оценка уровня владения языком (+300₽)');
    if (order.interactive) 
        options.push('Доступ к интерактивной онлайн-платформе (+50%)');

    const optionsBadges = options.map(opt => 
        `<span class="badge bg-secondary me-1 mb-1">${opt}</span>`
    ).join('');

    const contactData = ContactDataStorage.get(order.id);
    let contactInfo = '';
    
    if (contactData) {
        contactInfo = `
            <hr>
            <h6>Контактные данные:</h6>
            <p><strong>Имя:</strong> ${contactData.name}</p>
            <p><strong>Телефон:</strong> ${contactData.phone}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            ${contactData.message ? 
              `<p><strong>Сообщение:</strong> ${contactData.message}</p>` 
              : ''}
        `;
    }

    let detailsHTML = `<h5>${orderTitle}</h5>${teacherInfo}`;
    let priceLabel = '';

    if (order.course_id && order.course_id > 0) {
        detailsHTML += `
            <p><strong>Дата:</strong>
               ${formatDate(order.date_start)}</p>
            <p><strong>Время:</strong> ${formatTime(order.time_start)}</p>
            <p><strong>Продолжительность:</strong>
               ${order.duration} часов</p>
            <p><strong>Количество студентов:</strong>
               ${order.persons}</p>
            ${options.length > 0 ?
              `<p><strong>Выбранные опции:</strong><br>${optionsBadges}</p>`
              : ''}
        `;
        priceLabel = `Итоговая стоимость: ${formatPrice(order.price)}`;
    } else if (order.tutor_id && order.tutor_id > 0) {
        detailsHTML += `
            <p class="text-muted">Заявка на индивидуальные занятия с репетитором</p>
        `;
        priceLabel = `Стоимость: ${formatPrice(order.price)}/час`;
    }

    detailsHTML += `
        ${contactInfo}
        <hr>
        <h5>${priceLabel}</h5>
    `;

    content.innerHTML = detailsHTML;

    modal.show();
}

// Открыть модальное окно редактирования заявки
function editOrder(orderId) {
    const order = AccountState.orders.find(o => o.id === orderId);
    if (!order) return;

    AccountState.editingOrder = order;

    const modal = new bootstrap.Modal(
        document.getElementById('editOrderModal')
    );

    document.getElementById('editOrderId').value = order.id;

    const editCourseFields = 
        document.getElementById('editCourseFields');
    const editTutorFields = 
        document.getElementById('editTutorFields');

    const contactData = ContactDataStorage.get(order.id);
    if (contactData) {
        document.getElementById('editStudentName').value = 
            contactData.name || '';
        document.getElementById('editStudentPhone').value = 
            contactData.phone || '';
        document.getElementById('editStudentEmail').value = 
            contactData.email || '';
        document.getElementById('editStudentMessage').value = 
            contactData.message || '';
    }

    if (order.course_id && order.course_id > 0) {
        editCourseFields.style.display = 'block';
        editTutorFields.style.display = 'none';

        const course = AccountState.courses.find(
            c => c.id === order.course_id
        );
        if (course) {
            document.getElementById('editCourseId').value = 
                course.id;
            document.getElementById('editCourseName').value = 
                course.name;
            document.getElementById('editCourseTeacher').value = 
                course.teacher;

            // Получить уникальные даты
            const uniqueDates = [...new Set(course.start_dates.map(dt => dt.split('T')[0]))];

            const startDateSelect = document.getElementById('editCourseStartDate');
            startDateSelect.innerHTML = '';

            uniqueDates.forEach(dateStr => {
                const option = document.createElement('option');
                option.value = dateStr;
                option.textContent = formatDate(dateStr);
                startDateSelect.appendChild(option);
            });

            // Установить текущую дату и время заказа
            startDateSelect.value = order.date_start;

            updateEditCourseTimeSlots();

            // Установить время после обновления списка времён
            const timeSelect = document.getElementById('editCourseStartTime');
            if (order.time_start && timeSelect) {
                timeSelect.value = order.time_start;
            }

            const durationText = `${course.total_length} недель, 
                                 ${course.week_length} ч/нед`;
            document.getElementById('editCourseDuration').value = 
                durationText;

            document.getElementById('editStudentsNumber').value = 
                order.persons;

            document.getElementById('editEarlyRegistration').checked = 
                order.early_registration;
            document.getElementById('editGroupEnrollment').checked = 
                order.group_enrollment;
            document.getElementById('editIntensiveCourse').checked = 
                order.intensive_course;

            document.getElementById('editSupplementary').checked = 
                order.supplementary;
            document.getElementById('editPersonalized').checked = 
                order.personalized;
            document.getElementById('editExcursions').checked = 
                order.excursions;
            document.getElementById('editAssessment').checked = 
                order.assessment;
            document.getElementById('editInteractive').checked = 
                order.interactive;
        }
    } else if (order.tutor_id && order.tutor_id > 0) {
        editCourseFields.style.display = 'none';
        editTutorFields.style.display = 'block';

        const tutor = AccountState.tutors.find(
            t => t.id === order.tutor_id
        );
        if (tutor) {
            document.getElementById('editTutorId').value = tutor.id;
            document.getElementById('editTutorName').value = tutor.name;
        }
    }

    modal.show();

    setTimeout(() => {
        if (order.course_id && order.course_id > 0) {
            calculateEditCoursePrice();
        } else if (order.tutor_id && order.tutor_id > 0) {
            const tutor = AccountState.tutors.find(
                t => t.id === order.tutor_id
            );
            const price = tutor ? tutor.price_per_hour : order.price;
            document.getElementById('editTotalPrice').textContent = price;
        }
    }, 100);
}

function updateEditCourseTimeSlots() {
    const selectedDate =
        document.getElementById('editCourseStartDate').value;
    const timeSelect = document.getElementById('editCourseStartTime');

    if (!selectedDate) {
        timeSelect.disabled = true;
        timeSelect.innerHTML =
            '<option value="">Сначала выберите дату</option>';
        document.getElementById('editCourseEndDate').value = '';
        return;
    }

    timeSelect.disabled = false;
    timeSelect.innerHTML = '';

    const courseId = parseInt(
        document.getElementById('editCourseId').value
    );
    const course = AccountState.courses.find(c => c.id === courseId);

    if (course) {
        const duration = course.week_length;

        // Фильтруем времена для выбранной даты
        const timesForDate = course.start_dates
            .filter(dt => dt.split('T')[0] === selectedDate)
            .map(dt => dt.split('T')[1].substring(0, 5));

        timesForDate.forEach(timeStr => {
            const startHour = parseInt(timeStr.split(':')[0]);
            const startMinute = parseInt(timeStr.split(':')[1]);
            const endHour = startHour + duration;
            const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;

            const surcharge = getTimeSurcharge(timeStr);
            let surchargeText = surcharge > 0 ? ` (+${surcharge}₽)` : '';

            const option = document.createElement('option');
            option.value = timeStr;
            option.textContent = `${timeStr} - ${endTimeStr}${surchargeText}`;
            timeSelect.appendChild(option);
        });

        // Устанавливаем дату окончания курса
        const endDate = formatEndDate(selectedDate, course.total_length);
        document.getElementById('editCourseEndDate').value = endDate;
    }

    calculateEditCoursePrice();
}

// Рассчитать итоговую цену при редактировании
function calculateEditCoursePrice() {
    const courseId = parseInt(
        document.getElementById('editCourseId').value
    );
    const course = AccountState.courses.find(c => c.id === courseId);

    if (!course) return;

    const startDate = 
        document.getElementById('editCourseStartDate').value;
    const startTime = 
        document.getElementById('editCourseStartTime').value;
    const persons = parseInt(
        document.getElementById('editStudentsNumber').value
    ) || 1;

    if (!startDate || !startTime) {
        document.getElementById('editTotalPrice').textContent = '0';
        document.getElementById('editCourseEndDate').value = '';
        return;
    }

    // Устанавливаем дату окончания курса
    const endDate = formatEndDate(startDate, course.total_length);
    document.getElementById('editCourseEndDate').value = endDate;

    const courseFeePerHour = course.course_fee_per_hour;
    const totalHours = course.total_length * course.week_length;
    const weekendMultiplier = getWeekendMultiplier(startDate);
    const timeSurcharge = getTimeSurcharge(startTime);

    let basePrice = (courseFeePerHour * totalHours * 
                    weekendMultiplier + timeSurcharge) * persons;

    const earlyReg = isEarlyRegistration(startDate);
    const groupEnroll = persons >= 5;
    const intensive = course.week_length > 20;

    document.getElementById('editEarlyRegistration').checked = earlyReg;
    document.getElementById('editGroupEnrollment').checked = 
        groupEnroll;
    document.getElementById('editIntensiveCourse').checked = intensive;

    if (earlyReg) basePrice *= 0.9;
    if (groupEnroll) basePrice *= 0.85;
    if (intensive) basePrice *= 1.2;

    if (document.getElementById('editSupplementary').checked) {
        basePrice += 2000 * persons;
    }

    if (document.getElementById('editPersonalized').checked) {
        basePrice += 1500 * course.total_length;
    }

    if (document.getElementById('editExcursions').checked) {
        basePrice *= 1.25;
    }

    if (document.getElementById('editAssessment').checked) {
        basePrice += 300;
    }

    if (document.getElementById('editInteractive').checked) {
        basePrice *= 1.5;
    }

    document.getElementById('editTotalPrice').textContent = 
        Math.round(basePrice);
}

// Сохранить изменения заявки на сервер
async function saveOrderEdit() {
    const form = document.getElementById('editOrderForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const orderId = parseInt(
        document.getElementById('editOrderId').value
    );
    const order = AccountState.editingOrder;

    const contactData = {
        name: document.getElementById('editStudentName').value,
        phone: document.getElementById('editStudentPhone').value,
        email: document.getElementById('editStudentEmail').value,
        message: document.getElementById('editStudentMessage').value
    };

    let orderData = {
        price: parseInt(
            document.getElementById('editTotalPrice').textContent
        )
    };

    if (order.course_id && order.course_id > 0) {
        const courseId = parseInt(
            document.getElementById('editCourseId').value
        );
        const course = AccountState.courses.find(
            c => c.id === courseId
        );

        const startDate =
            document.getElementById('editCourseStartDate').value
            .split('T')[0];
        const startTime =
            document.getElementById('editCourseStartTime').value;
        const persons = parseInt(
            document.getElementById('editStudentsNumber').value
        );

        orderData = {
            ...orderData,
            course_id: courseId,
            tutor_id: 0,
            date_start: startDate,
            time_start: startTime,
            duration: course.total_length * course.week_length,
            persons: persons,
            early_registration:
                document.getElementById('editEarlyRegistration').checked,
            group_enrollment:
                document.getElementById('editGroupEnrollment').checked,
            intensive_course:
                document.getElementById('editIntensiveCourse').checked,
            supplementary:
                document.getElementById('editSupplementary').checked,
            personalized:
                document.getElementById('editPersonalized').checked,
            excursions:
                document.getElementById('editExcursions').checked,
            assessment:
                document.getElementById('editAssessment').checked,
            interactive:
                document.getElementById('editInteractive').checked
        };
    } else if (order.tutor_id && order.tutor_id > 0) {
        const tutorId = parseInt(
            document.getElementById('editTutorId').value
        );
        const tutor = AccountState.tutors.find(t => t.id === tutorId);

        // Используем текущую дату как плейсхолдер или сохраняем существующую
        const dateStr = order.date_start || new Date().toISOString().split('T')[0];
        const timeStr = order.time_start || '10:00';

        orderData = {
            ...orderData,
            tutor_id: tutorId,
            course_id: 0,
            date_start: dateStr,
            time_start: timeStr,
            duration: 1,
            persons: 1,
            price: tutor ? tutor.price_per_hour : order.price,
            early_registration: false,
            group_enrollment: false,
            intensive_course: false,
            supplementary: false,
            personalized: false,
            excursions: false,
            assessment: false,
            interactive: false
        };
    }

    try {
        await updateOrder(orderId, orderData, contactData);
        const modal = bootstrap.Modal.getInstance(
            document.getElementById('editOrderModal')
        );
        modal.hide();
        await loadAccountData();
    } catch (error) {
        console.error('Error updating order:', error);
    }
}

function showDeleteConfirmation(orderId) {
    const modal = new bootstrap.Modal(
        document.getElementById('deleteOrderModal')
    );
    document.getElementById('deleteOrderId').value = orderId;
    modal.show();
}

// Подтвердить удаление заявки
async function confirmOrderDeletion() {
    const orderId = parseInt(
        document.getElementById('deleteOrderId').value
    );

    try {
        await deleteOrder(orderId);
        const modal = bootstrap.Modal.getInstance(
            document.getElementById('deleteOrderModal')
        );
        modal.hide();
        await loadAccountData();
    } catch (error) {
        console.error('Error deleting order:', error);
    }
}

function updateUserInfo() {
    updateOrdersCount();
}