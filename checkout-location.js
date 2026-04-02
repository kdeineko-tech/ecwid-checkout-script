window.ec = window.ec || {};
ec.order = ec.order || {};
ec.order.extraFields = ec.order.extraFields || {};

const CITY_MAP = {
  California: ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
  Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
  Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
  "New York": ["New York", "Buffalo", "Albany", "Rochester"]
};

ec.order.extraFields.city_filter = {
  title: "Choose City",
  type: "select",
  required: false,
  checkoutDisplaySection: "shipping_address",
  options: [
    { title: "Please choose" }
  ]
};

function updateCityField(stateValue) {
  const cities = CITY_MAP[stateValue] || [];

  ec.order.extraFields.city_filter.options = [
    { title: "Please choose" },
    ...cities.map(city => ({ title: city }))
  ];

  ec.order.extraFields.city_filter.value = "";
  window.Ecwid && Ecwid.refreshConfig();
}

window.Ecwid && Ecwid.refreshConfig();
