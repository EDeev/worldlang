const AppState = {
    courses: [],
    tutors: [],
    orders: [],
    filteredCourses: [],
    filteredTutors: [],
    selectedCourse: null,
    selectedTutor: null,
    currentCoursePage: 1,
    coursesPerPage: 3,
    currentTutorPage: 1,
    tutorsPerPage: 3
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Инициализировать главную страницу приложения
async function initApp() {
    await loadCourses();
    await loadTutors();
    setupEventListeners();
    initMap();
}

// Настроить все обработчики событий
function setupEventListeners() {
    const courseSearch = document.getElementById('courseSearch');
    const levelFilter = document.getElementById('levelFilter');
    const sortCourses = document.getElementById('sortCourses');

    if (courseSearch) {
        courseSearch.addEventListener('input', 
            debounce(filterAndRenderCourses, 300));
    }

    if (levelFilter) {
        levelFilter.addEventListener('change', filterAndRenderCourses);
    }

    if (sortCourses) {
        sortCourses.addEventListener('change', filterAndRenderCourses);
    }

    const tutorLevelFilter = 
        document.getElementById('tutorLevelFilter');
    const minExperience = document.getElementById('minExperience');
    const languageFilter = document.getElementById('languageFilter');
    const sortTutors = document.getElementById('sortTutors');

    if (tutorLevelFilter) {
        tutorLevelFilter.addEventListener('change', 
                                         filterAndRenderTutors);
    }

    if (minExperience) {
        minExperience.addEventListener('input', 
            debounce(filterAndRenderTutors, 300));
    }

    if (languageFilter) {
        languageFilter.addEventListener('change', 
                                       filterAndRenderTutors);
    }

    if (sortTutors) {
        sortTutors.addEventListener('change', filterAndRenderTutors);
    }

    const submitCourseOrder = 
        document.getElementById('submitCourseOrder');
    if (submitCourseOrder) {
        submitCourseOrder.addEventListener('click', submitCourseOrderForm);
    }

    const submitTutorOrder = 
        document.getElementById('submitTutorOrder');
    if (submitTutorOrder) {
        submitTutorOrder.addEventListener('click', submitTutorOrderForm);
    }

    const courseStartDate = document.getElementById('courseStartDate');
    if (courseStartDate) {
        courseStartDate.addEventListener('change',
                                        updateCourseTimeSlots);
    }

    const courseStartTime = document.getElementById('courseStartTime');
    if (courseStartTime) {
        courseStartTime.addEventListener('change', calculateCoursePrice);
    }

    const studentsNumber = document.getElementById('studentsNumber');
    if (studentsNumber) {
        studentsNumber.addEventListener('input', calculateCoursePrice);
    }

    const checkboxes = ['supplementary', 'personalized', 'excursions',
                       'assessment', 'interactive'];
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', calculateCoursePrice);
        }
    });

}

