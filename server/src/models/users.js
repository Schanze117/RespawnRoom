import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';

export class User extends Model {
}

export function UserFactory(sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for Google auth users
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: 'users',
      sequelize,
      timestamps: false,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const saltRounds = 10;
            user.password = await bcrypt.hash(user.password, saltRounds);
          }
        },
      },
    }
  );

  return User;
}

export default User;