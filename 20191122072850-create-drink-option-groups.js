'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('drinks_option_groups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      drink_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      option_group_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
    })
    .then(() => queryInterface.addConstraint('drinks_option_groups', ['drink_id'], {
        type: 'FOREIGN KEY',
        name: 'DRINK_FOREIGN_KEY',
        references: {
          table: 'drinks',
          field: 'id',
        },
        onDelete: 'CASCADE',
      },
    ))
    .then(() => queryInterface.addConstraint('drinks_option_groups', ['option_group_id'], {
        type: 'FOREIGN KEY',
        name: 'OPTION_GROUP_FOREIGN_KEY',
        references: {
          table: 'option_groups',
          field: 'id',
        },
        onDelete: 'CASCADE',
        }
    ));
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('drinks_option_groups');
  }
};
