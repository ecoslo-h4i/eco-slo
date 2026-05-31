// Single source of truth for the variables an author may place in a reminder
// message body, e.g. "{firstName}". Imported by BOTH runtimes:
//   - the Next.js reminder form, to render the variable chips, and
//   - the send-pending-emails edge function, to substitute them per recipient.
//
// Keep this file dependency-free (no imports) so the Next bundler and the Deno
// edge runtime can each consume it. The email resolver is typed
// `Record<MessageVariable, ...>`, so adding a variable here won't compile until
// a resolver handles it — that's what keeps the chips and the substitution in
// lockstep.

/** Variable names supported in a reminder message body. */
export const MESSAGE_VARIABLES = ["firstName", "treeCount", "treeNames"] as const;

export type MessageVariable = (typeof MESSAGE_VARIABLES)[number];

/** The literal token as it appears in a message body, e.g. "{firstName}". */
export function messageVariableToken(name: MessageVariable): string {
  return `{${name}}`;
}

/** Every token, e.g. ["{firstName}", "{treeCount}", "{treeNames}"]. */
export const MESSAGE_VARIABLE_TOKENS: string[] = MESSAGE_VARIABLES.map(messageVariableToken);
