const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Deploy = sequelize.define('Deploy', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  templatePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deployProjectPath: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  deployName: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['templatePath']
    },
    {
      unique: true,
      fields: ['deployProjectPath']
    },
    {
        unique: true,
        fields: ['deployName']
    }
  ]
});

module.exports = Deploy;
