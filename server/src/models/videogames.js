import { DataTypes, Model } from 'sequelize';

export class VideoGame extends Model {
}

export function VideoGameFactory(sequelize) {
  VideoGame.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      genre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'videogames',
      sequelize,
    }
  );

  return VideoGame;
}