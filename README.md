# Build a RESTful API with the Serverless Framework

Today, we’re going to implement serverless RESTful API services by using “Serverless Framework”. There are many cloud services provider offers serverless functionality like AWS Lambda, Azure Functions, and Google CloudFunctions but in this article, I’m sticking with AWS Lambda as a cloud service provider.

If you don’t know about the serverless idea then I strongly recommended that first checkout this [video](https://www.youtube.com/watch?v=wWEID0d6wfo) and come back once finished it.

### Serverless Framework

The serverless framework is an open source CLI tool that allows us to build, configure and deploy serverless functions (In our case, AWS Lambda functions).

Without "Serverless Framework", we have to go manually on console then create and configure necessary resources. That’s okay when the project is small and functions are limited but as soon as the project grows then creating and configuring resources is a challenging task and in lots of case unmaintainable. Writing code on console and managing team workflow becomes a tedious job.

With a "Serverless Framework", we can quickly build, configure and deploy resources within few commands. We can store our code and configuration into a centralized repository so we can design proper workflow and developers can later write, reuse and refer other developers codebase.

There are lots of significant advantages of using a serverless framework instead of doing manually work.

In this article, we're going to build a serverless Pokemon RESTful API services with a "Serverless Framework". Checkout below table for reference.

The code for this article can be found here: https://github.com/sagar-gavhane/pokemon-app

| #   | ENDPOINT     | METHOD | DESCRIPTION                                 |
| --- | ------------ | ------ | ------------------------------------------- |
| 1   | pokemon/     | GET    | Get a list of all pokemon from the database |
| 2   | pokemon/{id} | GET    | Get a specific pokemon.                     |
| 3   | pokemon/     | POST   | Add new pokemon to the database.            |
| 4   | pokemon/{id} | PUT    | Update existing pokemon.                    |
| 5   | pokemon/{id} | DELETE | Delete existing pokemon.                    |

### Prerequisites

Install the following tools and frameworks:

1. Node.js 8.10 or above
2. MySQL
3. Visual Studio Code (preffered) or any code editor
4. Postman

Next, create the project folder and initialize it using npm.

```bash
mkdir pokemon-app
cd pokemon-app
npm init -f
```

### Dependencies

Install the following packages to work with "Serverless Framework"

- [express](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js.
- [body-parser](https://www.npmjs.com/package/body-parser) - Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
- [mysql](https://github.com/mysqljs/mysql#getting-the-id-of-an-inserted-row) - A pure node.js JavaScript Client implementing the MySql protocol.
- [serverless](https://serverless.com/) - Framework for operationalize serverless development.
- [serverless-http](https://github.com/dougmoscrop/serverless-http) - Plugin allows you to wrap express API for serverless use.
- [serverless-offline](https://www.npmjs.com/package/serverless-offline) - Plugin to emulate AWS Lambda and API Gateway for speed up local development.

First up, we’ll install the serverless CLI:

```bash
npm install -g serverless
```

Now, let's install plugins and libraries step by step.

```bash
npm install express body-parser mysql serverless-http --save # app dependancies
npm install serverless-offline --save-dev # development dependancies
```

### App structure

Before we start writing the handler code, we’re going to structure the project folder and configure our tools.

Create the following structure at the root level:

```
/pokemon-app/
|--/configs
|----/dbConfig.js
|--/node_modules
|--.gitignore
|--index.js
|--package.json
|--serverless.yml
```

Make sure to list private files into `.gitignore` file so that we don’t accidentally commit it to public repository. Copy paste raw material from https://www.gitignore.io/api/node to `.gitignore` file.

`serverless.yml` file serves as a manifest for our RESTful api service. Where we define our functions, events, and necessary resources. Later, with serverless CLI we configure and deploy our service to AWS infrastructure.

```yaml
# serverless.yml
service: pokemon-service

provider:
  name: aws
  runtime: nodejs8.10
  stage: dev
  region: us-east-1
  memorySize: 512

functions:
  pokemonFunc:
    handler: index.handler
    events:
      - http:
          path: pokemon
          method: get
      - http:
          path: pokemon/{id}
          method: get
      - http:
          path: pokemon
          method: post
      - http:
          path: pokemon/{id}
          method: put
      - http:
          path: pokemon/{id}
          method: delete

plugins:
  - serverless-offline
```

We are doing a few things here:

1. **service**: `pokemon-service` is a name of the service. You can give any type name for your service.
2. **provider**: This is where we specify the name of the `provider` we’re using (AWS as cloud service provider) and configurations specific to it. In our case, we’ve configured the runtime (Node.js) with 8.10 version and region to `us-east-1`.
3. **functions**: We specify the functions provided by our service, Here I'm specifying `pokemonFunc` as function name with `http` events. We can also say that this is our AWS Lambda function.

We have to store our pokemon somewhere, for sake of simplicity I'm chosen MySQL but you can also use another type database. I have already created a database with name pokemon_db and inside a database created table pokemon_tb with id, name, height, weight, avatar, and createAt columns.

```sql
CREATE TABLE `pokemon_tb` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `height` float NOT NULL,
  `weight` float NOT NULL,
  `avatar` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `pokemon_tb` ADD PRIMARY KEY (`id`);

ALTER TABLE `pokemon_tb` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;
```

Rather than creating and managing connections every time, we configure pool connections once inside `dbConfig.js` file and reused it multiple times.

```javascript
// dbConfig.js
const mysql = require("mysql");
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "pokemon_app_db"
});

module.exports = pool;
```

### Writing the handler function

Let's focus on handling RESTful api route inside the index.js file with express. First, we imported the `serverless-http` package at the top. Second, we exported a handler function which is our application wrapped in the serverless package.

Here, we're implementing basic five routes for handling `crud` operation with pokemon (without any validation).

```javascript
const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const pool = require("./configs/dbConfig");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Handle pokemon GET route for all pokemon
app.get("/pokemon/", (req, res) => {
  const query = "SELECT * FROM pokemon_tb";
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message };
      res.send(response);
    }

    const pokemons = [...results];
    const response = {
      data: pokemons,
      message: "All pokemons successfully retrieved."
    };
    res.send(response);
  });
});

// Handle pokemon GET route for specific pokemon
app.get("/pokemon/:id", (req, res) => {
  const id = req.params.id;
  const query = `SELECT * FROM pokemon_tb WHERE id=${id}`;
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message };
      res.send(response);
    }

    const pokemon = results[0];
    const response = {
      data: pokemon,
      message: `Pokemon ${pokemon.name} successfully retrieved.`
    };
    res.status(200).send(response);
  });
});

// Handle pokemon POST route
app.post("/pokemon/", (req, res) => {
  const { name, height, weight, avatar } = req.body;

  const query = `INSERT INTO pokemon_tb (name, height, weight, avatar) VALUES ('${name}', '${height}', '${weight}', '${avatar}')`;
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message };
      res.send(response);
    }

    const { insertId } = results;
    const pokemon = { id: insertId, name, height, weight, avatar };
    const response = {
      data: pokemon,
      message: `Pokemon ${name} successfully added.`
    };
    res.status(201).send(response);
  });
});

// Handle pokemon PUT route
app.put("/pokemon/:id", (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM pokemon_tb WHERE id=${id} LIMIT 1`;
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message };
      res.send(response);
    }

    const { id, name, height, weight, avatar } = { ...results[0], ...req.body };
    const query = `UPDATE pokemon_tb SET name='${name}', height='${height}', weight='${weight}', avatar='${avatar}' WHERE id='${id}'`;
    pool.query(query, (err, results, fields) => {
      if (err) {
        const response = { data: null, message: err.message };
        res.send(response);
      }

      const pokemon = {
        id,
        name,
        height,
        weight,
        avatar
      };
      const response = {
        data: pokemon,
        message: `Pokemon ${name} is successfully updated.`
      };
      res.send(response);
    });
  });
});

// Handler pokemon DELETE route
app.delete("/pokemon/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM pokemon_tb WHERE id=${id}`;
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message };
      res.send(response);
    }

    const response = {
      data: null,
      message: `Pokemon with id: ${id} successfully deleted.`
    };
    res.send(response);
  });
});

