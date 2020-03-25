const { normalizeResponseData, normalizeErrorResponse, paginate} = require('../helpers/helpersCollection');
const DrinkOption = require('../models').DrinkOption;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

async function get(req, res) {
    const { page, itemsPerPage, search } = req.query;
    let options = {
        order: [
            ['updatedAt', 'DESC'],
        ],
        attributes: [
            'id', 'name', 'price'
        ],
    };
    if (search) {
        options.where = {
            [Op.or]: [
                {
                    name: {
                        [Op.like]: `%${search}%`
                    }
                },
                {
                    price: {
                        [Op.like]: `%${search}%`
                    }
                },
            ],
        }
    }

    if(page && itemsPerPage > -1) {
        const {limit, offset} = paginate(page, itemsPerPage);
        options.limit = limit;
        options.offset = offset;
    }

    let drinkOptions;
    try {
        drinkOptions = await DrinkOption.findAll(options);
    }catch (error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
    }

    if(!drinkOptions.length) {
        return res.status(404).json(normalizeErrorResponse( 'The records not found'));
    }

    return res.status(200).json(normalizeResponseData(drinkOptions));
}

async function create(req, res) {
    const data = req.body;

    let createdDrinkOp;
    try {
        createdDrinkOp = await DrinkOption.create(data);
    }catch (error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
    }
    return res.status(200).json(normalizeResponseData(createdDrinkOp, 'Row successfully created.'));
}

async function update(req, res) {
    let data = req.body;
    const id = req.params.id;

    try {
        await DrinkOption.update(data, {
            where: {
                id
            }
        });
    } catch(error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
    }
    return res.status(200).json(normalizeResponseData(null, 'Row successfully updated.'));
}

async function remove(req, res) {
    const id = req.params.id;

    try{
        await DrinkOption.destroy({
            where: {
                id
            }
        })
    }catch (error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
    }

    return res.status(200).json(normalizeResponseData(null, 'Row successfully deleted.'));
}

module.exports = {create, get, update, remove};
