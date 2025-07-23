const fs = require('fs');
const path = require('path');

// Words to add
const wordsToAdd = [
  'APP', 'APPS', 'BCC', 'BLOG', 'BLOGGED', 'BLOGGER', 'BLOGGING', 'BLOGS',
  'CEO', 'CYBER', 'DOTCOM', 'EMAILING', 'EMAILS', 'EMOJI', 'EMOJIS',
  'FAQ', 'FAQS', 'GPS', 'HASHTAG', 'HASHTAGS', 'HYPERLINK', 'HYPERLINKS',
  'INBOX', 'LAPTOPS', 'MEME', 'MEMES', 'METADATA', 'PDF', 'PDFS',
  'PLAYLIST', 'PLAYLISTS', 'PODCAST', 'PODCASTS', 'PREINSTALLED',
  'RINGTONE', 'RINGTONES', 'SELFIE', 'SELFIES', 'SITEMAP',
  'SMARTPHONE', 'SMARTPHONES', 'SPAM', 'SPAMMED', 'SPAMMING', 'SPAMS',
  'UNFOLLOW', 'UNFOLLOWS', 'USERNAME', 'USERNAMES', 'WEBINAR', 'WEBINARS',
  'WEBPAGE', 'WEBPAGES', 'WEBSITE', 'WEBSITES', 'WIFI'
];

// Read the database file
const filePath = path.join(__dirname, '..', 'src', 'data', 'words-database-compact.js');
const content = fs.readFileSync(filePath, 'utf8');

// Extract the word list string
const match = content.match(/const WORD_LIST_STRING = "(.*?)"/s);
if (!match) {
  console.error('Could not find WORD_LIST_STRING in file');
  process.exit(1);
}

// Get existing words
const existingWordString = match[1];
const existingWords = existingWordString.split('|');

// Add new words and sort
const allWords = [...existingWords, ...wordsToAdd];
const uniqueWords = [...new Set(allWords)];
uniqueWords.sort();

// Update the count
const oldCount = content.match(/Contains (\d+) words/);
const newCount = uniqueWords.length;

// Create new content
let newContent = content.replace(
  /const WORD_LIST_STRING = ".*?"/s,
  `const WORD_LIST_STRING = "${uniqueWords.join('|')}"`
);

// Update the word count
newContent = newContent.replace(
  /Contains \d+ words/,
  `Contains ${newCount} words`
);

// Write back to file
fs.writeFileSync(filePath, newContent);

console.log(`Successfully added ${wordsToAdd.length} words`);
console.log(`Old word count: ${oldCount ? oldCount[1] : 'unknown'}`);
console.log(`New word count: ${newCount}`);
console.log(`Actually added: ${newCount - existingWords.length} new unique words`);