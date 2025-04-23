import createField from './form-fields.js';

async function createForm(formHref, submitHref) {
  const { pathname } = new URL(formHref);
  const resp = await fetch(pathname);
  const json = await resp.json();

  const form = document.createElement('form');
  form.dataset.action = submitHref;

  const fields = await Promise.all(json.data.map((fd) => createField(fd, form)));
  fields.forEach((field) => {
    if (field) {
      form.append(field);
    }
  });

  // group fields into fieldsets
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets.forEach((fieldset) => {
    form.querySelectorAll(`[data-fieldset="${fieldset.name}"`).forEach((field) => {
      fieldset.append(field);
    });
  });

  return form;
}

function generatePayload(form) {
  const payload = {};

  [...form.elements].forEach((field) => {
    if (field.name && field.type !== 'submit' && !field.disabled) {
      if (field.type === 'radio') {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === 'checkbox') {
        if (field.checked) payload[field.name] = payload[field.name] ? `${payload[field.name]},${field.value}` : field.value;
      } else {
        payload[field.id] = field.value;
      }
    }
  });
  return payload;
}

async function handleSubmit(form) {
  if (form.getAttribute('data-submitting') === 'true') return;

  const submit = form.querySelector('button[type="submit"]');
  try {
    form.setAttribute('data-submitting', 'true');
    submit.disabled = true;

    // create payload
    const payload = generatePayload(form);

    // Add reCAPTCHA response to payload
    payload['g-recaptcha-response'] = window.grecaptcha?.getResponse() || '';

    const response = await fetch(form.dataset.action, {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      // Find the success message div
      const successMessage = form.closest('.form').querySelector('.success-message');
      if (successMessage) {
        // Hide the form and show success message
        form.style.display = 'none';
        successMessage.style.display = 'block';
      } else if (form.dataset.confirmation) {
        // Fallback to the confirmation page if success message not found
        window.location.href = form.dataset.confirmation;
      }
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  } finally {
    form.setAttribute('data-submitting', 'false');
    submit.disabled = false;

    // Reset reCAPTCHA
    if (window.grecaptcha) {
      window.grecaptcha.reset();
    }
  }
}

export default async function decorate(block) {
  const links = [...block.querySelectorAll('a')].map((a) => a.href);
  const formLink = links.find((link) => link.startsWith(window.location.origin) && link.endsWith('.json'));
  const submitLink = links.find((link) => link !== formLink);
  if (!formLink || !submitLink) return;

  // Add reCAPTCHA script
  if (!document.querySelector('script[src*="recaptcha"]')) {
    const recaptchaScript = document.createElement('script');
    recaptchaScript.src = 'https://www.google.com/recaptcha/api.js';
    recaptchaScript.async = true;
    recaptchaScript.defer = true;
    document.head.appendChild(recaptchaScript);
  }

  // Get the content of the third div for success message
  const successContent = block.children[2]?.innerHTML || '<p>Thank you for your submission.</p>';

  const form = await createForm(formLink, submitLink);

  // Add reCAPTCHA div before submit button
  const submitWrapper = form.querySelector('.submit-wrapper');
  if (submitWrapper) {
    const recaptchaWrapper = document.createElement('div');
    recaptchaWrapper.className = 'field-wrapper recaptcha-wrapper';
    recaptchaWrapper.setAttribute('data-fieldset', '');

    const recaptchaDiv = document.createElement('div');
    recaptchaDiv.className = 'g-recaptcha';
    recaptchaDiv.setAttribute('data-sitekey', '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'); // Replace with your actual site key

    recaptchaWrapper.appendChild(recaptchaDiv);
    form.insertBefore(recaptchaWrapper, submitWrapper);
  }

  // Create success message div (hidden by default)
  const successMessage = document.createElement('div');
  successMessage.className = 'success-message';
  successMessage.style.display = 'none';
  successMessage.innerHTML = successContent;

  // Clear block and add form and success message
  block.innerHTML = '';
  block.appendChild(form);
  block.appendChild(successMessage);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const valid = form.checkValidity();

    // Check reCAPTCHA
    const recaptchaResponse = window.grecaptcha?.getResponse();
    const recaptchaValid = !!recaptchaResponse;

    if (!recaptchaValid) {
      // Show reCAPTCHA error
      const recaptchaError = document.createElement('div');
      recaptchaError.className = 'recaptcha-error';
      recaptchaError.textContent = 'Please complete the reCAPTCHA.';

      const existingError = form.querySelector('.recaptcha-error');
      if (existingError) {
        existingError.remove();
      }

      const recaptchaWrapper = form.querySelector('.recaptcha-wrapper');
      if (recaptchaWrapper) {
        recaptchaWrapper.appendChild(recaptchaError);
      }

      return;
    }

    if (valid) {
      handleSubmit(form);
    } else {
      const firstInvalidEl = form.querySelector(':invalid:not(fieldset)');
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}
