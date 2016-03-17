import beauty from 'json-beautify';

export default function (router, worker, r) {
  router.get('/', function *() {
    function listDatabase(r) {
      return new Promise((resolve, reject) => {
        r.dbList().run().then((lists) => {
          return resolve(lists);
        }).catch((err) => {
          return reject(err);
        });
      });
    }
    const db = yield listDatabase(r);
    yield this.render('index', {
      db
    });
  });


  router.get('/database/:database', function *() {
    const db = this.params.database;
    function dbData (r) {
      return new Promise((resolve, reject) => {
        r.db(db).tableList().run().then((data) => {
          return resolve(data);
        }).catch((err) => {
          return reject(err);
        })
      });
    }
    this.body = yield dbData(r);
  });

  router.get('/:database/table/:table', function *() {
    const db = this.params.database;
    const tb = this.params.table;
    function tbData (r) {
      return new Promise((resolve, reject) => {
        r.db(db).table(tb).run().then((data) => {
          return resolve(data);
        }).catch((err) => {
          return reject(err);
        })
      });
    }
    const data = yield tbData(r);
    yield this.render('table', {
      data: JSON.stringify(data, null, 2),
    });
  });

  // publishing 
  router.post('/post', function *() {
    /* data submitted should follow this format
      {
        _db: 'database name example dogcloud',
        _type: 'what kind of data is this example pageview, userlogin, userlogout' this will become the table for rethinkdb
        ...
      }
    */
    function createJob (option) {
      return new Promise((resolve, reject) => {
        worker.create('jobs', option)
        .save((err) => {
          if (err) return reject(err);
          return resolve();
        });
      });
    }
    
    this.body = yield createJob(this.request.body);

  });
}
