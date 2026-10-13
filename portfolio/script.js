"use strict";
(() => {
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll(".case-card[data-kind]")];
  const status = document.getElementById("filter-status");
  for (const button of filterButtons) {
    button.addEventListener("click", () => {
      const kind = button.dataset.filter;
      for (const item of filterButtons) {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      }
      let count = 0;
      for (const card of cards) {
        card.hidden = kind !== "all" && card.dataset.kind !== kind;
        if (!card.hidden) count += 1;
      }
      if (status) status.textContent = "Showing " + count + " project" + (count === 1 ? "" : "s");
    });
  }
  const copy = document.querySelector("[data-copy-email]");
  const message = document.querySelector("[data-copy-status]");
  if (copy && message) {
    copy.addEventListener("click", async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error("not available");
        await navigator.clipboard.writeText("devon@anevum.com");
        message.textContent = "Email address copied.";
      } catch {
        message.textContent = "Copy unavailable here. The address is shown below.";
      }
    });
  }
})();