// Отфильтровать и отобразить курсы
function filterAndRenderCourses() {
    const searchTerm = document.getElementById('courseSearch').value
        .toLowerCase();
    const levelFilter = document.getElementById('levelFilter').value;
    const sortOption = document.getElementById('sortCourses').value;

    AppState.filteredCourses = AppState.courses.filter(course => {
        const matchesSearch = course.name.toLowerCase()
            .includes(searchTerm) ||
            course.description.toLowerCase().includes(searchTerm);
        const matchesLevel = !levelFilter ||
                            course.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    if (sortOption) {
        const [field, order] = sortOption.split('_');
        AppState.filteredCourses.sort((a, b) => {
            let aVal, bVal;

            if (field === 'duration') {
                aVal = a.total_length;
                bVal = b.total_length;
            } else if (field === 'price') {
                aVal = a.course_fee_per_hour;
                bVal = b.course_fee_per_hour;
            }

            return order === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }

    AppState.currentCoursePage = 1;
    renderCourses();
}

function renderCourses() {
    const container = document.getElementById('coursesList');
    if (!container) return;

    container.innerHTML = '';

    const startIdx = (AppState.currentCoursePage - 1) * 
                     AppState.coursesPerPage;
    const endIdx = startIdx + AppState.coursesPerPage;
    const coursesToShow = AppState.filteredCourses
        .slice(startIdx, endIdx);

    coursesToShow.forEach(course => {
        const item = document.createElement('div');
        item.className = 'course-item';
        item.dataset.courseId = course.id;
        
        item.innerHTML = `
            <div class="course-item-header">
                <h5 class="course-item-title">${course.name}</h5>
                <span class="badge level-badge 
                      ${getLevelBadgeClass(course.level)}">
                    ${getLevelText(course.level)}
                </span>
            </div>
            <div class="course-item-body">
                ${course.description.substring(0, 150)}...
            </div>
            <div class="course-item-details">
                <div>
                    <i class="bi bi-person"></i>
                    <span>${course.teacher}</span>
                </div>
                <div>
                    <i class="bi bi-clock"></i>
                    <span>${course.total_length} недель, 
                          ${course.week_length} ч/нед</span>
                </div>
                <div>
                    <i class="bi bi-cash"></i>
                    <span>${formatPrice(course.course_fee_per_hour)}/час</span>
                </div>
            </div>
            <div class="mt-2">
                <button class="btn btn-primary btn-sm select-course-btn">
                    Выбрать
                </button>
            </div>
        `;

        item.addEventListener('click', (e) => {
            if (!e.target.closest('.select-course-btn')) {
                selectCourse(course);
            }
        });

        const selectBtn = item.querySelector('.select-course-btn');
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCourse(course);
        });

        container.appendChild(item);
    });

    renderCoursePagination();
}

function renderCoursePagination() {
    const container = document.getElementById('coursesPagination');
    if (!container) return;

    container.innerHTML = '';

    const totalPages = Math.ceil(AppState.filteredCourses.length / 
                                 AppState.coursesPerPage);

    if (totalPages <= 1) return;

    const createPageItem = (page, text, disabled = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} 
                        ${page === AppState.currentCoursePage ? 
                          'active' : ''}`;

        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#courses';
        a.textContent = text || page;

        if (!disabled) {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                AppState.currentCoursePage = page;
                renderCourses();
            });
        }

        li.appendChild(a);
        return li;
    };

    container.appendChild(
        createPageItem(AppState.currentCoursePage - 1, 'Назад', 
                      AppState.currentCoursePage === 1)
    );

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || 
            (i >= AppState.currentCoursePage - 1 && 
             i <= AppState.currentCoursePage + 1)) {
            container.appendChild(createPageItem(i, i, false));
        } else if (i === AppState.currentCoursePage - 2 || 
                   i === AppState.currentCoursePage + 2) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = '<span class="page-link">...</span>';
            container.appendChild(li);
        }
    }

    container.appendChild(
        createPageItem(AppState.currentCoursePage + 1, 'Вперед', 
                      AppState.currentCoursePage === totalPages)
    );
}

// Выбрать курс и открыть форму заказа
function selectCourse(course) {
    document.querySelectorAll('.course-item').forEach(item => {
        item.classList.remove('selected');
    });

    const selectedItem = document.querySelector(
        `.course-item[data-course-id="${course.id}"]`
    );
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }

    AppState.selectedCourse = course;
    openCourseModal(course);
}

// Открыть модальное окно заказа курса
function openCourseModal(course) {
    const modal = new bootstrap.Modal(
        document.getElementById('courseModal')
    );

    document.getElementById('courseId').value = course.id;
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseTeacher').value = course.teacher;
    document.getElementById('orderMode').value = 'create';

    // Получить уникальные даты (без времени)
    const uniqueDates = [...new Set(course.start_dates.map(dt => dt.split('T')[0]))];

    const startDateSelect = document.getElementById('courseStartDate');
    startDateSelect.innerHTML = '<option value="">Выберите дату</option>';

    uniqueDates.forEach(dateStr => {
        const option = document.createElement('option');
        option.value = dateStr;
        option.textContent = formatDate(dateStr);
        startDateSelect.appendChild(option);
    });

    const durationText = `${course.total_length} недель, 
                         ${course.week_length} ч/нед`;
    document.getElementById('courseDuration').value = durationText;

    document.getElementById('studentsNumber').value = 1;

    ['earlyRegistration', 'groupEnrollment', 
     'intensiveCourse'].forEach(id => {
        document.getElementById(id).checked = false;
    });

    ['supplementary', 'personalized', 'excursions', 
     'assessment', 'interactive'].forEach(id => {
        document.getElementById(id).checked = false;
    });

    ['studentName', 'studentPhone', 'studentEmail', 
     'studentMessage'].forEach(id => {
        document.getElementById(id).value = '';
    });

    document.getElementById('courseStartTime').disabled = true;
    document.getElementById('courseStartTime').innerHTML = 
        '<option value="">Сначала выберите дату</option>';

    calculateCoursePrice();

    modal.show();
}

function updateCourseTimeSlots() {
    const selectedDate = document.getElementById('courseStartDate').value;
    const timeSelect = document.getElementById('courseStartTime');

    if (!selectedDate) {
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
        document.getElementById('courseEndDate').value = '';
        return;
    }

    timeSelect.disabled = false;
    timeSelect.innerHTML = '';

    const course = AppState.selectedCourse;

    // Отфильтровать времена для выбранной даты
    const timesForDate = course.start_dates
        .filter(dt => dt.split('T')[0] === selectedDate)
        .map(dt => dt.split('T')[1].substring(0, 5));

    // Добавить опции времени с надбавками
    timesForDate.forEach(timeStr => {
        const option = document.createElement('option');
        option.value = timeStr;

        // Рассчитать время окончания занятия
        const startDateTime = new Date(`${selectedDate}T${timeStr}`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + course.week_length);
        const endTimeStr = endDateTime.toTimeString().substring(0, 5);

        // Получить надбавку за время
        const surcharge = getTimeSurcharge(timeStr);
        let surchargeText = '';
        if (surcharge > 0) {
            surchargeText = ` (+${surcharge}₽)`;
        }

        option.textContent = `${timeStr} - ${endTimeStr}${surchargeText}`;
        timeSelect.appendChild(option);
    });

    // Обновить дату окончания курса
    const endDate = formatEndDate(selectedDate, course.total_length);
    document.getElementById('courseEndDate').value = endDate;

    calculateCoursePrice();
}

// Рассчитать итоговую цену курса с надбавками
function calculateCoursePrice() {
    const course = AppState.selectedCourse;
    if (!course) return;

    const startDate = document.getElementById('courseStartDate').value;
    const startTime = document.getElementById('courseStartTime').value;
    const persons = parseInt(
        document.getElementById('studentsNumber').value
    ) || 1;

    if (!startDate || !startTime) {
        document.getElementById('totalPrice').textContent = '0';
        return;
    }

    const courseFeePerHour = course.course_fee_per_hour;
    const totalHours = course.total_length * course.week_length;
    const weekendMultiplier = getWeekendMultiplier(startDate);
    const timeSurcharge = getTimeSurcharge(startTime);

    let basePrice = (courseFeePerHour * totalHours *
                    weekendMultiplier + timeSurcharge) * persons;

    const earlyReg = isEarlyRegistration(startDate);
    const groupEnroll = persons >= 5;
    const intensive = course.week_length > 20;

    document.getElementById('earlyRegistration').checked = earlyReg;
    document.getElementById('groupEnrollment').checked = groupEnroll;
    document.getElementById('intensiveCourse').checked = intensive;

    if (earlyReg) basePrice *= 0.9;
    if (groupEnroll) basePrice *= 0.85;
    if (intensive) basePrice *= 1.2;

    if (document.getElementById('supplementary').checked) {
        basePrice += 2000 * persons;
    }

    if (document.getElementById('personalized').checked) {
        basePrice += 1500 * course.total_length;
    }

    if (document.getElementById('excursions').checked) {
        basePrice *= 1.25;
    }

    if (document.getElementById('assessment').checked) {
        basePrice += 300;
    }

    if (document.getElementById('interactive').checked) {
        basePrice *= 1.5;
    }

    document.getElementById('totalPrice').textContent = 
        Math.round(basePrice);
}

// Отправить форму заказа курса на сервер
async function submitCourseOrderForm() {
    const form = document.getElementById('courseOrderForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const courseId = parseInt(document.getElementById('courseId').value);
    const startDate = document.getElementById('courseStartDate').value
        .split('T')[0];
    const startTime = document.getElementById('courseStartTime').value;
    const persons = parseInt(
        document.getElementById('studentsNumber').value
    );
    const price = parseInt(
        document.getElementById('totalPrice').textContent
    );

    const orderData = {
        course_id: courseId,
        tutor_id: 0,
        date_start: startDate,
        time_start: startTime,
        duration: AppState.selectedCourse.total_length * 
                 AppState.selectedCourse.week_length,
        persons: persons,
        price: price,
        early_registration: 
            document.getElementById('earlyRegistration').checked,
        group_enrollment: 
            document.getElementById('groupEnrollment').checked,
        intensive_course: 
            document.getElementById('intensiveCourse').checked,
        supplementary: document.getElementById('supplementary').checked,
        personalized: document.getElementById('personalized').checked,
        excursions: document.getElementById('excursions').checked,
        assessment: document.getElementById('assessment').checked,
        interactive: document.getElementById('interactive').checked
    };

    const contactData = {
        name: document.getElementById('studentName').value,
        phone: document.getElementById('studentPhone').value,
        email: document.getElementById('studentEmail').value,
        message: document.getElementById('studentMessage').value
    };

    try {
        await createOrder(orderData, contactData);
        const modal = bootstrap.Modal.getInstance(
            document.getElementById('courseModal')
        );
        modal.hide();
        form.reset();
    } catch (error) {
        console.error('Error creating order:', error);
    }
}

function populateLanguageFilter() {
    const languageFilter = document.getElementById('languageFilter');
    if (!languageFilter) return;

    const languages = new Set();
    AppState.tutors.forEach(tutor => {
        tutor.languages_offered.forEach(lang => languages.add(lang));
    });

    Array.from(languages).sort().forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        languageFilter.appendChild(option);
    });
}

// Отфильтровать и отобразить репетиторов
function filterAndRenderTutors() {
    const levelFilter =
        document.getElementById('tutorLevelFilter').value;
    const minExp = parseInt(
        document.getElementById('minExperience').value
    ) || 0;
    const langFilter = document.getElementById('languageFilter').value;
    const sortOption = document.getElementById('sortTutors').value;

    AppState.filteredTutors = AppState.tutors.filter(tutor => {
        const matchesLevel = !levelFilter ||
                            tutor.language_level === levelFilter;
        const matchesExp = tutor.work_experience >= minExp;
        const matchesLang = !langFilter ||
            tutor.languages_offered.includes(langFilter);
        return matchesLevel && matchesExp && matchesLang;
    });

    if (sortOption) {
        const [field, order] = sortOption.split('_');
        AppState.filteredTutors.sort((a, b) => {
            const aVal = a.price_per_hour;
            const bVal = b.price_per_hour;
            return order === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }

    AppState.currentTutorPage = 1;
    renderTutors();
}

function renderTutors() {
    const tbody = document.getElementById('tutorsList');
    if (!tbody) return;

    tbody.innerHTML = '';

    const startIdx = (AppState.currentTutorPage - 1) *
                     AppState.tutorsPerPage;
    const endIdx = startIdx + AppState.tutorsPerPage;
    const tutorsToShow = AppState.filteredTutors
        .slice(startIdx, endIdx);

    tutorsToShow.forEach(tutor => {
        const tr = document.createElement('tr');
        tr.dataset.tutorId = tutor.id;
        tr.innerHTML = `
            <td>${tutor.name}</td>
            <td><span class="badge level-badge
                ${getLevelBadgeClass(tutor.language_level)}">
                ${getLevelText(tutor.language_level)}
            </span></td>
            <td>${tutor.languages_offered.join(', ')}</td>
            <td>${tutor.work_experience} лет</td>
            <td>${formatPrice(tutor.price_per_hour)}/час</td>
            <td>
                <button class="btn btn-sm btn-primary select-tutor-btn">
                    Выбрать
                </button>
            </td>
        `;

        tr.addEventListener('click', (e) => {
            if (!e.target.closest('.select-tutor-btn')) {
                selectTutor(tutor);
            }
        });

        const selectBtn = tr.querySelector('.select-tutor-btn');
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectTutor(tutor);
        });

        tbody.appendChild(tr);
    });

    renderTutorPagination();
}

function renderTutorPagination() {
    const container = document.getElementById('tutorsPagination');
    if (!container) return;

    container.innerHTML = '';

    const totalPages = Math.ceil(AppState.filteredTutors.length /
                                 AppState.tutorsPerPage);

    if (totalPages <= 1) return;

    const createPageItem = (page, text, disabled = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''}
                        ${page === AppState.currentTutorPage ?
                          'active' : ''}`;

        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#tutors';
        a.textContent = text || page;

        if (!disabled) {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                AppState.currentTutorPage = page;
                renderTutors();
            });
        }

        li.appendChild(a);
        return li;
    };

    container.appendChild(
        createPageItem(AppState.currentTutorPage - 1, 'Назад',
                      AppState.currentTutorPage === 1)
    );

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages ||
            (i >= AppState.currentTutorPage - 1 &&
             i <= AppState.currentTutorPage + 1)) {
            container.appendChild(createPageItem(i, i, false));
        } else if (i === AppState.currentTutorPage - 2 ||
                   i === AppState.currentTutorPage + 2) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = '<span class="page-link">...</span>';
            container.appendChild(li);
        }
    }

    container.appendChild(
        createPageItem(AppState.currentTutorPage + 1, 'Вперед',
                      AppState.currentTutorPage === totalPages)
    );
}

