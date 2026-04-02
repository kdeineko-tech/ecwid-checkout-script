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

  ec.order.extraFields.custom_state = {
    title: STATE_FIELD_LABEL,
    type: "select",
    required: true,
    checkoutDisplaySection: "shipping_address",
    options: Object.keys(CITY_MAP).map(function (state) {
      return { title: state };
    })
  };

  ec.order.extraFields.custom_city = {
    title: CITY_FIELD_LABEL,
    type: "select",
    required: true,
    checkoutDisplaySection: "shipping_address",
    options: CITY_MAP["Texas"].map(function (city) {
      return { title: city };
    })
  };

  window.Ecwid && Ecwid.refreshConfig();
});
