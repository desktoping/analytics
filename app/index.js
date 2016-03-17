/** Domain specific analysis tool **/
import rethink from 'rethinkdbdash';
import koa from 'koa';
import Router from 'koa-router';
import parser from 'koa-bodyparser';
import kue from 'kue';
import requireAll from 'require-all';
import _ from 'lodash';
import koaHbs from 'koa-handlebars';
import handlebars from 'handlebars';
import serve from 'koa-static';

const controllers = requireAll({
  dirname: `${__dirname}/controllers`,
  filter: /^(.+)\.js$/
});


const app = new koa();
const router = new Router();
const q = kue.createQueue();

const r = rethink();

q.process('jobs', 20, (job, done) => {
  const {_db, _type} = job.data;
  r.dbCreate(_db);
  r.db(_db).tableCreate(_type);
  r.db(_db).table(_type).insert([job.data]).run().then((res) => {
    done();
  });
});

app.use(serve('./app/public'));
app.use(parser());
app.use(koaHbs({
  handlebars,
  cache: process.env.NODE_ENV === 'production',
  viewsDir: './app/views',
  layoutsDir: './app/layouts',
  partialsDir: './app/views/partials',
  defaultLayout: 'main',
  data: {
    copyrightYear: new Date().getFullYear()
  }
}));

function walkControllers(controllers) {
  _.each(controllers, (controller) => {
    if (_.isFunction(controller)) controller.call(app, router, q, r);
    else if (_.isObject(controller)) walkControllers(controller);
  });
}
walkControllers(controllers);

app.use(router.routes());

export default app;
