(function () {
  // Структура для полів
  window.ec = window.ec || {};
  ec.order = ec.order || {};
  ec.order.extraFields = ec.order.extraFields || {};

  // Налаштування для кастомного поля міста
  ec.order.extraFields.city_filter = {
    'title': 'Choose City',
    'type': 'select',
    'options': ["Los Angeles", "San Diego", "San Jose", "Sacramento", "Houston", "Dallas", "Austin", "San Antonio"],
    'required': true,
    'checkoutDisplaySection': 'shipping_address',
    'tip': 'Please choose your city based on your selected state.',
  };

  // Функція для оновлення варіантів міст залежно від вибраного штату
  function updateCityField(stateValue) {
    const CITY_MAP = {
      California: ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
      Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
      Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
      "New York": ["New York", "Buffalo", "Albany", "Rochester"]
    };

    // Вибираємо міста на основі вибраного штату
    const cities = CITY_MAP[stateValue] || [];
    
    // Оновлюємо доступні варіанти для міста
    ec.order.extraFields.city_filter.options = cities.map(city => ({
      value: city,
      label: city
    }));

    // Оновлюємо конфігурацію Ecwid
    window.Ecwid && Ecwid.refreshConfig();
  }

  // Перевірка наявності поля штату
  function bindStateChange() {
    const stateSelect = document.querySelector("select[name='state']");
    if (stateSelect) {
      stateSelect.addEventListener('change', function () {
        const selectedState = stateSelect.value;
        updateCityField(selectedState);
      });
    }
  }

  // Початкова ініціалізація
  function init() {
    bindStateChange();
  }

  // Перевірка наявності Ecwid API
  if (window.Ecwid) {
    Ecwid.OnPageLoaded.add(init);
  } else {
    console.error('Ecwid is not loaded.');
  }

})();
