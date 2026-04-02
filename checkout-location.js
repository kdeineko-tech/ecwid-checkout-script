document.addEventListener("DOMContentLoaded", function () {

  const locations = {
    "California": ["San Francisco", "Los Angeles"],
    "New York": ["NYC", "Buffalo"]
  };

  function createDropdown(id, placeholder) {
    const select = document.createElement("select");
    select.id = id;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = placeholder;
    select.appendChild(defaultOption);

    return select;
  }

  function initCustomFields() {
    const container = document.querySelector(".ecwid-checkout__form");

    if (!container || document.getElementById("custom-state")) return;

    const stateSelect = createDropdown("custom-state", "Select State");
    const citySelect = createDropdown("custom-city", "Select City");

    Object.keys(locations).forEach(state => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      stateSelect.appendChild(option);
    });

    stateSelect.addEventListener("change", function () {
      citySelect.innerHTML = "<option value=''>Select City</option>";

      (locations[this.value] || []).forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    });

    container.appendChild(stateSelect);
    container.appendChild(citySelect);
  }

  if (window.Ecwid) {
    Ecwid.OnPageLoaded.add(function(page) {
      if (page.type === "CHECKOUT") {
        setTimeout(initCustomFields, 500);
      }
    });
  }

});
