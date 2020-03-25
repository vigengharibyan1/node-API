const sharp = require('sharp');
const path = require('path');

const resizeImage = async (req, res, next) => {
    if (!req.file) return next();
    const thumbName =  req.file.filename.replace(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/, '.webp');
    await sharp(req.file.path)
        .resize(100)
        .toFormat('webp')
        .webp({quality: 50})
        .toFile(
            path.resolve(req.file.destination, 'thumbnails', thumbName)
        );
    req.body.thumbnail = thumbName;
    next();
};

module.exports = resizeImage;