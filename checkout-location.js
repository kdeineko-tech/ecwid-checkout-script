const CITY_MAP = {
  "California": ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
  "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
  "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
  "New York": ["New York", "Buffalo", "Albany", "Rochester"]
};

Ecwid.OnAPILoaded.add(function () {
  Ecwid.OnPageLoaded.add(function (page) {
    if (page.type == "CART") {
      window.ec = window.ec || {};
      ec.order = ec.order || {};
      ec.order.extraFields = ec.order.extraFields || {};

      ec.order.extraFields.choose_state = {
        title: "Choose State",
        type: "select",
        options: Object.keys(CITY_MAP).map(function (state) {
          return { title: state };
        }),
        required: true,
        checkoutDisplaySection: "shipping_address"
      };

      ec.order.extraFields.choose_city = {
        title: "Choose City",
        type: "select",
        options: CITY_MAP["California"].map(function (city) {
          return { title: city };
        }),
        required: true,
        checkoutDisplaySection: "shipping_address"
      };

      window.Ecwid && Ecwid.refreshConfig();
    }
  });
});