// Выбрать репетитора и открыть форму заказа
function selectTutor(tutor) {
    document.querySelectorAll('#tutorsList tr').forEach(row => {
        row.classList.remove('selected');
    });

    const selectedRow = document.querySelector(
        `[data-tutor-id="${tutor.id}"]`
    );
    if (selectedRow) {
        selectedRow.classList.add('selected');
    }

    AppState.selectedTutor = tutor;
    openTutorModal(tutor);
}

// Открыть модальное окно заказа репетитора
function openTutorModal(tutor) {
    const modal = new bootstrap.Modal(
        document.getElementById('tutorModal')
    );

    document.getElementById('tutorId').value = tutor.id;
    document.getElementById('tutorName').value = tutor.name;

    ['tutorStudentName', 'tutorStudentPhone',
     'tutorStudentEmail', 'tutorStudentMessage'].forEach(id => {
        document.getElementById(id).value = '';
    });

    modal.show();
}

// Отправить форму заказа репетитора на сервер
async function submitTutorOrderForm() {
    const form = document.getElementById('tutorOrderForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const tutorId = parseInt(document.getElementById('tutorId').value);
    const tutor = AppState.selectedTutor;

    // Используем текущую дату как плейсхолдер
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const orderData = {
        tutor_id: tutorId,
        course_id: 0,
        date_start: dateStr,
        time_start: '10:00',
        duration: 1,
        persons: 1,
        price: tutor ? tutor.price_per_hour : 0,
        early_registration: false,
        group_enrollment: false,
        intensive_course: false,
        supplementary: false,
        personalized: false,
        excursions: false,
        assessment: false,
        interactive: false
    };

    const contactData = {
        name: document.getElementById('tutorStudentName').value,
        phone: document.getElementById('tutorStudentPhone').value,
        email: document.getElementById('tutorStudentEmail').value,
        message: document.getElementById('tutorStudentMessage').value
    };

    try {
        await createOrder(orderData, contactData);
        const modal = bootstrap.Modal.getInstance(
            document.getElementById('tutorModal')
        );
        modal.hide();
        form.reset();
    } catch (error) {
        console.error('Error creating order:', error);
    }
}