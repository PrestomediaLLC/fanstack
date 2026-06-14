# @prestomedia/fanstack

End-to-end typesafe Firebase Functions and Angular stack.

- (F)irebase Functions
- (A)ngular
- (N)ode

Building Firebase Functions for an Angular app usually involves a lot of friction: writing the backend endpoint, manually wiring up `httpsCallable` on the frontend, copying and pasting TypeScript interfaces between projects, and praying you didn't make a typo.

**Fanstack eliminates the boilerplate.** It is a lightweight CLI and architecture that automatically watches your Firebase Functions and generates a strictly-typed Angular service.

If you change a backend payload requirement, your Angular build will fail immediately. No more guessing.

## Why Fanstack?

- 💯 **100% Type Safety**: Backend actions and frontend services share the exact same TypeScript interfaces.

- ⚡ **Zero Express Overhead**: Fanstack ditches bulky Express wrappers in favor of Firebase's native `onCall` architecture. You get automatic App Check enforcement, out-of-the-box CORS, and natively decoded auth tokens with zero cold-start penalty.

- 🛠️ **Elegant Middleware**: A simple, sequential middleware pipeline for handling auth requirements, database connections, and custom claims before your action ever runs.

- 🤖 **Automated CLI**: `fan init` scaffolds your backend architecture, and `fan generate` builds your Angular SDK on the fly.

- 🚀 **Angular Service**: Simply inject the `FuncService` and make calls like `await func.folder.action()`

## Quick Start

### 1. Installation

Run this inside your Firebase functions/ directory:

```bash
npm install -D @prestomedia/fanstack
```

### 2. Setup

```bash
npx fan init
```

_This creates a `fan` folder in your backend with pre-configured middleware, an action context, and an example action_

### 3. Generate the Client

Create an angular service that calls your action functions.

```bash
npx fan generate --watch
```

## 🪄 How It Works

With Fanstack, you organize your backend into _Actions_. Every `.action.ts` file in your `fan/actions/` folder automatically becomes an executable endpoint on the frontend.

### The Backend Action

Simply define your payload, your response, and your logic. Fanstack automatically provides a secure `ActionContext` containing the user's natively verified Firebase Auth token.

File: `fan/actions/users/update-profile.action.ts`

```typescript
import { ActionContext } from '../../action-context';
import { UpdateProfilePayload, UserProfile } from '../../interfaces/users';

export const action = async (
	payload: UpdateProfilePayload,
	ctx: ActionContext,
): Promise<UserProfile> => {
	// The `requireAuth` middleware already verified the auth token
	// The `readUserProfile` middleware already loaded the user from the db

	const userId = ctx.user.id;

	// Do your database logic here...
	return { success: true, newName: payload.name };
};
```

> [!TIP]
> The first parameter (payload) is required. Use `payload: void` when an action does not have a payload in.

### The Generated Angular Service

Run `fan generate`, and Fanstack builds `FuncService` right into your Angular app. Your frontend code is incredibly clean and completely typesafe.

File: `src/app/my.component.ts`

```typescript
import { Component, inject } from '@angular/core';
import { FuncService } from '../core/services/fan-func-service.gen';

@Component({ ... })
export class MyComponent {

  private func = inject(FuncService);

  async saveProfile() {
    try {
        // Fully autocompleted, perfectly typed, and nested by your folder structure!
        // The userId is determined by the auth in the middleware
        const result = await this.func.users.updateProfile({
        name: 'Jane Doe'
      });

      console.log('Saved!', result.success);
    } catch (error) {
      console.error('Update failed', error);
    }
  }
}
```

## 🧠 The Middleware Pipeline

Fanstack uses a blazing-fast array-based middleware pipeline. You don't need heavy HTTP frameworks. Just write simple async functions that mutate your ActionContext or throw standard Firebase `HttpsError` exceptions.

File: `fan/middleware/require-admin.ts`

```typescript
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { ActionContext } from '../action-context';

export const requireAdmin = async (req: CallableRequest, ctx: ActionContext): Promise<void> => {
	if (!ctx.auth) {
		throw new HttpsError('unauthenticated', 'Please log in.');
	}

	// Assuming 'admin' was added elsewhere with Firebase's setCustomUserClaims()
	if (ctx.auth.token.admin !== true) {
		throw new HttpsError('permission-denied', 'Admin access required.');
	}
};
```

Drop it into your middleware array in `fanstack.ts` and it runs automatically before your actions!

### 🗄️ Connect to MySql (Google Cloud Sql)

Add middleware that provides a MySql connection using `@prestomedia/sql-runner`

```typescript
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { ActionContext } from '../action-context';
import { SqlPool, SqlRunner } from '@prestomedia/sql-runner';

// Singleton for the cloud function instance.
const sql: SqlRunner | undefined = undefined;

/**
 * Middleware: Connect to Database
 * Instantiate a database connection and attach it to the context.
 */
export const connectToDatabase = async (
	req: CallableRequest,
	ctx: ActionContext,
): Promise<void> => {
	if (sql == undefined) {
		// The PoolOptions.connectionLimit should match the cloud function max instances
		sql = new SqlPool(ctx.env.sqlConfig);
	}
	ctx.sql = sql;
};
```

File: `fan/actions/users/update-profile.action.ts`

```typescript
import { ActionContext } from '../../action-context';
import { UpdateProfilePayload, UserProfile } from '../../interfaces/users';

export const action = async (
	payload: UpdateProfilePayload,
	ctx: ActionContext,
): Promise<UserProfile> => {
	// The `requireAuth` middleware already verified the auth token
	// The `readUserProfile` middleware already loaded the user from the db

	const userId = ctx.user.id;
	const query = `update user set name = ? where userId = ?`;
	await ctx.sql.query(query, [payload.name, userId]);

	return { success: true, newName: payload.name };
};
```

## License

Copyright © 2026 Prestomedia, LLC.
Licensed under the MIT License.
