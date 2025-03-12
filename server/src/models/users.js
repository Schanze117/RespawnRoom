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
        allowNull: false,
      },
    },
    {
      tableName: 'users',
      sequelize,
      timestamps: false,
      hooks: {
        beforeCreate: async (user) => {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(user.password, saltRounds);
          user.password = hashedPassword;
        },
      },
    }
  );

  return User;
}

export default User;