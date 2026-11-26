/* VVTECH — meni na manjim ekranima i godina u podnozju */
(function () {
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("meni");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
})();
