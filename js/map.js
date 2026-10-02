// Инициализировать карту с ресурсами для обучения
function initMap() {
    const mapContainer = document.getElementById('resourceMap');
    if (!mapContainer) return;

    if (typeof ymaps === 'undefined') {
        console.error('Yandex Maps API not loaded');
        return;
    }

    ymaps.ready(() => {
        const map = new ymaps.Map('resourceMap', {
            center: [55.751574, 37.617635],
            zoom: 11,
            controls: ['zoomControl', 'geolocationControl']
        });

        const resources = [
            {
                coords: [55.781291, 37.711518],
                name: 'Московский Политех (Главный корпус)',
                address: 'ул. Большая Семёновская, 38',
                hours: 'Пн-Сб: 8:00-22:00',
                type: 'education',
                phone: '+7 (495) 223-05-23',
                description: 'Образовательное учреждение с библиотекой и учебными классами для самостоятельных занятий'
            },
            {
                coords: [55.767222, 37.678611],
                name: 'Библиотека им. Некрасова',
                address: 'ул. Бауманская, 58/25',
                hours: 'Пн-Сб: 10:00-21:00',
                type: 'library',
                phone: '+7 (499) 261-31-64',
                description: 'Публичная библиотека с иностранной литературой и читальным залом'
            },
            {
                coords: [55.772178, 37.580131],
                name: 'Языковой центр "Liden & Denz"',
                address: 'Грузинский пер., 3',
                hours: 'Пн-Пт: 8:30-19:00',
                type: 'language_school',
                phone: '+7 (495) 785-67-75',
                description: 'Частная языковая школа с курсами русского языка для иностранцев и европейских языков для россиян'
            },
            {
                coords: [55.745154, 37.596929],
                name: 'Языковой центр "Ruslanguage"',
                address: 'Большой Афанасьевский пер., 3, стр. 3',
                hours: 'Пн-Пт: 9:00-19:00',
                type: 'language_school',
                phone: '+7 (495) 518-75-16',
                description: 'Языковые курсы с разговорными клубами и культурной программой'
            },
            {
                coords: [55.732739, 37.666146],
                name: 'Коворкинг "Praktik Proletarskaya"',
                address: 'ул. Воронцовская, 49/28, стр. 1',
                hours: 'Ежедневно: 0:00-24:00',
                type: 'coworking',
                phone: '+7 (495) 120-28-55',
                description: 'Коворкинг-пространство для самостоятельного обучения с WiFi и удобными рабочими местами'
            },
            {
                coords: [55.788353, 37.567931],
                name: 'Коворкинг "SOK Arena Park"',
                address: 'Ленинградский пр-т, 36, стр. 11',
                hours: 'Ежедневно: 0:00-24:00',
                type: 'coworking',
                phone: '+7 (495) 662-58-26',
                description: 'Современный коворкинг с переговорными комнатами для групповых занятий'
            },
            {
                coords: [55.714435, 37.657990],
                name: 'Культурный центр "ЗИЛ"',
                address: 'ул. Восточная, 4, корп. 1',
                hours: 'Вт-Вс: 10:00-22:00',
                type: 'cultural_center',
                phone: '+7 (495) 675-16-36',
                description: 'Культурный центр с библиотекой, языковыми клубами и образовательными мероприятиями'
            }
        ];

        const resourcesList = document.getElementById('resourcesList');
        if (resourcesList) {
            resourcesList.innerHTML = '';
        }

        let allPlacemarks = [];
        let currentFilter = 'all';

        // Отрисовать ресурсы на карте и в списке
        function renderResources(filter = 'all') {
            // Очистить карту
            map.geoObjects.removeAll();
            allPlacemarks = [];

            // Очистить список
            if (resourcesList) {
                resourcesList.innerHTML = '';
            }

            // Отфильтровать ресурсы
            const filteredResources = filter === 'all'
                ? resources
                : resources.filter(r => r.type === filter);

            filteredResources.forEach(resource => {
                const placemark = new ymaps.Placemark(
                    resource.coords,
                    {
                        balloonContentHeader: `<strong>${esc(resource.name)}</strong>`,
                        balloonContentBody: `
                            <p class="mb-1"><i class="bi bi-geo-alt"></i> ${esc(resource.address)}</p>
                            <p class="mb-1"><i class="bi bi-clock"></i> ${esc(resource.hours)}</p>
                            <p class="mb-1"><i class="bi bi-telephone"></i> ${esc(resource.phone)}</p>
                            <p class="mb-0"><i class="bi bi-info-circle"></i> ${esc(resource.description)}</p>
                        `,
                        hintContent: resource.name
                    },
                    {
                        preset: getPresetForType(resource.type)
                    }
                );

                map.geoObjects.add(placemark);
                allPlacemarks.push({placemark, resource});

                if (resourcesList) {
                    const item = document.createElement('div');
                    item.className = 'resource-item';
                    item.innerHTML = `
                        <h6>${esc(resource.name)}</h6>
                        <p class="mb-1"><i class="bi bi-geo-alt me-1"></i>${esc(resource.address)}</p>
                        <p class="mb-1"><i class="bi bi-clock me-1"></i>${esc(resource.hours)}</p>
                        <p class="mb-1"><i class="bi bi-telephone me-1"></i>${esc(resource.phone)}</p>
                        <p class="mb-0 text-muted small">${esc(resource.description)}</p>
                    `;

                    item.addEventListener('click', () => {
                        map.setCenter(resource.coords, 15, {duration: 500});
                        placemark.balloon.open();
                    });

                    resourcesList.appendChild(item);
                }
            });
        }

        // Получить иконку для типа ресурса
        function getPresetForType(type) {
            const presets = {
                'education': 'islands#blueEducationIcon',
                'library': 'islands#greenIcon',
                'language_school': 'islands#redEducationIcon',
                'coworking': 'islands#orangeIcon',
                'cultural_center': 'islands#violetIcon'
            };
            return presets[type] || 'islands#redIcon';
        }

        // Инициализация фильтров
        const filterButtons = document.querySelectorAll('.map-filter-btn');
        if (filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const filter = btn.dataset.filter;
                    currentFilter = filter;
                    renderResources(filter);
                });
            });
        }

        // Начальный рендер
        renderResources();
    });
}