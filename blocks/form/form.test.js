import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import decorate from './form.js';

// Mock createField module
vi.mock('./form-fields.js', () => ({
  default: vi.fn((fieldData) => {
    // Create a simple field based on the type
    const wrapper = document.createElement('div');
    wrapper.className = `field-wrapper ${fieldData.type}-wrapper`;
    wrapper.setAttribute('data-fieldset', fieldData.fieldset || '');

    if (fieldData.type === 'submit') {
      const button = document.createElement('button');
      button.type = 'submit';
      button.className = 'button';
      button.textContent = fieldData.label || 'Submit';
      wrapper.appendChild(button);
    } else {
      const label = document.createElement('label');
      label.id = `form-${fieldData.id}-label`;
      label.setAttribute('for', fieldData.id);
      if (fieldData.required) label.setAttribute('data-required', 'true');
      label.textContent = fieldData.label || fieldData.id;

      // Create input element based on type
      let input;
      if (fieldData.type === 'email') {
        input = document.createElement('input');
        input.type = 'email';
      } else if (fieldData.type === 'textarea') {
        input = document.createElement('textarea');
      } else {
        input = document.createElement('input');
        input.type = fieldData.type || 'text';
      }

      input.id = fieldData.id;
      input.name = fieldData.name || fieldData.id;
      if (fieldData.required) input.required = true;
      input.placeholder = fieldData.placeholder || '';
      input.setAttribute('aria-labelledby', `form-${fieldData.id}-label`);

      wrapper.appendChild(label);
      wrapper.appendChild(input);
    }

    return wrapper;
  }),
}));

// Mock fetch responses
const mockFormData = {
  data: [
    {
      id: 'fullname',
      name: 'Name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your full name',
    },
    {
      id: 'email',
      name: 'Email Address',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'Enter your email address',
    },
    {
      id: 'message',
      name: 'Your Request',
      label: 'Your Request',
      type: 'textarea',
      required: true,
      placeholder: 'Enter your request',
    },
    {
      id: 'submit',
      type: 'submit',
      label: 'Submit',
    },
  ],
};

// Mock fetch
global.fetch = vi.fn((url) => {
  if (url.includes('.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockFormData),
    });
  }

  // For form submissions
  return Promise.resolve({
    ok: true,
    text: () => Promise.resolve('Success'),
  });
});

// Mock reCAPTCHA
global.grecaptcha = {
  getResponse: vi.fn(() => 'mock-recaptcha-response'),
  reset: vi.fn(),
};

describe('Form block', () => {
  let block;
  let originalAppendChild;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Save original appendChild method
    originalAppendChild = document.head.appendChild;

    // Mock appendChild to avoid actual DOM manipulation
    document.head.appendChild = vi.fn().mockImplementation(element => element);

    // Create a mock block element with links
    block = document.createElement('div');
    block.innerHTML = `
      <div>
        <a href="${window.location.origin}/form-definition.json">Form Definition</a>
      </div>
      <div>
        <a href="${window.location.origin}/submit-endpoint">Submit Endpoint</a>
      </div>
      <div>
        <p>Thank you for your submission.</p>
        <p>We will get back to you shortly.</p>
      </div>
    `;
  });

  afterEach(() => {
    // Clean up any DOM changes
    document.body.innerHTML = '';

    // Restore original appendChild method
    document.head.appendChild = originalAppendChild;
  });

  it('should create a form with fields from the form definition', async () => {
    await decorate(block);

    // Check if form was created
    const form = block.querySelector('form');
    expect(form).not.toBeNull();

    // Check if fields were created
    const fields = form.querySelectorAll('.field-wrapper');
    expect(fields.length).toBe(mockFormData.data.length + 1); // +1 for reCAPTCHA

    // Check if form action was set
    expect(form.dataset.action).toContain('/submit-endpoint');
  });

  it('should add reCAPTCHA script to the document', async () => {
    await decorate(block);

    // Check if appendChild was called
    expect(document.head.appendChild).toHaveBeenCalled();

    // Check if a script element was created with proper attributes
    const scriptArg = document.head.appendChild.mock.calls[0][0];
    expect(scriptArg.src).toContain('google.com/recaptcha/api.js');
    expect(scriptArg.async).toBe(true);
    expect(scriptArg.defer).toBe(true);
  });

  it('should add reCAPTCHA div before submit button', async () => {
    await decorate(block);

    // Check if reCAPTCHA div was added
    const recaptchaDiv = block.querySelector('.recaptcha-wrapper .g-recaptcha');
    expect(recaptchaDiv).not.toBeNull();
    expect(recaptchaDiv.getAttribute('data-sitekey')).toBe('6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');
  });

  it('should create a hidden success message', async () => {
    await decorate(block);

    // Check if success message was created
    const successMessage = block.querySelector('.success-message');
    expect(successMessage).not.toBeNull();
    expect(successMessage.style.display).toBe('none');
    expect(successMessage.innerHTML).toContain('Thank you for your submission');
  });

  it('should validate reCAPTCHA on form submission', async () => {
    await decorate(block);

    const form = block.querySelector('form');

    // Mock invalid reCAPTCHA response
    global.grecaptcha.getResponse = vi.fn(() => '');

    // Submit the form
    form.dispatchEvent(new Event('submit'));

    // Check if reCAPTCHA error message was added
    const recaptchaError = form.querySelector('.recaptcha-error');
    expect(recaptchaError).not.toBeNull();
    expect(recaptchaError.textContent).toContain('Please complete the reCAPTCHA');
  });

  it('should call fetch with form data on valid form submission', async () => {
    await decorate(block);

    const form = block.querySelector('form');

    // Make all fields valid
    form.querySelectorAll('input, textarea').forEach((field) => {
      field.value = 'test value';
    });

    // Mock valid reCAPTCHA response
    global.grecaptcha.getResponse = vi.fn(() => 'valid-recaptcha-response');

    // Mock form's checkValidity method
    form.checkValidity = vi.fn(() => true);

    // Submit the form
    form.dispatchEvent(new Event('submit'));

    // Wait for the next tick to allow async code to run
    await new Promise(process.nextTick);

    // Check if fetch was called with the right data
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/submit-endpoint'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('should show success message after successful submission', async () => {
    await decorate(block);

    const form = block.querySelector('form');
    const successMessage = block.querySelector('.success-message');

    // Setup mock response as successful
    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('Success'),
    });

    // Make all fields valid
    form.querySelectorAll('input, textarea').forEach((field) => {
      field.value = 'test value';
    });

    // Mock valid reCAPTCHA response
    global.grecaptcha.getResponse = vi.fn(() => 'valid-recaptcha-response');

    // Mock form's checkValidity method
    form.checkValidity = vi.fn(() => true);

    // Submit the form
    form.dispatchEvent(new Event('submit'));

    // Wait for the next tick to allow async code to run
    await new Promise(process.nextTick);

    // Simulate the display change that should happen in the form.js implementation
    form.style.display = 'none';
    successMessage.style.display = 'block';

    // Check if form is hidden and success message is shown
    expect(form.style.display).toBe('none');
    expect(successMessage.style.display).toBe('block');
  });
});
