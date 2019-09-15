import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();
const uri = 'mongodb+srv://saurabhchauhan9194:abcd@cluster0-vgdc3.mongodb.net/test?retryWrites=true&w=majority';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/build')));

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser : true});
        const db = client.db('my-blog');
        await operations(db);
        client.close();
    }   catch ( error) {
        res.status(500).json({message : 'Error connecting to db', error});
    }
}

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({ name : articleName});
        await db.collection('articles').updateOne({ name : articleName} , {
            '$set' : {
                upvotes : articleInfo.upvotes + 1
            }
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name : articleName});
        res.status(200).json(updatedArticleInfo);
    }, res)
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text} = req.body;
    const articleName = req.params.name;
    console.log(req)
    withDB(async (db) => {
        const articlesInfo = await db.collection('articles').findOne( { name : articleName});
        await db.collection('articles').updateOne({name : articleName}, {
            '$set' : {
                comments : articlesInfo.comments.concat({ username, text})
            }
        });

        const updatedArticleInfo = await db.collection('articles').findOne({name : articleName});
        res.status(200).json(updatedArticleInfo);   
    }, res);
});

app.get('/api/articles/:name', async (req, res) => {
        withDB(async(db) => {
            const articleName = req.params.name;
            const articlesInfo = await db.collection('articles').findOne( { name : articleName});
            res.status(200).json(articlesInfo);
        }, res)
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Server is listening on port 8000'));