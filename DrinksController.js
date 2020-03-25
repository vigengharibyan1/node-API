const { normalizeResponseData, normalizeErrorResponse, paginate, deleteImages} = require('../helpers/helpersCollection');
const OptionGroup = require('../models').OptionGroup;
const Drink = require('../models').Drink;
const DrinkOptionGroup = require('../models').DrinkOptionGroup;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

async function get(req, res) {
    const { page, itemsPerPage, search } = req.query;

    let options = {
        order: [
            ['updatedAt', 'DESC'],
        ],
        include: [
            {
                attributes: [
                    'id', 'name'
                ],
                model: OptionGroup,
                as: 'optionGroups',
                through: {attributes: []},
                required: false,
            }
        ],
        subQuery:false
    };

    if(page && itemsPerPage > -1) {
        const {limit, offset} = paginate(page, itemsPerPage);
        options.limit = limit;
        options.offset = offset;
    }
    if (search) {
        options.where = {
            [Op.or]: [
                {
                    name: {
                        [Op.like]: `%${search}%`
                    }
                },
                {
                    drinkDescription: {
                        [Op.like]: `%${search}%`
                    }
                },
                {
                    "$optionGroups.name$" : {
                        [Op.like]: `%${search}%`
                    }
                }
            ],
        }
    }
    let drinks;
    try {
        drinks = await Drink.findAll(options);
    }catch (error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
    }
    if(!drinks.length) {
        return res.status(404).json(normalizeErrorResponse( 'The records not found'));
    }

    return res.status(200).json(normalizeResponseData(drinks));
}

async function create(req, res) {
    const { optionGroups, ...data } = req.body;

    let checkOpGroups;
    try {
        checkOpGroups = await OptionGroup.findAll({
            where: {
                id: optionGroups
            },
            raw: true
         },
        )
    } catch (error)  {
        return res.status(400).json(normalizeErrorResponse( 'Something went wrong, please try again.'));
    }

    if(!checkOpGroups.length) {
        return res.status(400).json(normalizeErrorResponse( 'Wrong passed option groups data.'));
    }

    let insertedDrink;
    try {
        data.image = req.file.filename;
        insertedDrink = await Drink.create(data);
    }catch (error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
    }

    const bulkData = optionGroups.map((item) => {
       return {drink_id: insertedDrink.id, option_group_id: item}
    });

    let responseData;
    try {
        await DrinkOptionGroup.bulkCreate(bulkData);
        if(insertedDrink) {
            const currentOpGroups = await OptionGroup.findAll({
                    order: [
                        ['updatedAt', 'DESC'],
                    ],
                    attributes: [
                        'id', 'name'
                    ],
                    where: {
                        id: optionGroups
                    },
                    raw: true
                },
            );
            responseData = {...insertedDrink.dataValues, optionGroups: currentOpGroups};
        }
    }catch (error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
    }
    return res.status(200).json(normalizeResponseData(responseData, 'Row successfully created.'));
}

async function update(req, res) {
    let { optionGroups, ...data } = req.body;

    const file = req.file;
    const drinkId = req.params.id;

    let updateData;
    if(Object.keys(data).length || file) {
        updateData = {
            ...data,
        };

        if(file) {
            updateData.image = req.file.filename;
            const drink = await Drink.findOne({
                attributes: [
                    'image', 'thumbnail'
                ],
                where: {id: drinkId}
            });
            const filesForDelete = [drink.image, `thumbnails/${drink.thumbnail}`];
            deleteImages(filesForDelete);
        }
        try {
            await Drink.update(updateData, {
                where: {
                    id: drinkId
                }
            });
        } catch(error) {
            return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
        }
    }

    if(optionGroups && optionGroups.length) {
        let getAllOptionGroups;
        try {
            getAllOptionGroups = await DrinkOptionGroup.findAll({
                attributes: [
                    'option_group_id'
                ],
                where: {
                    drink_id: drinkId
                },
                raw: true
            });
        }catch (error) {
            return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
        }
        getAllOptionGroups = getAllOptionGroups.map(v => v.option_group_id);
        let matchedOpGroupsIndexes = [];

        const noMatchedOpGroupsIds = getAllOptionGroups.filter((item) => {
            const matchIndex = optionGroups.indexOf(item);
            if(matchIndex !== -1) {
                matchedOpGroupsIndexes.push(matchIndex)
            }
            return matchIndex === -1;
        });

        const newOpGroupsIds = optionGroups.filter((id, index) => {
            return !matchedOpGroupsIndexes.includes(index);
        });

        if(noMatchedOpGroupsIds.length) {
            try{
                await DrinkOptionGroup.destroy({
                    where: {option_group_id: noMatchedOpGroupsIds}
                });
            } catch(error) {
                return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
            }
        }

        if(newOpGroupsIds.length) {
            const bulkData = newOpGroupsIds.map((item) => {
                return {drink_id: drinkId, option_group_id: item}
            });

            try{
                await DrinkOptionGroup.bulkCreate(bulkData);
            } catch(error) {
                return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
            }
        }
        updateData.optionGroups = await OptionGroup.findAll({
            order: [
                ['updatedAt', 'DESC'],
            ],
            attributes: [
                'id', 'name'
            ],
            where: {
                id: optionGroups
            },
            raw: true
        });
    }

    return res.status(200).json(normalizeResponseData({id: drinkId, ...updateData}, 'Row successfully updated.'));
}

async function remove(req, res) {
    const id = req.params.id;

    try{
        const drink = await Drink.findOne({
            attributes: [
                'image', 'thumbnail'
            ],
            where: {
                id
            }
        });
        const filesForDelete = [drink.image, `thumbnails/${drink.thumbnail}`];
        deleteImages(filesForDelete);

        await Drink.destroy({
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
