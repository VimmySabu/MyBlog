const express=require('express');
const bodyParser=require('body-parser');
const mongoClient=require('mongodb').MongoClient;
const path  = require('path');

const app=express();

app.use(express.static(path.join(__dirname,'/src/build')))
app.use(bodyParser.json())

const withDB=async(operations,res)=>{
    try{
       
        const client=await mongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true })
        const db=client.db('my-blog')
        await operations(db);
        client.close();
    }
    catch(error){
        console.log(error)
        res.status(500).json({message:'Error containing to db',error});
    }
}


app.get('/api/articles/:name',async(req,res)=>{
  withDB(async(db)=>{
    const articleName=req.params.name;
    const articlesInfo=await db.collection('articles').findOne({name:articleName})
    res.status(200).json(articlesInfo)

  },res);
        
})

app.post('/api/articles/:name/upvote',async(req,res)=>{
    withDB(async(db)=>{
        const articleName=req.params.name;
        const articlesInfo=await db.collection('articles').findOne({name:articleName})
        await db.collection('articles').updateOne({ name: articleName },{
            '$set':{
                upvote: articlesInfo.upvote + 1,
            }
        })
        const updatedArticleInfo=await db.collection('articles').findOne({name:articleName})
        res.status(200).json(updatedArticleInfo)
    },res)
    
    
})



app.post('/api/articles/:name/add-comment',async(req,res)=>{
    const {username,text}=req.body;
    const articleName=req.params.name;
    withDB(async(db)=>{
        const articlesInfo=await db.collection('articles').findOne({name:articleName})
        await db.collection('articles').updateOne({name:articleName},{
            '$set':{
                comments:articlesInfo.comments.concat({username,text})
            }
        })
        const updatedArticleInfo=await db.collection('articles').findOne({name:articleName})
        res.status(200).json(updatedArticleInfo)
    },res)

})

app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname,'/src/build/index.html'))
})

app.listen(8000,()=>console.log("Server up on 8000"))