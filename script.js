/* ==========================================================================
   CUBIC YARD CALCULATOR — SCRIPT
   Handles shape switching, unit conversion, volume calculation,
   validation, results rendering, the measurement diagram, and
   mobile navigation.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Conversion constants
     ------------------------------------------------------------------ */
  var LENGTH_TO_FEET = {
    ft: 1,
    in: 0.0833333333,
    m: 3.280839895,
    cm: 0.032808399
  };

  var CUFT_PER_CUYD = 27;
  var CUFT_PER_CUM = 35.3146667;
  var CUYD_PER_CUM = 1.30795062;

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".primary-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ------------------------------------------------------------------
     Calculator
     ------------------------------------------------------------------ */
  function initCalculator() {
    var calculator = document.querySelector("[data-calculator]");
    if (!calculator) return;

    var tabs = calculator.querySelectorAll(".shape-tab");
    var panels = calculator.querySelectorAll("[data-shape-panel]");
    var form = calculator.querySelector("[data-calc-form]");
    var resetBtn = calculator.querySelector("[data-reset]");
    var alertBox = calculator.querySelector("[data-form-alert]");
    var resultsSection = calculator.querySelector("[data-results]");

    var resultArea = calculator.querySelector("[data-result-area]");
    var resultCuFt = calculator.querySelector("[data-result-cuft]");
    var resultCuYd = calculator.querySelector("[data-result-cuyd]");
    var resultCuM = calculator.querySelector("[data-result-cum]");

    var diagram = calculator.querySelector("[data-diagram]");

    var activeShape = "rectangle";

    /* ---- Shape tab switching ---- */
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activeShape = tab.getAttribute("data-shape");
        tabs.forEach(function (t) {
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        panels.forEach(function (panel) {
          var match = panel.getAttribute("data-shape-panel") === activeShape;
          panel.hidden = !match;
        });
        hideResults();
        clearAlert();
      });
    });

    /* ---- Helpers ---- */
    function toFeet(value, unit) {
      return value * (LENGTH_TO_FEET[unit] || 1);
    }

    function showFieldError(input, message) {
      input.setAttribute("aria-invalid", "true");
      var errorEl = calculator.querySelector('[data-error-for="' + input.name + '"]');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add("is-visible");
      }
    }

    function clearFieldError(input) {
      input.removeAttribute("aria-invalid");
      var errorEl = calculator.querySelector('[data-error-for="' + input.name + '"]');
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.remove("is-visible");
      }
    }

    function clearAllFieldErrors() {
      calculator.querySelectorAll("input[name]").forEach(clearFieldError);
    }

    function showAlert(message) {
      if (!alertBox) return;
      alertBox.textContent = message;
      alertBox.classList.add("is-visible");
    }

    function clearAlert() {
      if (!alertBox) return;
      alertBox.textContent = "";
      alertBox.classList.remove("is-visible");
    }

    function hideResults() {
      if (resultsSection) resultsSection.hidden = true;
    }

    function showResults() {
      if (resultsSection) resultsSection.hidden = false;
    }

    function format(num, decimals) {
      if (!isFinite(num)) return "0.00";
      return num.toFixed(decimals === undefined ? 2 : decimals);
    }

    function readPositiveNumber(input, fieldLabel, errors) {
      var raw = input.value.trim();
      if (raw === "") {
        showFieldError(input, fieldLabel + " is required.");
        errors.push(fieldLabel + " is required.");
        return null;
      }
      var value = parseFloat(raw);
      if (isNaN(value)) {
        showFieldError(input, fieldLabel + " must be a number.");
        errors.push(fieldLabel + " must be a valid number.");
        return null;
      }
      if (value <= 0) {
        showFieldError(input, fieldLabel + " must be greater than zero.");
        errors.push(fieldLabel + " must be greater than zero.");
        return null;
      }
      clearFieldError(input);
      return value;
    }

    function renderResults(areaFt2, cuFt) {
      var cuYd = cuFt / CUFT_PER_CUYD;
      var cuM = cuFt / CUFT_PER_CUM;

      if (resultArea) resultArea.textContent = format(areaFt2) + " ft\u00B2";
      if (resultCuFt) resultCuFt.textContent = format(cuFt) + " ft\u00B3";
      if (resultCuYd) resultCuYd.textContent = format(cuYd) + " yd\u00B3";
      if (resultCuM) resultCuM.textContent = format(cuM) + " m\u00B3";

      showResults();

      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    function calculateRectangle() {
      var errors = [];
      var lengthInput = calculator.querySelector('[name="rect-length"]');
      var widthInput = calculator.querySelector('[name="rect-width"]');
      var depthInput = calculator.querySelector('[name="rect-depth"]');
      var unitSelect = calculator.querySelector('[name="rect-unit"]');

      var length = readPositiveNumber(lengthInput, "Length", errors);
      var width = readPositiveNumber(widthInput, "Width", errors);
      var depth = readPositiveNumber(depthInput, "Depth", errors);

      if (errors.length) {
        showAlert("Please correct the highlighted fields before calculating.");
        return;
      }

      var unit = unitSelect ? unitSelect.value : "ft";
      var lengthFt = toFeet(length, unit);
      var widthFt = toFeet(width, unit);
      var depthFt = toFeet(depth, unit);

      var areaFt2 = lengthFt * widthFt;
      var cuFt = areaFt2 * depthFt;

      renderResults(areaFt2, cuFt);
      updateRectangleDiagram(length, width, unit);
    }

    function calculateCircle() {
      var errors = [];
      var diameterInput = calculator.querySelector('[name="circle-diameter"]');
      var depthInput = calculator.querySelector('[name="circle-depth"]');
      var unitSelect = calculator.querySelector('[name="circle-unit"]');

      var diameter = readPositiveNumber(diameterInput, "Diameter", errors);
      var depth = readPositiveNumber(depthInput, "Depth", errors);

      if (errors.length) {
        showAlert("Please correct the highlighted fields before calculating.");
        return;
      }

      var unit = unitSelect ? unitSelect.value : "ft";
      var diameterFt = toFeet(diameter, unit);
      var depthFt = toFeet(depth, unit);
      var radiusFt = diameterFt / 2;

      var areaFt2 = Math.PI * radiusFt * radiusFt;
      var cuFt = areaFt2 * depthFt;

      renderResults(areaFt2, cuFt);
      updateCircleDiagram(diameter, unit);
    }

    function calculateCustom() {
      var errors = [];
      var volumeInput = calculator.querySelector('[name="custom-volume"]');
      var unitSelect = calculator.querySelector('[name="custom-unit"]');

      var volume = readPositiveNumber(volumeInput, "Volume", errors);

      if (errors.length) {
        showAlert("Please correct the highlighted fields before calculating.");
        return;
      }

      var unit = unitSelect ? unitSelect.value : "cuft";
      var cuFt;

      if (unit === "cuft") {
        cuFt = volume;
      } else if (unit === "cuyd") {
        cuFt = volume * CUFT_PER_CUYD;
      } else if (unit === "cum") {
        cuFt = volume * CUFT_PER_CUM;
      } else {
        cuFt = volume;
      }

      renderResults(cuFt, cuFt);
      updateCustomDiagram();
    }

    /* ---- Form submit ---- */
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearAlert();
        clearAllFieldErrors();

        if (activeShape === "rectangle") {
          calculateRectangle();
        } else if (activeShape === "circle") {
          calculateCircle();
        } else {
          calculateCustom();
        }
      });
    }

    /* ---- Reset ---- */
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        form.reset();
        clearAllFieldErrors();
        clearAlert();
        hideResults();
      });
    }

    /* ------------------------------------------------------------------
       Measurement diagram (SVG, engineering-drawing style)
       ------------------------------------------------------------------ */
    function updateRectangleDiagram(length, width, unit) {
      if (!diagram) return;
      diagram.innerHTML =
        '<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rectangular volume diagram">' +
        '<polygon class="volume-face-top" points="60,70 200,40 280,70 140,100" />' +
        '<polygon class="volume-face-left" points="60,70 140,100 140,170 60,140" />' +
        '<polygon class="volume-face-right" points="140,100 280,70 280,140 140,170" />' +
        '<line class="dim-line" x1="60" y1="185" x2="140" y2="185" marker-end="url(#arrow)" marker-start="url(#arrow)" />' +
        '<text class="dim-text" x="80" y="200">Length ' + length + " " + unit + "</text>" +
        '<line class="dim-line" x1="20" y1="70" x2="20" y2="140" marker-end="url(#arrow)" marker-start="url(#arrow)" />' +
        '<text class="dim-text" x="-70" y="108" transform="rotate(-90 20 108)">Width ' + width + " " + unit + "</text>" +
        '<line class="dim-line" x1="290" y1="70" x2="290" y2="140" marker-end="url(#arrow)" marker-start="url(#arrow)" />' +
        '<text class="dim-text" x="298" y="108">Depth</text>' +
        '<defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#475569" /></marker></defs>' +
        "</svg>";
    }

    function updateCircleDiagram(diameter, unit) {
      if (!diagram) return;
      diagram.innerHTML =
        '<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Circular volume diagram">' +
        '<ellipse class="volume-face-top" cx="160" cy="80" rx="100" ry="40" />' +
        '<path class="volume-face-left" d="M60,80 A100,40 0 0,0 260,80 L260,140 A100,40 0 0,1 60,140 Z" />' +
        '<line class="dim-line" x1="60" y1="80" x2="260" y2="80" marker-end="url(#arrow2)" marker-start="url(#arrow2)" />' +
        '<text class="dim-text" x="120" y="70">Diameter ' + diameter + " " + unit + "</text>" +
        '<line class="dim-line" x1="270" y1="80" x2="270" y2="140" marker-end="url(#arrow2)" marker-start="url(#arrow2)" />' +
        '<text class="dim-text" x="278" y="112">Depth</text>' +
        '<defs><marker id="arrow2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#475569" /></marker></defs>' +
        "</svg>";
    }

    function updateCustomDiagram() {
      if (!diagram) return;
      diagram.innerHTML =
        '<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Custom volume diagram">' +
        '<polygon class="volume-face-top" points="60,70 200,40 280,70 140,100" />' +
        '<polygon class="volume-face-left" points="60,70 140,100 140,170 60,140" />' +
        '<polygon class="volume-face-right" points="140,100 280,70 280,140 140,170" />' +
        '<text class="dim-text" x="90" y="200">Known volume, converted directly</text>' +
        "</svg>";
    }

    /* Initial diagram render */
    updateRectangleDiagram(20, 12, "ft");
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initCalculator();
  });
})();
