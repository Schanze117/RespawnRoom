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
      cover: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      genres: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      player_perspectives: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      summary: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'videogames',
      sequelize,
      timestamps: false,
    }
  );

  return VideoGame;
}