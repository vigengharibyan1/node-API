node version 10.15.3
npm version 6.11.3
mysql 5.7
# Install packages
npm install
# check db configs in config directory development
# migrate all tabels to database
npx sequelize-cli db:migrate

# seed all mock data
npx sequelize-cli db:seed:all

# RUN 
npm start
