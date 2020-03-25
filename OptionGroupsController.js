const { normalizeResponseData, normalizeErrorResponse, paginate} = require('../helpers/helpersCollection');
const OptionGroup = require('../models').OptionGroup;
const DrinkOption = require('../models').DrinkOption;
const OptionGroupDrinkOption = require('../models').OptionGroupDrinkOption;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

async function get(req, res) {
    let optionGroups;
    const { page, itemsPerPage, search } = req.query;

    let options = {
        order: [
            ['updatedAt', 'DESC'],
        ],
       include: [{
           attributes: [
               'id', 'name', 'price'
           ],
           model: DrinkOption,
           as: 'options',
           through: {attributes: []},
           required: false,
       }],
        subQuery:false
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
                    selectionType: {
                        [Op.like]: `%${search}%`
                    }
                },
                {
                    "$options.name$" : {
                        [Op.like]: `%${search}%`
                    }
                }
            ],
        }
    }

    if(page && itemsPerPage > -1) {
        const {limit, offset} = paginate(page, itemsPerPage);
        options.limit = limit;
        options.offset = offset;
    }

    try {
        optionGroups = await OptionGroup.findAll(options);
    }catch (error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.', ));
    }
    if(!optionGroups.length) {
        return res.status(404).json(normalizeErrorResponse( 'The records not found'));
    }
    return res.status(200).json(normalizeResponseData(optionGroups));
}

async function create(req, res) {
    const { options, ...data } = req.body;

    let checkDrinkOptions;
    try {
        checkDrinkOptions = await DrinkOption.findAll({
                where: {
                    id: options
                },
                raw: true
            },
        )
    } catch (error)  {
        return res.status(400).json(normalizeErrorResponse( 'Something went wrong, please try again.'));
    }

    if(!checkDrinkOptions.length) {
        return res.status(400).json(normalizeErrorResponse( 'Wrong passed drink options data.'));
    }

    let insertedOpGroup;
    try {
        insertedOpGroup = await OptionGroup.create(data);
    }catch (error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
    }

    const bulkData = options.map((item) => {
        return {option_group_id: insertedOpGroup.id, drink_option_id: item}
    });

    let responseData;
    try {
        await OptionGroupDrinkOption.bulkCreate(bulkData);
        if(insertedOpGroup) {
            const currentDrOptions = await DrinkOption.findAll({
                    order: [
                        ['updatedAt', 'DESC'],
                    ],
                    attributes: [
                        'id', 'name'
                    ],
                    where: {
                        id: options
                    },
                    raw: true
                },
            );
            responseData = {...insertedOpGroup.dataValues, options: currentDrOptions};
        }
    }catch (error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
    }

    return res.status(200).json(normalizeResponseData(responseData, 'Row successfully created.'));
}

async function update(req, res) {
    let { options, ...data } = req.body;
    const optionGroupId = req.params.id;

    if(Object.keys(data).length) {
        try {
            await OptionGroup.update(data, {
                where: {
                    id: optionGroupId
                }
            });
        } catch(error) {
            return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
        }
    }
    if(options && options.length) {
        let getAllDrinkOptions;
        try {
            getAllDrinkOptions = await OptionGroupDrinkOption.findAll({
                attributes: [
                    'drink_option_id'
                ],
                where: {
                    option_group_id: optionGroupId
                },
                raw: true
            });
        }catch (error) {
            return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
        }

        getAllDrinkOptions = getAllDrinkOptions.map(v => v.drink_option_id);
        let matchedDrinkOpsIndexes = [];

        const noMatchedDrinkOpsIds = getAllDrinkOptions.filter((item) => {
            const matchIndex = options.indexOf(item);
            if(matchIndex !== -1) {
                matchedDrinkOpsIndexes.push(matchIndex)
            }
            return matchIndex === -1;
        });

        const newOptionsIds = options.filter((id, index) => {
            return !matchedDrinkOpsIndexes.includes(index);
        });

        if(noMatchedDrinkOpsIds.length) {
            try{
                await OptionGroupDrinkOption.destroy({
                    where: {drink_option_id: noMatchedDrinkOpsIds}
                });
            } catch(error) {
                return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
            }
        }

        if(newOptionsIds.length) {
            const bulkData = newOptionsIds.map((item) => {
                return {option_group_id: optionGroupId, drink_option_id: item}
            });

            try{
                await OptionGroupDrinkOption.bulkCreate(bulkData);
            } catch(error) {
                return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.'));
            }
        }

        data.options = await DrinkOption.findAll({
            order: [
                ['updatedAt', 'DESC'],
            ],
            attributes: [
                'id', 'name'
            ],
            where: {
                id: options
            },
            raw: true
        });
    }
    return res.status(200).json(normalizeResponseData({id: optionGroupId, ...data}, 'Row successfully updated.'));
}


async function remove(req, res) {
    const id = req.params.id;

    try{
        await OptionGroup.destroy({
            where: {
                id
            }
        })
    }catch (error) {
        return res.status(500).json(normalizeErrorResponse( 'An server error has occurred.', ));
    }

    return res.status(200).json(normalizeResponseData(null, 'Row successfully deleted.'));
}

module.exports = {create, get, update, remove};
