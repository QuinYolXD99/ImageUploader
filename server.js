const express = require('express')
const app = express()
const multer = require('multer');
const Model = require('./model/image')
const path = require('path');
const cors = require('cors')
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors())

app.use('/files', express.static(path.join(__dirname, 'uploads')))


const PORT = 5000
var imgUrl = `http://localhost:${PORT}/files/`

//Connect to DB
const mongoose = require('mongoose')
const mongoURI = "mongodb://localhost:27017/Images"
mongoose.Promise = global.Promise;
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}, (err, data) => {
    if (err) {
        console.log("error : " + err);
    } else {
        console.log("database is connected!");
    }
});

var ImageSchema = mongoose.Schema({
    name: String,
    src: String
});

// compile schema to model
var Image = mongoose.model('Image', ImageSchema, 'images'); //images is the collection

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function(req, file, cb) {
        var filename = `uploads_${Math.round(+new Date()/1000)}_${file.originalname}`
        cb(null, filename)
    }
})

var upload = multer({ storage: storage, limits: { fileSize: 1000000000 } })


// note 'img' in upload is the key you use in FormData in frontend
//e.g : var data =  new FormData()
// data.append('img' ,uploadedFiles)

app.post('/uploadMultiple', upload.array('img'), (req, res, next) => {
    const imgs = req.files
    if (!imgs) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    } else {
        imgs.map(img => {
            let src = `${imgUrl}${img.filename}`; //save this to db  
            var new_img = new Image({ name: img.filename, src: src });
            // save model to database
            new_img.save(function(err, imgSaved) {
                if (err) return console.error(err);
                console.log(imgSaved.name + " saved to images collection.");
            });
            img.src = `http://localhost:${PORT}/static/uploads/${img.filename}`
        })
        res.send(imgs)
    }
})


app.post('/uploadSingle', upload.single('img'), (req, res, next) => {
    const img = req.file
    if (!img) {
        const error = new Error('Please select a file')
        error.httpStatusCode = 400
        return next(error)
    } else {
        store(img.filename)
        res.send("success")
    }
})

app.listen(PORT, () => {
    console.log(`server running at ${PORT}`);
})
