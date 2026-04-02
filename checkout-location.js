const STATE_FIELD_LABEL = "Choose State";
const CITY_FIELD_LABEL = "Choose City";

const CITY_MAP = {
  "California": ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
  "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
  "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
  "New York": ["New York", "Buffalo", "Albany", "Rochester"]
};

Ecwid.OnAPILoaded.add(function () {
  const ec = window.ec || {};
  ec.order = ec.order || {};
  ec.order.extraFields = ec.order.extraFields || {};

  // Штат
  ec.order.extraFields.custom_state = {
    title: STATE_FIELD_LABEL,
    type: "select",
    required: true,
    checkoutDisplaySection: "shipping_address",
    options: Object.keys(CITY_MAP).map(state => ({ title: state }))
  };

  // Місто
  ec.order.extraFields.custom_city = {
    title: CITY_FIELD_LABEL,
    type: "select",
    required: true,
    checkoutDisplaySection: "shipping_address",
    options: [] // спочатку порожній select
  };

  Ecwid.refreshConfig();

  // Чекаємо завантаження checkout сторінки
  Ecwid.OnPageLoaded.add(function(page) {
    if (page.type === "CHECKOUT") {
      // Отримуємо DOM для поля штату
      const stateSelect = document.querySelector('select[name="custom_state"]');

      if (!stateSelect) return;

      stateSelect.addEventListener('change', function() {
        const state = stateSelect.value;
        const citySelect = document.querySelector('select[name="custom_city"]');
        if (!citySelect) return;

        // Оновлюємо міста
        const cities = CITY_MAP[state] || [];
        citySelect.innerHTML = '<option value="">Choose City</option>';
        cities.forEach(city => {
          const opt = document.createElement('option');
          opt.value = city;
          opt.textContent = city;
          citySelect.appendChild(opt);
        });

        // Скидаємо значення
        citySelect.value = "";
      });
    }
  });
});
