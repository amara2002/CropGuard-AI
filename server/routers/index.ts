import { router } from "../_core/trpc.js";
import { authRouter  } from "./auth.js";
import { userRouter  } from "./user.js";
import { scansRouter } from "./scans.js";

export const appRouter = router({
  auth:  authRouter,
  user:  userRouter,
  scans: scansRouter,
});

export type AppRouter = typeof appRouter;