const STATE_FIELD_LABEL = "Choose State";
const CITY_FIELD_LABEL = "Choose City";

const CITY_MAP = {
  "California": ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
  "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
  "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
  "New York": ["New York", "Buffalo", "Albany", "Rochester"]
};

Ecwid.OnAPILoaded.add(function () {
  window.ec = window.ec || {};
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

  // Функція оновлення міст при зміні штату
  function updateCities(state) {
    const cities = CITY_MAP[state] || [];
    ec.order.extraFields.custom_city.options = cities.map(city => ({ title: city }));
    ec.order.extraFields.custom_city.value = null; // скидаємо вибране місто
    Ecwid.refreshConfig();
  }

  // Слухаємо зміну поля custom_state
  Ecwid.OnFieldChanged.add(function (fieldId, value) {
    if (fieldId === "custom_state") {
      updateCities(value);
    }
  });

  Ecwid.refreshConfig();
});
