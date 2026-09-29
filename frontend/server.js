const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const port = process.env.PORT || 3001;
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Next.js ready on port ${port}`);
  });
});
