const contactForm = document.querySelector('#contact-form');
const formTitle = document.querySelector('#form-title');
const formMessage = document.querySelector('#form-message');
const contactsContainer = document.querySelector('#contacts');
const contactCount = document.querySelector('#contact-count');
const resetButton = document.querySelector('#reset-button');
const template = document.querySelector('#contact-template');

let contacts = [];
let editingId = null;

function setMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? '#a03c2e' : '#665a52';
}

function getFormData() {
  const formData = new FormData(contactForm);

  return {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    company: formData.get('company'),
    notes: formData.get('notes')
  };
}

function fillForm(contact) {
  contactForm.firstName.value = contact.firstName || '';
  contactForm.lastName.value = contact.lastName || '';
  contactForm.email.value = contact.email || '';
  contactForm.phone.value = contact.phone || '';
  contactForm.company.value = contact.company || '';
  contactForm.notes.value = contact.notes || '';
}

function resetForm() {
  editingId = null;
  contactForm.reset();
  formTitle.textContent = 'Add contact';
  setMessage('');
}

function renderContacts() {
  contactsContainer.innerHTML = '';
  contactCount.textContent = `${contacts.length} saved`;

  contacts.forEach((contact) => {
    const node = template.content.cloneNode(true);
    node.querySelector('h3').textContent = `${contact.firstName} ${contact.lastName}`;
    node.querySelector('.email').textContent = contact.email;

    const metaParts = [contact.phone, contact.company].filter(Boolean);
    node.querySelector('.meta').textContent = metaParts.join(' • ');
    node.querySelector('.notes').textContent = contact.notes || 'No notes yet.';

    node.querySelector('[data-action="edit"]').addEventListener('click', () => {
      editingId = contact.id;
      formTitle.textContent = 'Edit contact';
      fillForm(contact);
      setMessage(`Editing ${contact.firstName} ${contact.lastName}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    node.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!window.confirm(`Delete ${contact.firstName} ${contact.lastName}?`)) {
        return;
      }

      const response = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        setMessage('Unable to delete contact.', true);
        return;
      }

      if (editingId === contact.id) {
        resetForm();
      }

      await loadContacts();
      setMessage('Contact deleted.');
    });

    contactsContainer.append(node);
  });
}

async function loadContacts() {
  const response = await fetch('/api/contacts');
  if (!response.ok) {
    throw new Error('Failed to load contacts');
  }

  contacts = await response.json();
  renderContacts();
}

contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const method = editingId ? 'PUT' : 'POST';
  const url = editingId ? `/api/contacts/${editingId}` : '/api/contacts';
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(getFormData())
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    setMessage(payload.errors ? payload.errors.join(', ') : (payload.message || 'Unable to save contact.'), true);
    return;
  }

  resetForm();
  await loadContacts();
  setMessage(method === 'POST' ? 'Contact added.' : 'Contact updated.');
});

resetButton.addEventListener('click', resetForm);

loadContacts().catch(() => {
  setMessage('Failed to load contacts.', true);
});