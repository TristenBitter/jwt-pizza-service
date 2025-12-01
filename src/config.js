export const jwtSecret = "yourRandomJWTGenerationSecretForAuth";

export const sqlDb = {
  connection: {
    host: "127.0.0.1",
    user: "root",
    password: "Dolphin329",
    database: "jwtpizza",
    connectTimeout: 60000,
  },
  listPerPage: 10,
};

export const factory = {
  url: "https://pizza-factory.cs329.click",
  apiKey: "4a253a1c77e14bd3b0e8dcfcc594d434",
};

export const metrics = {
  source: "jwt-pizza-service-dev",
  url: "https://otlp-gateway-prod-us-east-2.grafana.net/otlp/v1/metrics",
  apiKey:
    "1429590:glc_eyJvIjoiMTU4MjExNyIsIm4iOiJzdGFjay0xNDI5NTkwLWludGVncmF0aW9uLWp3dC1waXp6YS1tZXRyaWNzIiwiayI6Ik0zMHBySTJZOEE2V3VqUDFRQkswMFA3OSIsIm0iOnsiciI6InByb2QtdXMtZWFzdC0wIn19",
};

export const logging = {
  source: "jwt-pizza-service-prod",
  userId: 0,
  url: "",
  apiKey: "",
};
