import { createMemberIdentityHandler } from './handler.mjs';

// All secrets remain in Edge Function environment variables. Live verification is
// off unless both the enable switch and the tested response-contract gate are set.
Deno.serve(createMemberIdentityHandler({ env: (name: string) => Deno.env.get(name) }));
