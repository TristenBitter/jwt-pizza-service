module.exports =  {
   jwtSecret: 'myjwtsecret',
   db: {
     connection: {
       host: '127.0.0.1',
       user: 'root',
       password: 'new_password',
       database: 'pizza',
       connectTimeout: 60000,
     },
     listPerPage: 10,
   },
   factory: {
     url: 'https://pizza-factory.cs329.click',
     apiKey: '59b60707c7a14617a22ab142384e51c4',
   },
};
