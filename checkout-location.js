(function () {
    const STATE_FIELD_NAME = "province";  // Використовуємо name або id
    const CITY_FIELD_NAME = "city";      // Використовуємо name або id

    const CITY_MAP = {
        "California": ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
        "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
        "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
        "New York": ["New York", "Buffalo", "Albany", "Rochester"]
    };

    function normalize(value) {
        return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
    }

    function findSelectByNameOrId(nameOrId) {
        return document.querySelector(`select[name="${nameOrId}"], select[id="${nameOrId}"]`);
    }

    function saveOriginalCityOptions(citySelect) {
        if (citySelect.dataset.originalOptionsSaved === "1") return;

        const options = Array.from(citySelect.options).map((option) => ({
            value: option.value,
            text: option.textContent,
            disabled: option.disabled
        }));

        citySelect.dataset.originalOptions = JSON.stringify(options);
        citySelect.dataset.originalOptionsSaved = "1";
    }

    function getOriginalCityOptions(citySelect) {
        try {
            return JSON.parse(citySelect.dataset.originalOptions || "[]");
        } catch (e) {
            return [];
        }
    }

    function rebuildCityOptions(citySelect, options) {
        const previousValue = citySelect.value;
        citySelect.innerHTML = "";

        options.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.value;
            option.textContent = item.text;
            option.disabled = !!item.disabled;
            citySelect.appendChild(option);
        });

        citySelect.value = previousValue || "";
    }

    function filterCityOptions(stateSelect, citySelect) {
        if (!stateSelect || !citySelect) {
            console.error('State or City select element not found!');
            return;
        }

        const selectedStateValue = stateSelect.value;

        // Лог для дебагу
        console.log(`Filtering cities for state: ${selectedStateValue}`);  

        const stateKey = CITY_MAP[selectedStateValue] ? selectedStateValue : "";

        const originalOptions = getOriginalCityOptions(citySelect);

        if (!originalOptions.length) return;

        citySelect.value = "";

        if (!stateKey || !CITY_MAP[stateKey]) {
            rebuildCityOptions(citySelect, originalOptions);
            return;
        }

        const allowedCities = CITY_MAP[stateKey].map(normalize);

        const placeholderOptions = originalOptions.filter((item) => {
            const text = normalize(item.text);
            return !item.value || text.includes("please choose") || text.includes("select");
        });

        const filteredCityOptions = originalOptions.filter((item) => {
            const normalizedValue = normalize(item.value);
            const normalizedText = normalize(item.text);
            return allowedCities.includes(normalizedValue) || allowedCities.includes(normalizedText);
        });

        rebuildCityOptions(citySelect, [...placeholderOptions, ...filteredCityOptions]);
    }

    function initCityFilter() {
        const stateSelect = findSelectByNameOrId(STATE_FIELD_NAME);
        const citySelect = findSelectByNameOrId(CITY_FIELD_NAME);

        if (!stateSelect || !citySelect) {
            console.error('State or City select element not found!');
            return;
        }

        console.log("State and City fields found.");  // Лог для дебагу

        if (citySelect.dataset.cityFilterInitialized === "1") return;
        citySelect.dataset.cityFilterInitialized = "1";

        saveOriginalCityOptions(citySelect);

        stateSelect.addEventListener("change", function () {
            filterCityOptions(stateSelect, citySelect);
        });

        filterCityOptions(stateSelect, citySelect);
    }

    // Перевірка наявності елементів після повного завантаження DOM
    document.addEventListener("DOMContentLoaded", function () {
        console.log("DOM content loaded");
        initCityFilter();
    });
})();
