(function () {
  const LOCATIONS = {
    CA: ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    TX: ["Houston", "Dallas", "Austin", "San Antonio"],
    FL: ["Miami", "Orlando", "Tampa", "Jacksonville"],
    NY: ["New York", "Buffalo", "Albany", "Rochester"]
    // Додати інші штати та міста тут
  };

  function initEcwidScript() {
    observeCheckout();
    tryMount();
  }

  function observeCheckout() {
    const observer = new MutationObserver(function () {
      tryMount();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function tryMount() {
    if (!isCheckoutPage()) {
      return;
    }

    const stateSelect = document.querySelector("select[name='stateOrProvinceCode']");
    const citySelect = document.querySelector("select[name='city']");

    if (!stateSelect || !citySelect) {
      return;
    }

    stateSelect.addEventListener("change", function () {
      const stateCode = this.value;
      filterCities(stateCode, citySelect);
    });

    // Автоматична фільтрація міст при завантаженні
    const selectedState = stateSelect.value;
    if (selectedState) {
      filterCities(selectedState, citySelect);
    }
  }

  function filterCities(stateCode, citySelect) {
    // Очищаємо список міст
    const cities = LOCATIONS[stateCode] || [];
    citySelect.innerHTML = "<option value=''>Select city</option>";

    cities.forEach(function (city) {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
  }

  function isCheckoutPage() {
    return !!document.querySelector(".ec-cart") || !!document.querySelector(".ec-checkout");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initEcwidScript();
  });
})();
