import { listen } from './service.js';

const port = process.argv[2] || 3000;
listen(port, () => {
  console.log(`Server started on port ${port}`);
});
