/*
  Potager: contact form errors as wireframe 08 (note 2).

  - The browser's own pop-up bubbles are turned off; each field shows its own error instead.
  - An error is a line under the field that starts with "Error", and the field gets a 2px scarlet border.
  - On Send, every field is checked, and the first one with an error gets the focus.
  - A field's error clears as soon as its value is fixed.
  - Without JavaScript the form keeps the browser's own checks.
*/
(function () {
  'use strict';

  const form = document.querySelector('.index-contact form.contact-form');
  if (!form) return;

  form.noValidate = true;

  const fields = Array.from(form.querySelectorAll('input.field, textarea.field, select.field'));

  function labelFor(field) {
    const label = form.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.trim().toLowerCase() : 'this field';
  }

  function messageFor(field) {
    const value = field.value.trim();

    if (field.required && value === '') {
      if (field.type === 'email') return 'Error: Enter your email address.';
      if (field.tagName === 'SELECT') return `Error: Choose a ${labelFor(field)}.`;
      return `Error: Enter your ${labelFor(field)}.`;
    }

    if (field.type === 'email' && value !== '' && !field.checkValidity()) {
      return 'Error: Enter an email address like you@example.com.';
    }

    return '';
  }

  function show(field, message) {
    const block = field.closest('.custom-form__block, .custom-form__block--group');
    const id = `${field.id}-error`;
    let error = document.getElementById(id);

    if (!message) {
      if (error) error.remove();
      block?.classList.remove('custom-form__block--error');
      field.removeAttribute('aria-invalid');
      const describedBy = (field.getAttribute('aria-describedby') || '').split(' ').filter((item) => item && item !== id);
      if (describedBy.length) field.setAttribute('aria-describedby', describedBy.join(' '));
      else field.removeAttribute('aria-describedby');
      return;
    }

    if (!error) {
      error = document.createElement('p');
      error.className = 'custom-form__error';
      error.id = id;
      // The error sits straight under the field, above any hint
      const anchor = field.closest('.select-wrapper, .select__wrapper') || field;
      anchor.insertAdjacentElement('afterend', error);
    }

    error.textContent = message;
    block?.classList.add('custom-form__block--error');
    field.setAttribute('aria-invalid', 'true');

    const describedBy = (field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    if (!describedBy.includes(id)) describedBy.unshift(id);
    field.setAttribute('aria-describedby', describedBy.join(' '));
  }

  function check(field) {
    const message = messageFor(field);
    show(field, message);
    return !message;
  }

  // Listens on the document before the form's own handlers (hCaptcha), so a form with
  // errors is never sent
  document.addEventListener('submit', (event) => {
    if (event.target !== form) return;
    let firstInvalid = null;

    fields.forEach((field) => {
      if (!check(field) && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      event.preventDefault();
      event.stopImmediatePropagation();
      firstInvalid.focus();
    }
  }, true);

  fields.forEach((field) => {
    const recheck = () => {
      if (field.getAttribute('aria-invalid') === 'true') check(field);
    };
    field.addEventListener('input', recheck);
    field.addEventListener('change', recheck);
  });
})();
