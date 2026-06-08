/* ==========================================================================
   NO LAG — ELITE PC HARDWARE HUB
   COMMUNICATIONS COORDINATOR (contact.js)
   ========================================================================== */

function handleContactSubmission(event) {
  event.preventDefault();

  const nameEl = document.getElementById('contact-name');
  const emailEl = document.getElementById('contact-email');
  const typeEl = document.getElementById('contact-type');
  const msgEl = document.getElementById('contact-msg');
  const successAlert = document.getElementById('contact-success-alert');

  if (!nameEl || !emailEl || !typeEl || !msgEl) return;

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const type = typeEl.value.trim();
  const message = msgEl.value.trim();

  // Load existing intercepted messages
  const rawMsgs = localStorage.getItem('noLag_messages');
  const messages = rawMsgs ? JSON.parse(rawMsgs) : [];

  const timestamp = new Date().toLocaleString();

  messages.unshift({
    name,
    email,
    type,
    message,
    date: timestamp
  });

  localStorage.setItem('noLag_messages', JSON.stringify(messages));

  // Clear Form Inputs
  nameEl.value = '';
  emailEl.value = '';
  msgEl.value = '';

  // Trigger alert UI
  if (successAlert) {
    successAlert.style.display = 'block';
    successAlert.classList.remove('hidden-el');
    successAlert.classList.remove('d-none');

    // Auto-scroll to view the alert safely
    successAlert.scrollIntoView({ behavior: 'smooth', block: 'end' });

    setTimeout(() => {
      successAlert.style.display = 'none';
      successAlert.classList.add('hidden-el');
      successAlert.classList.add('d-none');
    }, 5000);
  } else {
    console.info(`[CONTACT] Uplink Established: Message Pack Intercepted by Controller. Name: ${name}, Email: ${email}`);
  }
}

// Expose handler globally to window to bypass module encapsulation
window.handleContactSubmission = handleContactSubmission;

