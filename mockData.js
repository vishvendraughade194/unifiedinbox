const sampleSendersByPlatform = {
  gmail: ['Alice', 'Bob', 'Carol', 'Dave'],
  telegram: ['Dev Group', 'Product Team', 'QA Squad', 'Support Bot'],
  whatsapp: ['Mom', 'Dad', 'Bestie', 'Cousin'],
  instagram: ['Follower123', 'CreatorHub', 'BrandCollab'],
  twitter: ['@someone', '@friend', '@company'],
};

const sampleTexts = [
  'Your order has been shipped!',
  'Can we catch up later today?',
  'Here is the document you asked for.',
  'Reminder: meeting at 3 PM.',
  'Check out the new API docs!',
  'Nice post on React!',
  'Let’s deploy the new version.',
  'Ping me when free.',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = { sampleSendersByPlatform, sampleTexts, pickRandom };


