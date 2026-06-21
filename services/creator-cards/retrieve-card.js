/* eslint-disable camelcase */
const { throwAppError } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');

async function retrieveCard({ slug, access_code }) {
  if (!slug) {
    throwAppError('Slug is required', 'VALIDATIONERR');
  }

  // 1. Check if card exists and is active (not soft deleted)
  const card = await creatorCardRepository.findOne({ query: { slug } });
  if (!card) {
    throwAppError('Creator card not found', 'NF01');
  }

  // 2. Check if status is draft
  if (card.status === 'draft') {
    throwAppError('Creator card not found', 'NF02');
  }

  // 3. Access controls for private card
  if (card.access_type === 'private') {
    if (!access_code) {
      throwAppError('This card is private. An access code is required', 'AC03');
    }
    if (card.access_code !== access_code) {
      throwAppError('Invalid access code', 'AC04');
    }
  }

  // 4. Return serialized data (omit access_code entirely)
  return {
    id: card._id,
    title: card.title,
    description: card.description || null,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links: card.links || [],
    service_rates: card.service_rates || null,
    status: card.status,
    access_type: card.access_type,
    created: card.created,
    updated: card.updated,
    deleted: null,
  };
}

module.exports = retrieveCard;
