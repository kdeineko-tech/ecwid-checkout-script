window.ec = window.ec || {};
ec.order = ec.order || {};
ec.order.extraFields = ec.order.extraFields || {};

const CITY_MAP = {
  California: ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
  Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
  Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
  "New York": ["New York", "Buffalo", "Albany", "Rochester"]
};

// Оновлюємо екстра поле для міста
ec.order.extraFields.city_filter = {
  title: "Choose City",
  type: "select",
  required: false,
  checkoutDisplaySection: "shipping_address",
  options: [
    { title: "Please choose" } // Одна опція для "Please choose"
  ]
};

function updateCityField(stateValue) {
  // Отримуємо список міст для вибраного штату
  const cities = CITY_MAP[stateValue] || [];

  // Оновлюємо опції для списку міст
  ec.order.extraFields.city_filter.options = [
    { title: "Please choose" }, // Тільки одна опція "Please choose"
    ...cities.map(city => ({ title: city })) // Додаємо всі міста
  ];

  // Скидаємо значення для поля
  ec.order.extraFields.city_filter.value = "";

  // Оновлюємо конфігурацію Ecwid
  window.Ecwid && Ecwid.refreshConfig();
}

// Перевіряємо наявність Ecwid API
if (window.Ecwid) {
  Ecwid.OnPageLoaded.add(function() {
    // Оновлюємо міста після завантаження сторінки
    const stateSelect = document.querySelector("select[name='state']");
    if (stateSelect) {
      stateSelect.addEventListener('change', function() {
        const selectedState = stateSelect.value;
        updateCityField(selectedState); // Оновлюємо міста в залежності від штату
      });
    }
  });
}

// Ініціалізація для початкового стану
window.Ecwid && Ecwid.refreshConfig();
