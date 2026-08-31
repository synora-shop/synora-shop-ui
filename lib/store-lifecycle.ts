/**
 * Facts about a shop's lifecycle that both the server actions and the screens
 * need to know.
 *
 * A separate module because a `"use server"` file may only export async
 * functions — a plain constant in one is a build error, not a style question.
 */

/**
 * How long a closed shop's data is kept before it is eligible for deletion.
 *
 * Long enough that closing on a Friday by mistake is recoverable on Monday, and
 * that a merchant who changes their mind after a bad month still has their
 * order history. The number is shown to the merchant at the moment they close,
 * so it is a promise rather than an implementation detail.
 */
export const RETENTION_DAYS = 30;
