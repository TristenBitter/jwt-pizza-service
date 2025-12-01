export const jwtSecret =
  process.env.JWT_SECRET || "yourRandomJWTGenerationSecretForAuth";

export const sqlDb = {
  connection: {
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "NewPassword123!",
    database: process.env.DB_NAME || "jwtpizza",
    connectTimeout: 60000,
  },
  listPerPage: 10,
};

export const factory = {
  url: process.env.FACTORY_URL || "https://pizza-factory.cs329.click",
  apiKey: process.env.FACTORY_API_KEY || "4a253a1c77e14bd3b0e8dcfcc594d434",
};

export const metrics = {
  source: process.env.METRICS_SOURCE || "jwt-pizza-service-dev",
  url:
    process.env.METRICS_URL ||
    "https://otlp-gateway-prod-us-east-2.grafana.net/otlp/v1/metrics",
  apiKey:
    process.env.METRICS_API_KEY ||
    "1429590:glc_eyJvIjoiMTU4MjExNyIsIm4iOiJzdGFjay0xNDI5NTkwLWludGVncmF0aW9uLWp3dC1waXp6YS1tZXRyaWNzIiwiayI6Ik0zMHBySTJZOEE2V3VqUDFRQkswMFA3OSIsIm0iOnsiciI6InByb2QtdXMtZWFzdC0wIn19",
};

export const logging = {
  source: "jwt-pizza-service-prod",
  userId: 0,
  url: "",
  apiKey: "",
};
