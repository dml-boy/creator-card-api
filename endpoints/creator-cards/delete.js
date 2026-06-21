/* eslint-disable camelcase */
const { createHandler } = require('@app-core/server');
const deleteCardService = require('@app/services/creator-cards/delete-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async handler(rc, helpers) {
    const { slug } = rc.params;
    const { creator_reference } = rc.body;

    const response = await deleteCardService({ slug, creator_reference });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Deleted Successfully.',
      data: response,
    };
  },
});