// Handle in-valid route
app.all("*", function(req, res) {
  const response = { data: null, message: "Route not found!!" };
  res.status(400).send(response);
});

// wrap express app instance with serverless http function
module.exports.handler = serverless(app);
```

**Terminal snapshot:**

![Terminal snapshot](https://thepracticaldev.s3.amazonaws.com/i/aq687tnep6b1r4foe0ok.png)

**Get all pokemon:**

![GET all pokemon](https://thepracticaldev.s3.amazonaws.com/i/rm9p406vuzo4owbd8rdm.png)

**Get pokemon by id:**

![GET pokemon](https://thepracticaldev.s3.amazonaws.com/i/qvri39i4itioieox3fjw.png)

**Add new pokemon:**

![Add new pokemon](https://thepracticaldev.s3.amazonaws.com/i/6sthaflagvclef6f2hol.png)

**Update existing pokemon:**

![Update existing pokemon](https://thepracticaldev.s3.amazonaws.com/i/ogopnd776x0wx0b63679.png)

**Delete existing pokemon:**

![Delete existing pokemon](https://thepracticaldev.s3.amazonaws.com/i/ktbormln4t88bahr7b2s.png)

### Deployment

Deloying services with serverless framework is so simple, we require to just hit deploy command.

```bash
serverless deploy
```

I have not setup a MySQL database on my AWS account hence RESTful services will not work on my AWS infrastructure. Later, I will deploy RESTful services to AWS infrastructure.

### Conclusion

Creating RESTful API with a serverless framework is pretty straightforward. For serverless, we have to switch our development workflow. I found that lots of companies are moving towards creating and managing micro-services architecture instead of the monolithic app. That's sound great.

### Closing Note

Thanks for reading. I hope you like this article feel free to like, comment or share this article with your friends. For more depth understanding of serverless framework checkout official documentation and blog of serverless.com.
