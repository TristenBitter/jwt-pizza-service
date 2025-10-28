module.exports = {
 jwtSecret: 'yourRandomJWTGenerationSecretForAuth',
 db: {
   connection: {
     //host: '127.0.0.1',
     host: 'host.docker.internal',
     user: 'root',
     password: 'Dolphin329',
     database: 'jwtpizza',
     connectTimeout: 60000,
   },
   listPerPage: 10,
 },
 factory: {
   url: 'https://pizza-factory.cs329.click',
   apiKey: '4a253a1c77e14bd3b0e8dcfcc594d434',
 },
};
