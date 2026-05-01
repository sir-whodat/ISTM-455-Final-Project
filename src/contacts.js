const sampleContacts = [
  { firstName: 'Ava', lastName: 'Turner', email: 'ava.turner@example.com', phone: '555-0101', company: 'Northwind', notes: 'Prefers email.' },
  { firstName: 'Noah', lastName: 'Bennett', email: 'noah.bennett@example.com', phone: '555-0102', company: 'Blue Peak', notes: 'Morning calls only.' },
  { firstName: 'Mia', lastName: 'Collins', email: 'mia.collins@example.com', phone: '555-0103', company: 'Atlas Studio', notes: 'Met at a conference.' },
  { firstName: 'Ethan', lastName: 'Parker', email: 'ethan.parker@example.com', phone: '555-0104', company: 'Pine Labs', notes: 'Needs quarterly check-ins.' },
  { firstName: 'Sophia', lastName: 'Nguyen', email: 'sophia.nguyen@example.com', phone: '555-0105', company: 'Summit Health', notes: 'Shared a project brief.' },
  { firstName: 'Lucas', lastName: 'Reed', email: 'lucas.reed@example.com', phone: '555-0106', company: 'Harbor Co.', notes: 'Likes concise updates.' },
  { firstName: 'Isla', lastName: 'Morgan', email: 'isla.morgan@example.com', phone: '555-0107', company: 'Greenfield', notes: 'Follow up next week.' },
  { firstName: 'Mason', lastName: 'Brooks', email: 'mason.brooks@example.com', phone: '555-0108', company: 'Vertex', notes: 'Asked for a demo.' },
  { firstName: 'Zoe', lastName: 'Carter', email: 'zoe.carter@example.com', phone: '555-0109', company: 'Orbit Works', notes: 'Handles vendor relations.' },
  { firstName: 'Elijah', lastName: 'Ward', email: 'elijah.ward@example.com', phone: '555-0110', company: 'Harbor Co.', notes: 'Backup contact for finance.' }
];

function normalizeContact(input = {}) {
  return {
    firstName: String(input.firstName ?? '').trim(),
    lastName: String(input.lastName ?? '').trim(),
    email: String(input.email ?? '').trim(),
    phone: String(input.phone ?? '').trim(),
    company: String(input.company ?? '').trim(),
    notes: String(input.notes ?? '').trim()
  };
}

function validateContact(contact) {
  const errors = [];

  if (!contact.firstName) {
    errors.push('firstName is required');
  }

  if (!contact.lastName) {
    errors.push('lastName is required');
  }

  if (!contact.email) {
    errors.push('email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(contact.email)) {
    errors.push('email must be a valid email address');
  }

  return errors;
}

module.exports = {
  normalizeContact,
  sampleContacts,
  validateContact
};