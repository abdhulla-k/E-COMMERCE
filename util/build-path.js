const path = require('path');
const buildPaths = {
   buildPathHtml: path.resolve('./report.txt'),
   buildPathPdf: path.resolve('./views/admin/build.pdf')
};
module.exports = buildPaths;