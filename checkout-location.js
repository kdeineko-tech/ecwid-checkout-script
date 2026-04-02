(function () {
  window.ec = window.ec || {};
  ec.order = ec.order || {};
  ec.order.extraFields = ec.order.extraFields || {};

  // Мапа всіх міст по штатах
  const CITY_MAP = {
    California: ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
    Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "New York": ["New York", "Buffalo", "Albany", "Rochester"]
  };

  // Початкові значення для поля міста
  ec.order.extraFields.city_filter = {
    title: "Choose City",
    type: "select",
    required: true,
    checkoutDisplaySection: "shipping_address",
    options: [{ title: "Please choose" }] // Початкова опція "Please choose"
  };

  // Оновлення списку міст, що відповідають вибраному штату
  function updateCityField(stateValue) {
    const cities = CITY_MAP[stateValue] || [];
    const options = [{ title: "Please choose" }];

    // Створення нових опцій для міста залежно від вибраного штату
    cities.forEach(city => {
      options.push({ title: city });
    });

    // Оновлюємо список опцій в кастомному полі міста
    ec.order.extraFields.city_filter.options = options;

    // Оновлюємо конфігурацію Ecwid для відображення нових варіантів
    window.Ecwid && Ecwid.refreshConfig();
  }

  // Пов'язуємо подію зміни для штату, щоб оновити список міст
  function bindStateChange() {
    const stateSelect = document.querySelector("select[name='state']");
    if (stateSelect) {
      stateSelect.addEventListener('change', function () {
        const selectedState = stateSelect.value;
        updateCityField(selectedState); // Оновлюємо список міст
      });
    }
  }

  // Ініціалізація після завантаження сторінки
  function init() {
    bindStateChange();

    // Після завантаження сторінки оновлюємо список міст, якщо вже є вибір штату
    const stateSelect = document.querySelector("select[name='state']");
    if (stateSelect && stateSelect.value) {
      updateCityField(stateSelect.value); // Оновлюємо список міст на основі вибраного штату
    }

    // Явно робимо кастомне поле міста видимим
    const cityWrapper = document.querySelector("div[data-fieldname='city_filter']");
    if (cityWrapper) {
      cityWrapper.style.display = 'block'; // Забезпечуємо видимість кастомного поля
    }
  }

  // Перевірка наявності Ecwid API
  if (window.Ecwid) {
    Ecwid.OnPageLoaded.add(init); // Ініціалізуємо при завантаженні сторінки
  } else {
    console.error('Ecwid is not loaded.');
  }

})();
