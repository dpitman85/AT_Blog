// Modules
let sql;
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const formidable = require('formidable');
const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios');

// Define File Validation Function
const isFileValid = (file) => {
    const type = file.mimetype.split('/').pop();
    const validTypes = ['jpg', 'jpeg', 'png'];
    if (validTypes.indexOf(type) === -1) {
        return false;
    }
    return true;
};

// Define Slack API Function
async function slackMessage(channel, botMessage) {
    const url = 'https://slack.com/api/chat.postMessage';
    const res = await axios.post(url, {
        channel: channel,
        text: botMessage,
        username: 'Jaberg Update Bot'
    }, { headers: {authorization: `Bearer ${slackToken}`}});

    console.log('Done', res.data);
}

// Express Server
var app = express();

// Settings & Initialization (DB & Directories)
const port = 8080;
const slackToken = 'xoxb-432301170199-1283616219170-0AaF3r8bAmrpZNKId254hQ2W';
const slackChannel = '#at-blog-test'; //change to '#a_whole_lotta_walkin' when ready to deploy
const dbPath = path.join(__dirname, "AT_Log.db");
var db = new sqlite3.Database(dbPath);
const uploadFolder = path.join(__dirname, "public/images/uploads");
const thumbnailFolder = uploadFolder + "/thumbnails";

if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
if (!fs.existsSync(thumbnailFolder)) fs.mkdirSync(thumbnailFolder);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', express.static(path.join(__dirname, 'public')));

// Initialize database table if it does not exist with columns rowid (default INTEGER PRIMARY KEY), postImage (TEXT UNIQUE), postText (TEXT), postDate (TEXT UNIQUE)
db.run('CREATE TABLE IF NOT EXISTS posts (postImage TEXT, postImageThumb TEXT, postText TEXT, postDate TEXT UNIQUE)');

//ROUTES

// Main Feed (Home) - Limit to 20 posts
app.get('/', (req, res) => {
    let sql = 'SELECT rowid id, postImage postImage, postImageThumb postImageThumb, postText postText, postDate postDate FROM posts ORDER BY rowid';
    db.all(sql, [], (err, rows) => {
        if(err) {
            throw err;
        }
        var rowsSegment = rows.slice(-10);

        res.render('index', {
            posts: rowsSegment.reverse()
        });
    });
});

// Full Feed - All Posts
app.get('/full', (req, res) => {
    let sql = 'SELECT rowid id, postImage postImage, postImageThumb postImageThumb, postText postText, postDate postDate FROM posts ORDER BY rowid';
    db.all(sql, [], (err, rows) => {
        if(err) {
            throw err;
        }
        
        res.render('index', {
            posts: rows.reverse()
        });
    });
});

// NEW POST

// New Post Form Page
app.get('/form', (req, res) => res.render('form'));

