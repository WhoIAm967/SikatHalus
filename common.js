// ==========================================
// LOGIKA COMMON / GLOBAL (NAVIGASI MOBILE)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const mobileNav = document.getElementById("mobileNav");

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", () => {
      const open = mobileNav.hidden;
      mobileNav.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
    });

    mobileNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        mobileNav.hidden = true;
      });
    });
  }
});