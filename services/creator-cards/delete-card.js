/* eslint-disable camelcase */
const { throwAppError } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');

async function deleteCard({ slug, creator_reference }) {
  if (!slug) {
    throwAppError('Slug is required', 'VALIDATIONERR');
  }
  if (!creator_reference) {
    throwAppError('creator_reference is required', 'VALIDATIONERR');
  }

  // 1. Find the active card
  const card = await creatorCardRepository.findOne({ query: { slug } });
  if (!card) {
    throwAppError('Creator card not found', 'NF01');
  }

  // 2. Verify ownership
  if (card.creator_reference !== creator_reference) {
    throwAppError('Permission denied', 'VALIDATIONERR');
  }

  // 3. Soft delete using repository
  await creatorCardRepository.deleteOne({ query: { slug } });

  // 4. Retrieve the updated document (using raw mongoose model to bypass the deleted filter)
  const Model = creatorCardRepository.raw();
  const deletedCard = await Model.findOne({ _id: card._id }).lean();

  return {
    id: deletedCard._id,
    title: deletedCard.title,
    description: deletedCard.description || null,
    slug: deletedCard.slug,
    creator_reference: deletedCard.creator_reference,
    links: deletedCard.links || [],
    service_rates: deletedCard.service_rates || null,
    status: deletedCard.status,
    access_type: deletedCard.access_type,
    access_code: deletedCard.access_code,
    created: deletedCard.created,
    updated: deletedCard.updated,
    deleted: deletedCard.deleted,
  };
}

module.exports = deleteCard;