// Route for adding Post to database
app.post('/form', (req, res) => {
    var form = new formidable.IncomingForm();
    
    // Form Attributes
    form.maxFileSize = 50 * 1024 * 1024; //50mb max
    form.uploadDir = uploadFolder;
    
    // Parsing
    form.parse(req, async (err, fields, files) => {
        
        // Define field constants
        const file = files.postImage; //name based on name of file input in form
        const date = new Date();
        const dateTime = `${date.toLocaleDateString()}, ${date.toLocaleTimeString()}`;
        const textbox = fields.postBody; //name based on textarea name in form

        if (file.size > 0) {
            const isValid = isFileValid(file); // check to see if file type matches valid extensions
            const type = file.mimetype.split('/').pop(); // isolate extension for renaming
            var fileName = encodeURIComponent(file.newFilename.replace(/\s/g, '-')) + '.' + type; // remove spaces and add extension to file name
            var fileNamePath = path.join(uploadFolder, fileName);
            var thumbName = encodeURIComponent(file.newFilename.replace(/\s/g, '-')) + '_thumbnail' + '.' + type;
            var thumbNamePath = path.join(uploadFolder, 'thumbnails/' + thumbName);
                        
            if (!isValid) {
                fs.unlink(file.filepath, (err) => { // delete invalid file from system
                    if(err) console.log(err);
                });
                return res.status(400).json({ //return error if file is not valid type (update to render on form page via EJS)
                    status: "Fail",
                    message: "The file type is not a valid type",
                });
                
            }
            try {
                fs.renameSync(file.filepath, path.join(uploadFolder, fileName)); // rename file in system
            } catch (error) {
                console.log(error);
            }
            try {
                sharp(fileNamePath).resize({ height: 500 }).toFile(thumbNamePath)
                    .then((newFileInfo) => {
                        console.log("Success");
                        res.redirect('/');
                    })
                    .catch((err) => {
                        console.log("Error occured");
                    }); 
            } catch (error) {
                console.log(error);
            }
        } else {
            fs.unlink(file.filepath, (err) => { // delete invalid file from system
                if(err) console.log(err);
            });
            var fileName = ''; // leave filename as blank string if no file is uploaded
        }

        // Insert post into database
        try {
            db.serialize(() => {
                db.run('INSERT INTO posts (postImage, postImageThumb, postDate, postText) VALUES(?,?,?,?)', [fileName, thumbName, dateTime, textbox], (err) => {
                    if(err) {
                        return console.log(err.message);
                    }
                });
            });
        } catch (error) {
            res.send(error);
        }
        
        if (err) {
            console.log("Error parsing the files");
            return res.status(400).json({ // return error if file parsing fails (update to render on form page via EJS)
                status: "Fail",
                message: "There was an error parsing the files",
                error: err,
            });
        }
    });
    slackMessage(slackChannel, 'Jaberg has posted a trail update at http://yesmountainovermountains.com').catch(err => console.log(err));
    res.redirect('/');
});

// DELETE POST

// Delete Confirmation Page
app.get('/delete/:id', (req, res) => {
    let sql = `SELECT rowid id, postImage postImage, postImageThumb postImageThumb, postText postText, postDate postDate FROM posts WHERE rowid = ${req.params.id}`;
    db.all(sql, [], (err, rows) => {
        if(err) {
            throw err;
        }
        if(!rows.length) {
            return res.send('That post does not exist<br><a href="/">Return Home</a>');
        }

        res.render('delete', {
            posts: rows.reverse()
        });
    });
});

// Delete Post Message
app.post('/delete/:id', (req, res) => {
    let sqlS = `SELECT rowid id, postImage postImage, postImageThumb postImageThumb, postText postText, postDate postDate FROM posts WHERE rowid = ${req.params.id}`;
    db.all(sqlS, [], (err, rows) => {
        if(err) {
            throw err;
        }
        fs.unlink(`${uploadFolder}/${rows[0].postImage}`, (err) => {
            if(err) console.log(err);
        });
        fs.unlink(`${thumbnailFolder}/${rows[0].postImageThumb}`, (err) => {
            if(err) console.log(err);
        });
    });
    let sqlD = `DELETE FROM posts WHERE rowid = ${req.params.id}`;
    db.run(sqlD, [], (err) => {
        if(err){
            console.log(err)
        }
        else{
            console.log("Successful");
        }
    });
      
    res.redirect('/');
});

// MODIFY POST

// Modification Page
app.get('/edit/:id', (req, res) => {
    let sql = `SELECT rowid id, postImage postImage, postImageThumb postImageThumb, postText postText, postDate postDate FROM posts WHERE rowid = ${req.params.id}`;
    db.all(sql, [], (err, rows) => {
        if(err) {
            throw err;
        }
        if(!rows.length) {
            return res.send('That post does not exist<br><a href="/">Return Home</a>');
        }

        res.render('edit', {
            posts: rows.reverse()
        });
    });
});

// Modify Post Message
app.post('/edit/:id', (req, res) => {
    var form = new formidable.IncomingForm();
    
    // Parsing
    form.parse(req, async (err, fields, files) => {
        const textbox = fields.postBody; //name based on textarea name in form
        console.log(fields);
        console.log(textbox);
        // Update post in database
            try {
                db.serialize(() => {
                    db.run(`UPDATE posts SET postText = ? WHERE rowid = ?`, [textbox, req.params.id], (err) => {
                        if(err) {
                            return console.log(err.message);
                        }
                    });
                });
            } catch (error) {
                res.send(error);
            }
    });
    res.redirect('/');
});


// Launch Server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});