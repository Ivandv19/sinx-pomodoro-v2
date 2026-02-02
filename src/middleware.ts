```typescript
import { defineMiddleware } from "astro:middleware";
import { initializeLucia } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
    // 5. Set locals
    // context.locals.session = session;
    // context.locals.user = user;

    return next();
});

```
