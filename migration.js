const { Sequelize, DataTypes } = require('sequelize');
const pg = require('pg');

// Database configuration
const mysqlConfig = {
    dialect: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    username: process.env.MYSQL_USER || 'narrativeuser',
    password: process.env.MYSQL_PASSWORD || 'password1234',
    database: process.env.MYSQL_DATABASE || 'narrativelab'
}

const pgConfig = {
    host: process.env.POSTGRES_HOST || 'aws-0-eu-west-3.pooler.supabase.com:5432',
    username: process.env.POSTGRES_USER || 'postgres.gugabgvobnoclgfxapsg',
    password: process.env.POSTGRES_PASSWORD || 'a6dWnzmh5hLaf3Vu3KdI',
    database: process.env.POSTGRES_DATABASE || 'postgres',
    ssl: true
}

// Initialize Sequelize instances
const mysqlSequelize = new Sequelize(mysqlConfig)
const postgresSequelize = new Sequelize(`postgresql://${pgConfig.username}:${pgConfig.password}@${pgConfig.host}/${pgConfig.database}`, {
    dialect: 'postgres',
    dialectModule: pg,
})

// Define models for both databases
function defineModels(sequelize) {
    const Book = sequelize.define('Book', {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        genre: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        resume: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        style: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        contentMarkdown: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
        }
    })

    const Chat = sequelize.define('Chat', {
        bookId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'Books',
            key: 'id',
          },
        },
        messages: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: [],
        },
      }, {
        indexes: [
          {
            fields: ['bookId'],
          },
        ],
      });

    const User = sequelize.define('User', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        firstname: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastname: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        credit: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        }
    })

    return { Book, Chat, User }
}

async function migrateData(){
    try {
        // Test dabase connection
        await mysqlSequelize.authenticate()
        console.log('MySQL connection successful')
        await postgresSequelize.authenticate()
        console.log('Postgres connection successful')

        // Define models for both databases
        const mysqlModels = defineModels(mysqlSequelize)
        const postgresModels = defineModels(postgresSequelize)

        //  Sync PostgreSQL models (create tables)
        await postgresSequelize.sync()

        // Migrate users
        console.log("Migrating users...")
        const users = await mysqlModels.User.findAll({
            raw: true,
        })

        if(users.length > 0) {
            await postgresModels.User.bulkCreate(users, {
                validate: true,
                return: false
            })
        }
        console.log(`Migrated ${users.length} users`)

        // Migrate books
        console.log("Migrating books...")
        const books = await mysqlModels.Book.findAll({
            raw: true,
        })

        if(books.length > 0) {
            await postgresModels.Book.bulkCreate(books, {
                validate: true,
                return: false
            })
        }
        console.log(`Migrated ${books.length} books`)

        // Migrate chats
        console.log("Migrating chats...")
        const chats = await mysqlModels.Chat.findAll({
            raw: true,
        })

        if(chats.length > 0) {
            await postgresModels.Chat.bulkCreate(chats, {
                validate: true,
                return: false
            })
        }
        console.log(`Migrated ${chats.length} chats`)

        console.log("Migration successful")

    } catch(err) {
        console.error(err)
        throw err
    } finally {
        // Close database connections
        await mysqlSequelize.close()
        await postgresSequelize.close()
    }
}

module.exports = { migrateData }