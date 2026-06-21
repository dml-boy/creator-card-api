/* eslint-disable camelcase */
const { createHandler } = require('@app-core/server');
const retrieveCardService = require('@app/services/creator-cards/retrieve-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const { slug } = rc.params;
    const { access_code } = rc.query;

    const response = await retrieveCardService({ slug, access_code });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Retrieved Successfully.',
      data: response,
    };
  },
});
