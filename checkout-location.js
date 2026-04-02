(function () {
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
    required: true,
    checkoutDisplaySection: "shipping_address",
    options: [
      { title: "Please choose" } // Тільки одна опція для "Please choose"
    ]
  };

  // Функція для оновлення міста залежно від вибраного штату
  function updateCityField(stateValue) {
    const cities = CITY_MAP[stateValue] || [];

    // Оновлюємо опції для списку міст
    ec.order.extraFields.city_filter.options = [
      { title: "Please choose" },
      ...cities.map(city => ({ title: city }))
    ];

    // Скидаємо значення для поля
    ec.order.extraFields.city_filter.value = "";

    // Оновлюємо конфігурацію Ecwid
    window.Ecwid && Ecwid.refreshConfig();
  }

  // Перевірка наявності поля штату та міста
  function bindStateChange() {
    const stateSelect = document.querySelector("select[name='state']");
    if (stateSelect) {
      stateSelect.addEventListener('change', function () {
        const selectedState = stateSelect.value;
        updateCityField(selectedState); // Оновлюємо міста в залежності від штату
      });
    }
  }

  // Початкова ініціалізація
  function init() {
    bindStateChange();
    // Після завантаження сторінки — оновлюємо список міст
    const stateSelect = document.querySelector("select[name='state']");
    if (stateSelect && stateSelect.value) {
      updateCityField(stateSelect.value);
    }
  }

  // Перевірка наявності Ecwid API
  if (window.Ecwid) {
    Ecwid.OnPageLoaded.add(init); // Оновлюємо при завантаженні сторінки
  } else {
    console.error('Ecwid is not loaded.');
  }

})();
