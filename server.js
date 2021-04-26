'use strict';

/////////////////////////
////// DEPENDENCIES ////
///////////////////////

require('dotenv').config();

const express= require('express');

const cors= require('cors');

const superagent = require('superagent');

const pg = require('pg');

const methodOverride=require('method-override');


/////////////////////////
////// App Setup    ////
///////////////////////

const PORT= process.env.PORT||3000;

const app= express();

app.use(cors());

app.use(express.urlencoded({ extended: true }));

const client = new pg.Client(process.env.DATABASE_URL);

// const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });

app.use(methodOverride('_method'));


/////////////////////////
////// Templating   ////
///////////////////////

app.use(express.static('./public'));
app.set('view engine', 'ejs');

/////////////////////////
////// ROUTES       ////
///////////////////////

app.get('/', homeHandler);

app.post('/addFav',insertFavHandler);
app.get('/addFav',renderFavHandler);
app.get('/alreadyAdded',alreadyAddedHandler);

app.get('/details/:id',detailsHandler);
app.put('/details/:id',editHandler);
app.delete('/details/:id',deleteHandler);

app.get('/random', randomJokeHandler)





/////////////////////////
////// Handlers     ////
///////////////////////

function homeHandler(req,res){
    const url= 'https://official-joke-api.appspot.com/jokes/programming/ten';
    superagent.get(url).then(data=>{
        const dataBody= data.body;
        const correctData=dataBody.map(e=>{
            return new JOKE(e);
        })
        res.render('pages/index', {data:correctData})
    })
}

function insertFavHandler(req,res){
    const {id,type,setup,punchline}= req.body;
    const safeValues=[id,type,setup,punchline];
    const SQL=`INSERT INTO table1 (id,type,setup,punchline) VALUES($1,$2,$3,$4);`;
    const searchSql= `SELECT * FROM table1 WHERE id='${id}';`;

    client.query(searchSql).then(searchedData=>{
        if(searchedData.rows.length===0){
            client.query(SQL,safeValues).then(()=>{
                res.redirect('/addFav')
            });
        } else if(searchedData.rows[0].id===id){
            res.redirect('/alreadyAdded');
        }
    })
}

function renderFavHandler(req,res){
    const SQL= 'SELECT * FROM table1;';

    client.query(SQL).then(data=>{
        res.render('pages/favJokes',{data:data.rows, count:data.rows.length})
    });
}

function alreadyAddedHandler(req,res){
    res.render('pages/alreadyAdded')
}

function detailsHandler(req,res){
    let id=req.params.id;
    let SQL=`SELECT * FROM table1 WHERE id=$1;`;
    const safeValues=[id];
    client.query(SQL,safeValues).then(data=>{
        res.render('pages/details',{data:data.rows[0]});
    })
}


function editHandler(req,res){
    const id= req.params.id;
    const {type,setup,punchline}= req.body;
    const safeValues=[type,setup,punchline,id];
    const SQL=`UPDATE table1 SET type=$1,setup=$2,punchline=$3 WHERE id=$4;`;
    
    client.query(SQL,safeValues).then(()=>{
        res.redirect(`/details/${id}`);
    });

    
}

function deleteHandler(req,res){
    const id= req.params.id;
    const SQL=`DELETE FROM table1 WHERE id=$1;`;
    const safeValues=[id];

    client.query(SQL,safeValues).then(()=>{
        res.redirect('/addFav');
    })
}
function randomJokeHandler(req,res){
    const url='https://official-joke-api.appspot.com/jokes/programming/random'
    superagent.get(url).then(data=>{
        const dataBody=data.body;
        res.render('pages/random',{data:dataBody[0]})
    })
}
/////////////////////////
////// Constructors ////
///////////////////////

function JOKE(data){
    this.id=data.id;
    this.setup=data.setup;
    this.type=data.type;
    this.punchline=data.punchline;
}


/////////////////////////
////// Listening    ////
///////////////////////

client.connect().then(()=>{
    app.listen(PORT,()=>{
        console.log(`listening on:${PORT}`)
    })
})