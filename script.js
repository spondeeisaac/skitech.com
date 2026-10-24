'use strict';

/*
  Configure this value only after deploying apps-script/Code.gs as a Web App.
  Paste the deployment URL ending in /exec between the quotes. Never paste sheet
  credentials or private keys here. This JS file is public on GitHub Pages.
*/
const SKITECH_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz2fGLmg4pLhChaujg31-wWuGuJC_0jwX5W7zw68_zXnrMUOsim05ETmdXSys9Tn0y4RQ/exec';

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  }));
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Service cards select the most relevant service when a visitor opens the form.
document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    const select = document.querySelector('select[name="service"]');
    if (!select) return;
    const wanted = String(link.dataset.service || '').toLowerCase();
    const option = Array.from(select.options).find(item => item.text.toLowerCase() === wanted);
    if (option) select.value = option.value;
  });
});

const form = document.getElementById('enquiry-form');
const statusEl = document.getElementById('form-status');
if (form && statusEl) {
  const submitButton = form.querySelector('button[type="submit"]');
  const endpointConfigured = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(SKITECH_APPS_SCRIPT_URL);

  function setStatus(message, state) {
    statusEl.textContent = message;
    statusEl.dataset.state = state || 'info';
  }

  if (!endpointConfigured) {
    setStatus('The online enquiry form is not live yet. The site owner must connect the SKITECH enquiry system before publishing.', 'error');
  } else {
    setStatus('Use this form for all new project enquiries. Do not include confidential financial records.', 'info');
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!endpointConfigured) {
      setStatus('Your enquiry has not been sent because the website form is not connected yet. Please do not submit confidential information.', 'error');
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    if (String(data.website || '').trim()) {
      setStatus('Thank you.', 'success');
      form.reset();
      return;
    }
    if (String(data.message || '').trim().length < 10) {
      setStatus('Please add a little more detail so we can understand your request.', 'error');
      return;
    }
    if (!form.elements.consent || !form.elements.consent.checked) {
      setStatus('Please confirm the privacy consent before submitting.', 'error');
      return;
    }
    data.consent = 'Yes';
    data.pageUrl = window.location.href;
    data.submittedAt = new Date().toISOString();
    data.source = 'SKITECH website';
    submitButton.disabled = true;
    submitButton.style.opacity = '.7';
    submitButton.textContent = 'Sending enquiry…';
    try {
      /* Apps Script web apps do not expose a readable CORS response to this page.
         no-cors allows the browser to dispatch the request; verify delivery in the
         private Google Sheet during acceptance testing. */
      await fetch(SKITECH_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
      setStatus('Your enquiry has been sent for processing. SKITECH will follow up using the contact details you provided.', 'success');
      form.reset();
    } catch (error) {
      setStatus('We could not send your enquiry. Please try again later. No enquiry has been confirmed as received.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.style.opacity = '1';
      submitButton.innerHTML = 'Send project enquiry <span aria-hidden="true">↗</span>';
    }
  });
}
