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
        type: DataTypes.TEXT,
        allowNull: false,
      },
      genres: {
        type: DataTypes.ARRAY(DataTypes.STRING), // Use ARRAY type for genres
        allowNull: false,
      },
      player_perspectives: {
        type: DataTypes.ARRAY(DataTypes.STRING), // Use ARRAY type for player_perspectives
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT,
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