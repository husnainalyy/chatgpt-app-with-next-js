export const baseURL =
  process.env.NODE_ENV == "development"
    ? "http://localhost:3000"
    : (() => {
        const url =
          process.env.VERCEL_ENV === "production"
            ? process.env.VERCEL_PROJECT_PRODUCTION_URL
            : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
        return url ? `https://${url}` : undefined;
      })();
