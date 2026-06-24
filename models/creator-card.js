const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');
const { Schema } = require('mongoose');

const modelName = 'creatorCards';

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  title: { type: SchemaTypes.String, required: true },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, required: true, unique: true },
  creator_reference: { type: SchemaTypes.String, required: true },
  links: [
    new Schema(
      {
        title: { type: SchemaTypes.String, required: true },
        url: { type: SchemaTypes.String, required: true },
      },
      { _id: false }
    ),
  ],
  service_rates: {
    currency: { type: SchemaTypes.String },
    rates: [
      new Schema(
        {
          name: { type: SchemaTypes.String, required: true },
          description: { type: SchemaTypes.String },
          amount: { type: SchemaTypes.Number, required: true },
        },
        { _id: false }
      ),
    ],
  },
  status: { type: SchemaTypes.String, required: true },
  access_type: { type: SchemaTypes.String, default: 'public' },
  access_code: { type: SchemaTypes.String },
  created: { type: SchemaTypes.Number, required: true },
  updated: { type: SchemaTypes.Number, required: true },
  deleted: { type: SchemaTypes.Number, default: 0 },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });
module.exports = DatabaseModel.model(modelName, modelSchema, { paranoid: true });
