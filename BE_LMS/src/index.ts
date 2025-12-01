//constants
import { NODE_ENV, PORT } from './constants/env';

//config
import { ensureBucket } from './config/minio';
import connectToDatabase from './config/db';

import { createApp } from './app';

/**
 * Check if the bucket exists and set policy
 * then start the server
 */
async function startServer() {
  const app = await createApp();

  ensureBucket()
    .then(() => console.log('✅ MinIO initialized'))
    .catch((err) => console.error('⚠️ MinIO not ready:', err));

  app.listen(PORT, async () => {
    console.log(`Server started on port ${PORT} in ${NODE_ENV} environment`);
    await connectToDatabase();
  });
}

startServer();
