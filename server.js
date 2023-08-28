import express from 'express';
import nunjucks from 'nunjucks';
import { v4 as uuid } from 'uuid';

const PORT = process.env.PORT || 3000;

let todos = [
  {
    id: uuid(),
    name: 'Taste htmx',
    done: true
  },
  {
    id: uuid(),
    name: 'Buy a unicorn',
    done: false
  }
];

const getItemsLeft = () => todos.filter(t => !t.done).length;

const app = express();

nunjucks.configure('views', {
  autoescape:  true,
  express:  app
})

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(express.static('assets'));

app.get('/', (req, res) => {
  const { filter } = req.query;
  let filteredTodos = [];
  switch(filter) {
    case 'all':
      filteredTodos = todos;
      break;
    case 'active':
      filteredTodos = todos.filter(t => !t.done);
      break;
    case 'completed':
      filteredTodos = todos.filter(t => t.done);
      break;
    default:
      filteredTodos = todos;
  }
  if (req.headers['htmx-request']) {
    let markup = nunjucks.render('includes/todo-list.njk', { todos: filteredTodos });
    markup += nunjucks.render('includes/item-count.njk', { itemsLeft: getItemsLeft()});
    res.send(markup);
  } else {
    res.render('index.njk', { todos: filteredTodos, filter, itemsLeft: getItemsLeft() });
  }
});

app.post('/todos', (req, res) => {
  const { todo } = req.body;
  const newTodo = { id: uuid(), name: todo, done: false };
  todos.unshift(newTodo);
  let markup = nunjucks.render('includes/todo-item.njk', { todo: newTodo });
  markup  += nunjucks.render('includes/item-count.njk', { itemsLeft: getItemsLeft()});
  res.send(markup);
});

app.get('/todos/edit/:id', (req, res) => {
  const { id } = req.params;
  const todo = todos.find(t => t.id === id);
  const markup = nunjucks.render('includes/edit-item.njk', { todo });
  res.send(markup);
});

app.patch('/todos/:id', (req, res) => {
  const { id } = req.params;
  const todo = todos.find(t => t.id === id);
  todo.done = !todo.done;
  let markup = nunjucks.render('includes/todo-item.njk', { todo });
  markup  += nunjucks.render('includes/item-count.njk', { itemsLeft: getItemsLeft()});
  res.send(markup);
});

app.post('/todos/update/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const todo = todos.find(t => t.id === id);
  todo.name = name;
  let markup = nunjucks.render('includes/todo-item.njk', {todo: todo});
  markup  += nunjucks.render('includes/item-count.njk', { itemsLeft: getItemsLeft()});
  res.send(markup);
});

app.delete('/todos/:id', (req,res) => {
  const { id } = req.params;
  const idx = todos.find(t => t === id);
  todos.splice(idx, 1);
  const markup = nunjucks.render('includes/item-count.njk', { itemsLeft: getItemsLeft()});
  res.send(markup);
});

app.post('/todos/clear-completed', (req, res) => {
  const newTodos = todos.filter(t => !t.done);
  todos = [...newTodos];
  let markup = nunjucks.render('includes/todo-list.njk', { todos });
  markup += nunjucks.render('includes/item-count.njk', { itemsLeft: getItemsLeft()});
  res.send(markup);
});

app.post('/todos/toggle-all', (req, res) => {
  if (todos.length === 0) {
    return;
  }
  const done = !todos[0].done;
  todos = todos.map(todo => ({ ...todo, done: done }) );
  let markup = nunjucks.render('includes/todo-list.njk', { todos });
  markup += nunjucks.render('includes/item-count.njk', { itemsLeft: getItemsLeft()});
  res.send(markup);
});

app.listen(PORT);

console.log('Listening on port: ' + PORT);
