const Models = require('../models');
const { check, validationResult } = require('express-validator/check');
const { normalizeErrorResponse } = require('../helpers/helpersCollection');
const {upload} = require('../middlewares/multer');

const idCheck = (modelName) => {
    return [
        check('id').exists().trim().not().isEmpty().toInt()
            .isInt({min: 1})
            .custom(async (id) => {
                const checkDrink = await Models[modelName].findOne({
                    where: {id}
                });

                return checkDrink !== null;
            }).withMessage('The record not found'),
    ]
};

const errorsCheck = (req, res, next) => {
    let errorFormatter = ({ msg, nestedErrors }) => {
        if (nestedErrors) {
            let modifiedArr = {};
            const map = new Map();
            for (const item of nestedErrors) {
                if(!map.has(item.param)){
                    map.set(item.param, true);
                    modifiedArr[item.param] = item.msg;
                }
            }
            return modifiedArr;
        }
        return msg
    };
    let result = validationResult(req).formatWith(errorFormatter);

    if (!result.isEmpty()) {
        return res.status(422).json(result.mapped());
    }else {
        next();
    }
};

const multerErrorsCheck = (req, res, next) => {
    const contentType = req.headers['content-type'].split(';');
    if(contentType[0] === 'multipart/form-data') {
        upload(req, res, function (err) {
            if (err) {
                return res.status(422).json(normalizeErrorResponse(err.message));
            } else  if (!req.file) {
                return res.status(422).json(normalizeErrorResponse('Please select an image to upload'));
            }
            next();
        });
    } else{
        next();
    }
};

module.exports = {idCheck, errorsCheck, multerErrorsCheck} ;
