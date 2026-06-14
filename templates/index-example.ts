import { onCall } from 'firebase-functions/v2/https';
import { fanstack } from './fan/fanstack';

// 'action' is the callable endpoint name deployed to Firebase.
// It automatically triggers the Fanstack middleware and action routing pipeline.
export const action = onCall({ cors: true }, fanstack);
