const fs = require('fs');
const path = require('path');

const clearImage = filePath => {
  const pathFile = path.join(__dirname, '..', filePath);
  fs.unlink(pathFile, err => console.log(err));
};
module.exports = clearImage;
