const bcrypt = require('bcrypt');

const hash = '$2b$10$c82SmWiZa7GaUrj5XsV2keE8cQOrGkVnhFupksmzuMzTs2UpAX4WG';
const inputPassword = 'qwerty';

bcrypt.compare(inputPassword, hash, function(err, result) {
  console.log('Match:', result); // true if it matches
});