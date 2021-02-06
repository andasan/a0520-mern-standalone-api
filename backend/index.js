require('dotenv').config()
const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const { graphqlHTTP } = require('express-graphql')
const multer = require('multer')

const graphqlSchema = require('./graphql/schema')
const graphqlResolvers = require('./graphql/resolvers')
const fileUpload = require('./middlewares/file-upload')
const auth = require('./middlewares/is-auth')
const { clearImage } = require('./util/file')

const app = express()

app.use(cors())

//Parser
app.use(express.urlencoded({ extended: true, limit: '50mb' })) //x-www-form-urlencoded
app.use(express.json({ limit: '50mb'})) //application/json

//Serving images statically
app.use(
  '/uploads/images',
  express.static(path.join(__dirname, 'uploads', 'images'))
)

app.use(multer(fileUpload).single('image'))

//Check authorization
app.use(auth)

//Post-image route
app.post('/post-image', (req, res, next) => {
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided' })
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath)
  }
  return res
    .status(201)
    .json({ message: 'File stored.', filePath: req.file.path })
})

app.use(
  '/graphql',
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    graphiql: true,
    customFormatErrorFn: (error) => {
      return {
        code: error?.originalError?.code,
        data: error?.originalError?.data,
        message: error?.message,
      }
    },
  })
)

//Catch-All-Error-Middleware
app.use((error, req, res, next) => {
  const { message, data } = error
  const status = error.statusCode || 500
  res.status(status).json({ message, data })
})

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => {
    const PORT = process.env.PORT || 8080
    app.listen(PORT, () => console.log(`Server connect to port: ${PORT}`))
  })
  .catch((err) => console.log(err))
