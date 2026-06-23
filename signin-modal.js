function setupSignInModal() {
  const modal = document.getElementById("signinModal");
  const openButton = document.getElementById("openSignInModal");
  const closeButton = document.getElementById("closeSignInModal");
  const form = document.getElementById("signinModalForm");

  if (!modal || !openButton || !closeButton || !form) {
    return;
  }

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("signin-modal-open");
    document.getElementById("signinEmail")?.focus();
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("signin-modal-open");
    openButton.focus();
  };

  openButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.closeSignin === "true") {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    closeModal();
  });
}

document.addEventListener("DOMContentLoaded", setupSignInModal);
