// Dummy data
const messages = [
  {
    platform: 'gmail',
    sender: 'Alice - Gmail',
    text: 'Your order has been shipped!',
  },
  {
    platform: 'telegram',
    sender: 'Dev Group - Telegram',
    text: 'Check out the new API docs!',
  },
  {
    platform: 'whatsapp',
    sender: 'Mom - WhatsApp',
    text: 'Dinner at 8?',
  },
  {
    platform: 'instagram',
    sender: 'Follower - Instagram',
    text: 'Nice post on React!',
  },
  {
    platform: 'facebook',
    sender: 'Event Reminder - Facebook',
    text: 'Your event starts in 1 hour.',
  },
];

// DOM Elements
const messagesContainer = document.getElementById('messages');
const sidebarItems = document.querySelectorAll('.sidebar ul li');
const searchInput = document.getElementById('search');

// Render messages
function renderMessages(platform = 'all') {
  messagesContainer.innerHTML = '';
  const filtered = messages.filter(msg => platform === 'all' || msg.platform === platform);

  filtered.forEach((msg, index) => {
    const el = document.createElement('div');
    el.className = 'message';
    el.innerHTML = `
      <div class="platform">${msg.platform.toUpperCase()}</div>
      <div class="sender">${msg.sender}</div>
      <div class="text">${msg.text}</div>
    `;
    messagesContainer.appendChild(el);

    // Animate with GSAP
    gsap.from(el, {
      opacity: 0,
      y: 50,
      delay: index * 0.1,
      duration: 0.5,
      ease: 'power2.out',
    });
  });
}

// Sidebar filtering
sidebarItems.forEach(item => {
  item.addEventListener('click', () => {
    document.querySelector('.sidebar ul li.active').classList.remove('active');
    item.classList.add('active');
    const platform = item.getAttribute('data-platform');
    renderMessages(platform);
  });
});

// Search functionality
searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  const filtered = messages.filter(
    msg =>
      msg.sender.toLowerCase().includes(term) ||
      msg.text.toLowerCase().includes(term)
  );
  messagesContainer.innerHTML = '';
  filtered.forEach((msg, index) => {
    const el = document.createElement('div');
    el.className = 'message';
    el.innerHTML = `
      <div class="platform">${msg.platform.toUpperCase()}</div>
      <div class="sender">${msg.sender}</div>
      <div class="text">${msg.text}</div>
    `;
    messagesContainer.appendChild(el);
    gsap.from(el, {
      opacity: 0,
      x: -30,
      delay: index * 0.1,
      duration: 0.5,
      ease: 'power2.out',
    });
  });
});

// Initial load
renderMessages();

