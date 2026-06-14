import { CallableRequest } from 'firebase-functions/v2/https';
import { ActionContext } from '../action-context';
// import { SqlPool, SqlRunner } from '@prestomedia/sql-runner';

// // Singleton for the cloud function instance.
// const sql: SqlRunner | undefined = undefined;

/**
 * Middleware: Connect to Database
 * Instantiate a database connection and attach it to the context.
 */
export const connectToDatabase = async (
	_req: CallableRequest,
	_ctx: ActionContext,
): Promise<void> => {
	// if (sql == undefined) {
	// 	// The PoolOptions.connectionLimit should match the cloud function max instances
	// 	sql = new SqlPool(ctx.env.sqlConfig);
	// }
	// ctx.sql = sql;
};
