const multer = require('multer');
const {v4: uuidv4} = require('uuid');

const MIME_TYPE_MAP = {
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
}

const fileUpload = {
    limit: 50000000, //bytes, 50mb
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, 'uploads/images');
        },
        filename: (req, file, callback) => {
            const ext = MIME_TYPE_MAP[file.mimetype];
            callback(null, `${uuidv4()}.${ext}`)
        }
    }),
    fileFilter: (req, file, callback) => {
        const isValid = !!MIME_TYPE_MAP[file.mimetype];
        let error = isValid ? null : new Error('Invalid mime type');
        callback(error, isValid);
    }
};

module.exports = fileUpload;